import { computed, inject, Injectable, signal } from '@angular/core';
import { OasisSpot } from '../models/oasisSpot';
import { OasisSpotType } from '../enum/oasisSpotType';
import { HttpClient } from '@angular/common/http';
import { distanceMeters } from '../utils/geo';
import { LocationService } from './location';

/** Distinguishes a pending request, a successful load, and an HTTP failure. */
export type OasisStatus = 'loading' | 'ready' | 'error';

/** An oasis spot paired with its distance from the user, when known. */
export interface RankedSpot {
  spot: OasisSpot;
  distanceMeters: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class OasisService {
  private http = inject(HttpClient);
  private locationService = inject(LocationService);
  private apiUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:8080/api/oasis'
    : 'https://urban-oasis.info/api/oasis';

  activeFilter = signal<string>('ALL');
  actualPosition = signal<[number, number, number] | null>(null);

  private readonly _status = signal<OasisStatus>('loading');
  public readonly status = this._status.asReadonly();
  /**
   * Backward-compatible view over `status` for existing consumers that only
   * distinguish "still loading" from "not loading". Kept so this slice stays
   * service-only, with zero UI wiring changes.
   */
  public readonly loading = computed(() => this._status() === 'loading');

  private readonly _oases = signal<OasisSpot[]>([]);

  public readonly oases = this._oases.asReadonly();
  public readonly filteredOases = computed(() => {
    const filter = this.activeFilter();
    if (filter === 'ALL') return this.oases();
    return this.oases().filter(o => o.type === filter);
  });

  /**
   * Spots ranked by distance from `LocationService.position`. Falls back to
   * an alphabetical-by-name order (with `distanceMeters: null`) when no
   * position is available yet — never silently presents unsorted data as
   * "nearest". Unavailable spots stay in the list; they are never filtered
   * out here.
   */
  public readonly rankedSpots = computed<RankedSpot[]>(() => {
    const position = this.locationService.position();
    const spots = this.filteredOases();

    if (!position) {
      return [...spots]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(spot => ({ spot, distanceMeters: null }));
    }

    const origin: [number, number] = [position[0], position[1]];
    return spots
      .map(spot => ({
        spot,
        distanceMeters: distanceMeters(origin, [spot.latitude, spot.longitude]),
      }))
      .sort((a, b) => a.distanceMeters! - b.distanceMeters!);
  });

  private readonly _selectedSpotId = signal<string | null>(null);
  public readonly selectedSpotId = this._selectedSpotId.asReadonly();
  public readonly selectedSpot = computed(() => {
    const id = this._selectedSpotId();
    if (!id) return null;
    return this.oases().find(o => o.id === id) ?? null;
  });

  constructor() {
    this.loadOasesFromBackend();
  }

  public select(id: string): void {
    this._selectedSpotId.set(id);
  }

  public clearSelection(): void {
    this._selectedSpotId.set(null);
  }

  /** Retry affordance for the sheet's error state — re-issues the load. */
  public retry(): void {
    this._status.set('loading');
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
        this._status.set('ready');
      },
      error: (err) => {
        console.error('Error cargando oasis:', err);
        this._status.set('error');
      }
    });
  }
}
