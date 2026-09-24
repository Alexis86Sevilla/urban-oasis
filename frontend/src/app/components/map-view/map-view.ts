import { ChangeDetectionStrategy, Component, AfterViewInit, inject, effect, signal } from '@angular/core';
import { OasisService } from '../../services/oasis';
import { LocationService } from '../../services/location';
import { OasisSpot } from '../../models/oasisSpot';
import { OasisSpotType } from '../../enum/oasisSpotType';
import { distanceMeters, formatDistance } from '../../utils/geo';

declare var L: any;

@Component({
  selector: 'app-map-view',
  imports: [],
  templateUrl: './map-view.html',
  styleUrl: './map-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapView implements AfterViewInit {
  private map: any = undefined;
  private clusterGroup = L.markerClusterGroup({
    chunkedLoading: true,
    maxClusterRadius: 40,
    disableClusteringAtZoom: 17
  });
  private readonly oasisService = inject(OasisService);
  private readonly locationService = inject(LocationService);
  private isMapReady = signal(false);
  private userMarker: any = undefined;
  private userCircleAccuracy: any = undefined;

  /**
   * Built once per catalogue load, keyed by spot id. Filter changes diff
   * against this registry and add/remove already-built layers in bulk
   * instead of tearing down and recreating every marker — with ~1500 spots,
   * a `clearLayers()` + rebuild on every filter tap or GPS update is
   * expensive and was the previous behaviour.
   */
  private readonly markers = new Map<string, any>();
  private selectedMarkerId: string | null = null;

  constructor() {
    // Build the marker registry once per catalogue load. Visibility
    // (filtering) is handled separately below and never re-enters here.
    effect(() => {
      const oases = this.oasisService.oases();
      const ready = this.isMapReady();

      if (!ready || !this.map) return;

      this.clusterGroup.clearLayers();
      this.markers.clear();
      this.selectedMarkerId = null;

      oases.forEach(o => {
        const marker = L.marker([o.latitude, o.longitude], {
          icon: this.getIconForType(o.type),
          // Markers are not the keyboard path — the sheet's row list is.
          // Keeping them out of the tab order avoids ~1500 unlabeled stops.
          keyboard: false,
        });
        marker.on('click', () => this.oasisService.select(o.id));
        marker.on('add', () => this.applyMarkerAccessibleName(marker, o));
        this.markers.set(o.id, marker);
      });

      this.syncVisibleLayers(this.oasisService.filteredOases());
    });

    // Filter changes: diff the already-built registry and add/remove layers
    // in bulk rather than rebuilding anything.
    effect(() => {
      const filtered = this.oasisService.filteredOases();
      const ready = this.isMapReady();

      if (!ready || !this.map) return;

      this.syncVisibleLayers(filtered);
    });

    // Position updates only refresh each visible marker's distance in its
    // `aria-label` (a cheap attribute write) — they never rebuild markers.
    effect(() => {
      const position = this.locationService.position();
      const ready = this.isMapReady();

      if (!ready) return;

      this.oasisService.oases().forEach(o => {
        const marker = this.markers.get(o.id);
        const el = marker?.getElement();
        if (!el) return;
        el.setAttribute('aria-label', this.buildMarkerLabel(o, position));
      });
    });

    // User's own position: marker + accuracy circle, read directly from
    // `LocationService` now that the popup distance line (the sole reason
    // this component depended on `OasisService.actualPosition`) is retired.
    effect(() => {
      const position = this.locationService.position();
      const ready = this.isMapReady();

      if (!ready || !this.map || !position) return;

      const accuracy = position[2];

      if (this.userCircleAccuracy) {
        this.userCircleAccuracy.setLatLng(position);
        this.userCircleAccuracy.setRadius(accuracy);
      } else {
        this.userCircleAccuracy = L.circle(position, {
          radius: accuracy,
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.15,
          stroke: false
        }).addTo(this.map);
      }

      if (this.userMarker) {
        this.userMarker.setLatLng(position)
      } else {
        this.userMarker = L.marker(position, { icon: this.getUserIcon(), keyboard: false }).addTo(this.map);
      }

      this.map.flyTo(position, 18, {
        animate: true,
        duration: 0.5
      });
    });

    // Two-way selection sync, list -> map side. Bring the selected marker
    // into view without slamming to a fixed zoom level — `zoomToShowLayer`
    // handles a marker that may currently be collapsed inside a cluster and
    // therefore has no DOM element yet; `panTo` (not `flyTo(pos, 18)`, which
    // is disorienting for a list tap) settles the view once revealed.
    effect(() => {
      const selectedId = this.oasisService.selectedSpotId();
      const ready = this.isMapReady();

      if (!ready || !this.map) return;

      if (this.selectedMarkerId && this.selectedMarkerId !== selectedId) {
        this.markers.get(this.selectedMarkerId)?.getElement()?.classList.remove('uo-marker-selected');
      }
      this.selectedMarkerId = selectedId;

      if (!selectedId) return;

      const marker = this.markers.get(selectedId);
      if (!marker) return;

      this.clusterGroup.zoomToShowLayer(marker, () => {
        this.map.panTo(marker.getLatLng());
        marker.getElement()?.classList.add('uo-marker-selected');
      });
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  private initMap(): void {
    this.map = L.map('map', { preferCanvas: true }).setView([37.3886, -5.9823], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.clusterGroup.addTo(this.map);

    this.isMapReady.set(true);

    setTimeout(() => {
      this.map?.invalidateSize();
    }, 100);
  }

  /** Diffs `filtered` against the built registry and moves layers in bulk. */
  private syncVisibleLayers(filtered: readonly OasisSpot[]): void {
    const visibleIds = new Set(filtered.map(o => o.id));
    const toAdd: any[] = [];
    const toRemove: any[] = [];

    this.markers.forEach((marker, id) => {
      const isOnMap = this.clusterGroup.hasLayer(marker);
      const shouldBeVisible = visibleIds.has(id);
      if (shouldBeVisible && !isOnMap) {
        toAdd.push(marker);
      } else if (!shouldBeVisible && isOnMap) {
        toRemove.push(marker);
      }
    });

    if (toAdd.length) this.clusterGroup.addLayers(toAdd);
    if (toRemove.length) this.clusterGroup.removeLayers(toRemove);
  }

  private applyMarkerAccessibleName(marker: any, spot: OasisSpot): void {
    const el = marker.getElement();
    if (!el) return;
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', this.buildMarkerLabel(spot, this.locationService.position()));
  }

  private buildMarkerLabel(spot: OasisSpot, position: [number, number, number] | null): string {
    const availability = spot.available ? 'Disponible' : 'Fuera de servicio';
    const typeLabel = this.getTypeLabel(spot.type);
    if (!position) {
      return `${spot.name}. ${typeLabel}. ${availability}.`;
    }
    const distanceLabel = formatDistance(distanceMeters([position[0], position[1]], [spot.latitude, spot.longitude]));
    return `${spot.name}. ${typeLabel}. ${distanceLabel}. ${availability}.`;
  }

  private getIconForType(type: OasisSpotType): any {
    let emoji = '📍';
    let bgColorClass = 'bg-gray-500';

    if (type === OasisSpotType.WATER_FOUNTAIN) {
      emoji = '💧';
      bgColorClass = 'bg-teal-500';
    } else if (type === OasisSpotType.SHADE) {
      emoji = '🌳';
      bgColorClass = 'bg-green-500';
    } else if (type === OasisSpotType.AC_BUILDING) {
      emoji = '❄️';
      bgColorClass = 'bg-blue-200';
    }

    const htmlElement = `
      <div class="${bgColorClass} text-white w-8 h-8 flex items-center justify-center rounded-full shadow-md border-2 border-white text-sm">
        ${emoji}
      </div>
    `;

    return L.divIcon({
      html: htmlElement,
      className: 'custom-map-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
}

private getTypeLabel(type: OasisSpotType): string {
  const labels: Record<OasisSpotType, string> = {
    [OasisSpotType.WATER_FOUNTAIN]: 'Fuente de agua',
    [OasisSpotType.SHADE]: 'Parque o zona de sombra',
    [OasisSpotType.AC_BUILDING]: 'Edificio con A/A'
  };
  return labels[type] || type;
}

private getUserIcon(): any {
    const htmlElement = `
      <div class="bg-blue-500 text-white w-8 h-8 flex items-center justify-center rounded-full shadow-md border-2 border-white text-sm">
        👤
      </div>
    `;

    return L.divIcon({
      html: htmlElement,
      className: 'custom-map-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  }
}
