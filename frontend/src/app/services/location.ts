import { Injectable, signal } from '@angular/core';

/**
 * Local, app-tracked geolocation state. Deliberately never reads
 * `navigator.permissions.query` (unreliable on Safari) — the three
 * user-facing states below are derived only from the outcome of an
 * explicit `request()` call.
 */
export type LocationStatus = 'never-asked' | 'denied' | 'failed-or-timed-out' | 'granted';

/** How long the browser's own geolocation call is allowed to take. */
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Stall fallback window. Some browsers (notably iOS in installed-PWA mode)
 * can hang without ever invoking either the success or the error callback,
 * bypassing the browser's own `timeout` option. This local timer guarantees
 * the UI still resolves to a terminal state. It must stay LONGER than
 * REQUEST_TIMEOUT_MS, or it races the browser timeout instead of covering
 * the case where no callback ever arrives.
 */
const STALL_FALLBACK_MS = REQUEST_TIMEOUT_MS + 2_000;

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  readonly position = signal<[number, number, number] | null>(null);
  readonly status = signal<LocationStatus>('never-asked');

  private stallTimer: ReturnType<typeof setTimeout> | undefined;

  /**
   * Requests the user's current position. Must be triggered by an explicit
   * user gesture (the caller is responsible for that). Resolves to
   * `failed-or-timed-out` if neither browser callback fires within the
   * stall fallback window.
   */
  request(): void {
    this.clearStallTimer();

    this.stallTimer = setTimeout(() => {
      this.stallTimer = undefined;
      this.status.set('failed-or-timed-out');
    }, STALL_FALLBACK_MS);

    navigator.geolocation.getCurrentPosition(
      (result) => {
        this.clearStallTimer();
        this.position.set([result.coords.latitude, result.coords.longitude, result.coords.accuracy]);
        this.status.set('granted');
      },
      (error) => {
        this.clearStallTimer();
        if (error.code === error.PERMISSION_DENIED) {
          this.status.set('denied');
        } else {
          this.status.set('failed-or-timed-out');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: REQUEST_TIMEOUT_MS,
        maximumAge: 0,
      }
    );
  }

  private clearStallTimer(): void {
    if (this.stallTimer !== undefined) {
      clearTimeout(this.stallTimer);
      this.stallTimer = undefined;
    }
  }
}
