import { Injectable } from '@angular/core';

/** Screen-reader politeness levels for a live-region announcement. */
export type AnnouncerPoliteness = 'polite' | 'assertive';

/**
 * Thin wrapper over a screen-reader live region, so call sites never talk to
 * the underlying announcement mechanism directly.
 *
 * This hand-rolled live region is the final implementation. An earlier
 * plan to back it with @angular/cdk's LiveAnnouncer was dropped when the
 * CDK was removed from the project — see
 * sdd/frontend-ux-redesign/decision-hand-rolled-sheet.
 */
@Injectable({
  providedIn: 'root',
})
export class Announcer {
  private politeRegion: HTMLElement | undefined;
  private assertiveRegion: HTMLElement | undefined;

  /**
   * Announces `message` via the live region matching `politeness`. Clears
   * the region first and sets the text on the next tick, so an identical,
   * repeated message still triggers a fresh announcement (a live region
   * only fires on a DOM mutation, not a same-value write).
   */
  announce(message: string, politeness: AnnouncerPoliteness = 'polite'): void {
    const region = politeness === 'assertive' ? this.getAssertiveRegion() : this.getPoliteRegion();
    region.textContent = '';
    window.setTimeout(() => {
      region.textContent = message;
    }, 50);
  }

  private getPoliteRegion(): HTMLElement {
    if (!this.politeRegion) {
      this.politeRegion = this.createRegion('polite');
    }
    return this.politeRegion;
  }

  private getAssertiveRegion(): HTMLElement {
    if (!this.assertiveRegion) {
      this.assertiveRegion = this.createRegion('assertive');
    }
    return this.assertiveRegion;
  }

  private createRegion(politeness: AnnouncerPoliteness): HTMLElement {
    const region = document.createElement('div');
    region.setAttribute('aria-live', politeness);
    region.setAttribute('aria-atomic', 'true');
    region.setAttribute('class', 'sr-only');
    document.body.appendChild(region);
    return region;
  }
}
