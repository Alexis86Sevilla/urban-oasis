import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';
import { Footer } from "./components/footer/footer";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');

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
