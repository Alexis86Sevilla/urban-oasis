import { ChangeDetectionStrategy, Component, AfterViewInit, inject, effect, signal } from '@angular/core';
import { OasisService } from '../../services/oasis';
import { OasisSpotType } from '../../enum/oasisSpotType';

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
  private isMapReady = signal(false);
  private userMarker: any = undefined;
  private userCircleAccuracy: any = undefined;

  constructor() {
    effect(() => {
      const oases = this.oasisService.filteredOases();
      const ready = this.isMapReady();
      const actualPos = this.oasisService.actualPosition();

      if (!ready || !this.map) return;

      this.clusterGroup.clearLayers();

      oases.forEach(o => {
        let emoji = '📍';
        let accentClass = 'bg-slate-100 text-slate-700';

        if (o.type === OasisSpotType.WATER_FOUNTAIN) {
          emoji = '💧';
          accentClass = 'bg-teal-100 text-teal-700';
        } else if (o.type === OasisSpotType.SHADE) {
          emoji = '🌳';
          accentClass = 'bg-green-100 text-green-700';
        } else if (o.type === OasisSpotType.AC_BUILDING) {
          emoji = '❄️';
          accentClass = 'bg-blue-100 text-blue-700';
        }

        let actionHtml = '';

        if (actualPos) {
          const distInMeters = this.map!.distance([o.latitude, o.longitude], actualPos);
          const distanceText = distInMeters >= 1000
            ? `${(distInMeters / 1000).toFixed(1)} km`
            : `${Math.round(distInMeters)} m`;
          const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${actualPos[0]},${actualPos[1]}&destination=${o.latitude},${o.longitude}&travelmode=walking`;

          actionHtml = `
            <div class="px-3 pb-3">
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-medium text-slate-500">Distancia</span>
                <span class="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full">${distanceText}</span>
              </div>
              <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center w-full px-3 py-2 rounded-lg bg-teal-600 !text-white no-underline text-xs font-semibold shadow-sm hover:bg-teal-700 hover:!text-white transition-colors">
                Cómo llegar
              </a>
            </div>
          `;
        }

        L.marker([o.latitude, o.longitude], { icon: this.getIconForType(o.type) })
          .bindPopup(`
            <div class="p-0 min-w-[220px] max-w-[280px] font-sans">
              <div class="flex items-start gap-3 p-3">
                <div class="w-10 h-10 rounded-full ${accentClass} flex items-center justify-center text-lg shrink-0">
                  ${emoji}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="font-bold text-slate-800 text-base leading-tight mb-0.5">${o.name}</div>
                  <p class="text-sm text-slate-500 m-0">${this.getTypeLabel(o.type)}</p>
                </div>
              </div>
              ${actionHtml}
            </div>
          `)
          .addTo(this.clusterGroup);
      });
    });

    effect(() => {
      const position = this.oasisService.actualPosition();
      const ready = this.isMapReady();

      if (!ready || !this.map || !position) return;

      const accuracy = position![2];

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
        this.userMarker = L.marker(position, { icon: this.getUserIcon() }).addTo(this.map);
      }

      this.map.flyTo(position, 18, {
        animate: true,
        duration: 0.5
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
      popupAnchor: [0, -16]
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
      popupAnchor: [0, -16]
    });
  }
}
