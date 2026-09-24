import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, model, signal } from '@angular/core';

/** The sheet's three fixed resting positions. */
export type SheetSnap = 'peek' | 'half' | 'full';

/**
 * Non-modal, draggable bottom sheet shell — hand-rolled with native Pointer
 * Events, not `@angular/cdk`.
 *
 * See `sdd/frontend-ux-redesign/decision-hand-rolled-sheet` for the full
 * postmortem. Short version: `@angular/cdk`'s `CdkDrag` writes the host's
 * inline `transform` on every pointer frame and only ever caches its
 * positioning baseline from that same inline style, which collided with this
 * component's own resting-position binding and made the sheet render at its
 * full height from first paint. Repositioning through `bottom` instead fixed
 * placement but animated a layout property, forcing a full layout every
 * frame over a Leaflet map holding ~1500 markers and freezing the renderer.
 * The fix for both is architectural, not a library choice: drive drag AND
 * rest exclusively through `transform`, which is composited and costs no
 * layout, and do it with native pointer events instead of a library that
 * wants the same property.
 *
 * Non-modal by construction: the sheet's box is always exactly
 * `--uo-sheet-full` tall and is pushed down via `translateY` to reveal only
 * the current snap's height. At `peek`, everything below the visible strip
 * sits past the bottom edge of the viewport, so it is never hit-tested and
 * the map underneath stays fully interactive at every snap point. No focus
 * trap exists anywhere in this component.
 *
 * Slice 3b adds `spots`, `selectedId`, `locationStatus` inputs and a
 * `spotSelected` output on top of this shell; this slice is drag/snap only.
 */
@Component({
  selector: 'app-nearby-sheet',
  imports: [],
  templateUrl: './nearby-sheet.html',
  styleUrl: './nearby-sheet.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'uo-sheet',

    '[class.uo-sheet--dragging]': 'dragging()',
  },
})
export class NearbySheet {
  private readonly destroyRef = inject(DestroyRef);

  /** `peek` is a fixed pixel value; `half`/`full` are viewport-height ratios,
   * matching the `--uo-sheet-*` custom properties in the stylesheet. */
  private static readonly PEEK_PX = 96;
  private static readonly HALF_RATIO = 0.45;
  private static readonly FULL_RATIO = 0.88;

  /** Two-way: a host can raise the sheet (e.g. a future map selection). */
  readonly snap = model<SheetSnap>('peek');

  protected readonly dragging = signal(false);
  private readonly dragTranslatePx = signal<number | null>(null);
  private readonly viewportHeightPx = signal(this.measureViewportHeight());

  private dragPointerId: number | null = null;
  private dragStartClientY = 0;
  private dragStartTranslatePx = 0;

  /** The only style this component ever animates or writes: `transform`. */
  protected readonly transformValue = computed(() => {
    const px = this.dragging()
      ? (this.dragTranslatePx() ?? this.dragStartTranslatePx)
      : this.snapTranslatePx(this.snap());
    return `translateY(${px}px)`;
  });

  constructor() {
    // dvh-based CSS handles the visual layout; this listener only keeps the
    // pixel math used for drag clamping and nearest-snap picking in sync
    // with viewport changes (e.g. a mobile toolbar hide/show).
    const onResize = () => this.viewportHeightPx.set(this.measureViewportHeight());
    window.addEventListener('resize', onResize);
    this.destroyRef.onDestroy(() => window.removeEventListener('resize', onResize));
  }

  protected onHandlePointerDown(event: PointerEvent): void {
    const handle = event.currentTarget as HTMLElement;
    handle.setPointerCapture(event.pointerId);
    this.dragPointerId = event.pointerId;
    this.dragStartClientY = event.clientY;
    this.dragStartTranslatePx = this.snapTranslatePx(this.snap());
    this.dragTranslatePx.set(this.dragStartTranslatePx);
    this.dragging.set(true);
  }

  protected onHandlePointerMove(event: PointerEvent): void {
    if (!this.dragging() || event.pointerId !== this.dragPointerId) return;
    const deltaY = event.clientY - this.dragStartClientY;
    const maxTravel = this.snapTranslatePx('peek');
    this.dragTranslatePx.set(this.clamp(this.dragStartTranslatePx + deltaY, 0, maxTravel));
  }

  /** Shared by `pointerup` and `pointercancel` — both end the gesture the
   * same way: settle on the nearest snap, no fling or rubber-band physics. */
  protected onHandlePointerUp(event: PointerEvent): void {
    if (!this.dragging() || event.pointerId !== this.dragPointerId) return;
    const handle = event.currentTarget as HTMLElement;
    if (handle.hasPointerCapture(event.pointerId)) {
      handle.releasePointerCapture(event.pointerId);
    }
    const settledPx = this.dragTranslatePx() ?? this.dragStartTranslatePx;
    this.dragging.set(false);
    this.dragTranslatePx.set(null);
    this.dragPointerId = null;
    this.snap.set(this.nearestSnap(settledPx));
  }

  /** Resting `translateY` in px for `snap`, measured down from `full` (0). */
  private snapTranslatePx(snap: SheetSnap): number {
    const fullPx = this.viewportHeightPx() * NearbySheet.FULL_RATIO;
    const halfPx = this.viewportHeightPx() * NearbySheet.HALF_RATIO;
    switch (snap) {
      case 'full':
        return 0;
      case 'half':
        return fullPx - halfPx;
      case 'peek':
        return fullPx - NearbySheet.PEEK_PX;
    }
  }

  private nearestSnap(translatePx: number): SheetSnap {
    const snaps: SheetSnap[] = ['full', 'half', 'peek'];
    return snaps.reduce((closest, candidate) =>
      Math.abs(this.snapTranslatePx(candidate) - translatePx) < Math.abs(this.snapTranslatePx(closest) - translatePx)
        ? candidate
        : closest
    );
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  private measureViewportHeight(): number {
    return window.visualViewport?.height ?? window.innerHeight;
  }
}
