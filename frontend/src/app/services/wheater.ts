import { HttpClient } from '@angular/common/http';
import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { WeatherInfo } from '../models/wheater';

/**
 * Shared temperature band driving the app's theming (`data-temp-band` on the
 * root, consumed as CSS custom properties by the map and the sheet — see
 * `sdd/frontend-ux-redesign/design` D-9). Reuses the exact thresholds that
 * used to live only in `Home.temperatureIndicator`/`extremeAlert`: Frío <15°,
 * Fresco 15–19°, Templado 20–29°, Caluroso 30–34°, Muy caluroso ≥35°, plus
 * the `extreme` tier at the existing 40° heat-or-wind trigger.
 */
export type TempBand = 'cold' | 'cool' | 'mild' | 'warm' | 'hot' | 'extreme';

/** A reading older than this, regained-visibility triggers one refetch. */
const STALE_AFTER_MS = 15 * 60_000;

@Injectable({
  providedIn: 'root',
})
export class WeatherService {
 private http = inject(HttpClient);
 private readonly destroyRef = inject(DestroyRef);
 private apiUrl = "https://api.open-meteo.com/v1/forecast?latitude=37.3886&longitude=-5.9823&current_weather=true"

 private readonly _weather = signal<WeatherInfo | null>(null);
 public readonly weather = this._weather.asReadonly();

 private readonly _lastFetchedAt = signal<number | null>(null);
 public readonly lastFetchedAt = this._lastFetchedAt.asReadonly();

 /** Shared classification, consumed by `Home`'s badge/alert and, via the CSS
  * custom properties it drives, by the sheet and the map too — not a
  * `Home`-only computed value. */
 public readonly band = computed<TempBand>(() => {
   const weather = this._weather();
   const temp = Math.round(weather?.temperature ?? 0);
   const wind = Math.round(weather?.windspeed ?? 0);

   if (temp >= 40 || wind >= 40) return 'extreme';
   if (temp >= 35) return 'hot';
   if (temp >= 30) return 'warm';
   if (temp >= 20) return 'mild';
   if (temp >= 15) return 'cool';
   return 'cold';
 });

 constructor() {
   // No polling timer — the owner chose this explicitly to avoid burning
   // battery with the app sitting in a pocket for hours. Instead, only
   // refetch when the tab genuinely regains visibility and the reading has
   // actually gone stale, which is the one moment a stale reading matters.
   const onVisibilityChange = () => {
     if (document.visibilityState === 'visible') {
       this.refreshIfStale();
     }
   };
   document.addEventListener('visibilitychange', onVisibilityChange);
   this.destroyRef.onDestroy(() => document.removeEventListener('visibilitychange', onVisibilityChange));
 }

 getWeather() {
   this.http.get<any>(this.apiUrl).subscribe(res => {
     this._weather.set({
       temperature: res.current_weather.temperature,
       windspeed: res.current_weather.windspeed
     });
     this._lastFetchedAt.set(Date.now());
   });
 }

 /** Refetches only when there is no reading yet or the current one is older
  * than `STALE_AFTER_MS`. Called on visibility regain, never on a timer. */
 refreshIfStale(): void {
   const fetchedAt = this._lastFetchedAt();
   if (fetchedAt === null || Date.now() - fetchedAt > STALE_AFTER_MS) {
     this.getWeather();
   }
 }
}
