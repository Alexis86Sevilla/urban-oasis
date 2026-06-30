import { computed, Injectable, signal } from '@angular/core';
import { OasisSpot } from '../models/oasisSpot';
import { OasisSpotType } from '../enum/oasisSpotType';

@Injectable({
  providedIn: 'root',
})
export class OasisService {
  activeFilter = signal<string>('ALL');
  actualPosition = signal<[number, number, number] | null>(null);
  private readonly _oases = signal<OasisSpot[]>([
    {
      id: '1',
      name: 'Fuente Plaza Nueva',
      type: OasisSpotType.WATER_FOUNTAIN,
      lat: 37.3886,
      lng: -5.9823,
      isWorking: true
    },
    {
      id: '2',
      name: 'Sombra Parque de María Luisa',
      type: OasisSpotType.SHADE,
      lat: 37.3773,
      lng: -5.9869,
      isWorking: true
    },
    {
      id: '3',
      name: 'Biblioteca Pública (Aire Acondicionado)',
      type: OasisSpotType.AC_BUILDING,
      lat: 37.3920,
      lng: -5.9800,
      isWorking: true
    },
    {
      id: '4',
      name: 'Fuente Alameda de Hércules',
      type: OasisSpotType.WATER_FOUNTAIN,
      lat: 37.3985,
      lng: -5.9926,
      isWorking: false
    }
  ]);

  public readonly oases = this._oases.asReadonly();
  public readonly filteredOases = computed(() => {
    const filter = this.activeFilter();
    if (filter === 'ALL') return this.oases();
    return this.oases().filter(o => o.type === filter);
  });

  public updateActualPosition() {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.actualPosition.set([position.coords.latitude, position.coords.longitude, position.coords.accuracy]);
      },
      (error) => {
        console.warn('No se pudo obtener la ubicación:', error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 10000
      }
    );
  }

}
