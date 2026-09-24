import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';
import { WeatherService } from './services/wheater';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  host: {
    // Root theming hook (design D-9): `styles.css` redefines the `--uo-*`
    // custom properties per band, and any descendant — including the sheet
    // and the map — inherits them without needing its own per-utility variant.
    '[attr.data-temp-band]': 'weatherService.band()',
  },
})
export class App {
  protected readonly title = signal('frontend');
  protected readonly weatherService = inject(WeatherService);

  private readonly swUpdate = inject(SwUpdate);
  private reloading = false;

  constructor() {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    // A newer build finished downloading in the background. Apply it right
    // away instead of waiting for a future navigation, so nobody is left on a
    // stale version. The map holds no unsaved user input, so a reload is safe.
    this.swUpdate.versionUpdates
      .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
      .subscribe(() => this.reloadOnce());

    // The cached app is broken beyond what the service worker can repair.
    // Reloading bypasses it and fetches everything again from the server.
    this.swUpdate.unrecoverable.subscribe(() => this.reloadOnce());
  }

  /** Guards against a reload loop if several update events arrive at once. */
  private reloadOnce(): void {
    if (this.reloading) {
      return;
    }
    this.reloading = true;
    document.location.reload();
  }
}
