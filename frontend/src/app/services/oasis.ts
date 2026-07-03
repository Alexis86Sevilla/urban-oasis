import { computed, inject, Injectable, signal } from '@angular/core';
import { OasisSpot } from '../models/oasisSpot';
import { OasisSpotType } from '../enum/oasisSpotType';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class OasisService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/oasis';

  activeFilter = signal<string>('ALL');
  actualPosition = signal<[number, number, number] | null>(null);
  private readonly _oases = signal<OasisSpot[]>([]);

  public readonly oases = this._oases.asReadonly();
  public readonly filteredOases = computed(() => {
    const filter = this.activeFilter();
    if (filter === 'ALL') return this.oases();
    return this.oases().filter(o => o.type === filter);
  });

  constructor() {
    this.loadOasesFromBackend();
  }

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

  private loadOasesFromBackend(): void {
    this.http.get<OasisSpot[]>(this.apiUrl).subscribe({
      next: (res) => {
        this._oases.set(res);
      },
      error: (err) => {
        console.error('Error cargando oasis:', err);
      }
    });
  }
}
