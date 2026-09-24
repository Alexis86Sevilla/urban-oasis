import { Injectable } from '@angular/core';

/** Screen-reader politeness levels for a live-region announcement. */
export type AnnouncerPoliteness = 'polite' | 'assertive';

/**
 * Thin wrapper over a screen-reader live region, so call sites never talk to
 * the underlying announcement mechanism directly.
 *
 * TEMPORARY implementation note: this slice hand-rolls the live region
 * instead of using `@angular/cdk/a11y`'s `LiveAnnouncer`, because installing
 * `@angular/cdk` is out of scope here — it lands in slice 3a. The public
 * `announce()` API intentionally matches `LiveAnnouncer`'s shape, so slice 3a
 * can swap this internal implementation for the CDK one without touching any
 * call site.
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
