import { ChangeDetectionStrategy, Component, AfterViewInit, inject, effect, signal } from '@angular/core';
import * as L from 'leaflet';
import { OasisService } from '../../services/oasis';
import { OasisSpotType } from '../../enum/oasisSpotType';

@Component({
  selector: 'app-map-view',
  imports: [],
  templateUrl: './map-view.html',
  styleUrl: './map-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapView implements AfterViewInit {
  private map: L.Map | undefined;
  private markersLayer = new L.LayerGroup();
  private readonly oasisService = inject(OasisService);
  private isMapReady = signal(false);
  private userMarker: L.Marker | undefined;
  private userCircleAccuracy: L.Circle | undefined;

  constructor() {
    effect(() => {
      const oases = this.oasisService.filteredOases();
      const ready = this.isMapReady();
      const actualPos = this.oasisService.actualPosition();

      if (!ready || !this.map) return;

      this.markersLayer.clearLayers();

      oases.forEach(o => {
        let distanceHtml = '';

        if (actualPos) {
          const distInMeters = this.map!.distance([o.lat, o.lng], actualPos);
          distanceHtml = `<p class="text-xs font-semibold text-blue-600 mt-1">📍 A ${Math.round(distInMeters)} metros</p>`;
        }

        L.marker([o.lat, o.lng], { icon: this.getIconForType(o.type) })
          .bindPopup(`
            <div class="p-2 min-w-[150px]">
              <h3 class="font-bold text-teal-700 leading-tight">${o.name}</h3>
              <p class="text-sm text-gray-500 capitalize">${o.type}</p>
              ${distanceHtml}
            </div>
          `)
          .addTo(this.markersLayer);
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
    this.map = L.map('map').setView([37.3886, -5.9823], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.markersLayer.addTo(this.map);

    this.isMapReady.set(true);

    setTimeout(() => {
      this.map?.invalidateSize();
    }, 100);
  }

  private getIconForType(type: OasisSpotType): L.DivIcon {
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

private getUserIcon(): L.DivIcon {
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
