import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
} from '@angular/core';
import { OasisSpot } from '../../models/oasisSpot';
import { OasisSpotType } from '../../enum/oasisSpotType';
import { OasisStatus, RankedSpot } from '../../services/oasis';
import { LocationStatus } from '../../services/location';
import { buildWalkingDirectionsUrl, formatDistance } from '../../utils/geo';

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
 * Slice 3b (this revision) adds the ranked spot list, its loading/error/empty
 * states, a bounded "Ver más" window, and the relocated footer identity
 * content — all behind a pure signal API. This component never injects
 * `OasisService`; `Home` reads/writes the shared state and passes it down.
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
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  /** `peek` is a fixed pixel value; `half`/`full` are viewport-height ratios,
   * matching the `--uo-sheet-*` custom properties in the stylesheet. */
  /**
   * Must clear the 44px handle plus the projected filter band (a 44px chip
   * row with 0.5rem of padding) and still show a sliver of the first list
   * row, so the sheet reads as "there is a list here". At 96px the filters
   * were cut off at rest.
   */
  /** MUST equal `--uo-sheet-peek` in `src/styles.css`. */
  private static readonly PEEK_PX = 168;
  private static readonly HALF_RATIO = 0.45;
  private static readonly FULL_RATIO = 0.88;

  /** Two-way: a host can raise the sheet (e.g. a future map selection). */
  readonly snap = model<SheetSnap>('peek');

  /** Rows to render, already distance-ranked (or name-ranked with no position). */
  readonly spots = input.required<readonly RankedSpot[]>();
  /** The currently selected spot id, owned by the host (`OasisService`). */
  readonly selectedId = input<string | null>(null);
  /** Catalogue load state — distinguishes loading/error/empty in the content area. */
  readonly status = input.required<OasisStatus>();
  /** Drives the per-row distance placeholder when no position is known yet. */
  readonly locationStatus = input.required<LocationStatus>();
  /** Same tuple shape as `LocationService.position`; drives the selected-spot
   * card's "Cómo llegar" link. `null` while no position is known. */
  readonly userPosition = input<readonly [number, number, number] | null>(null);

  /** Emitted on row activation (click or Enter/Space, both native `<button>` behaviour). */
  readonly spotSelected = output<string>();
  /** Emitted from the error state's retry affordance. */
  readonly retryRequested = output<void>();
  /** Emitted from the selected-spot card's close button. The host owns
   * clearing the selection (`OasisService.clearSelection()`); this component
   * never touches selection state itself. */
  readonly selectedClosed = output<void>();

  protected readonly dragging = signal(false);
  private readonly dragTranslatePx = signal<number | null>(null);
  private readonly viewportHeightPx = signal(this.measureViewportHeight());

  private dragPointerId: number | null = null;
  private dragStartClientY = 0;
  private dragStartTranslatePx = 0;

  /** Tab-stop bound: only the nearest N rows render, plus a "Ver más" button. */
  private static readonly ROWS_PER_PAGE = 20;
  private readonly visibleCount = signal(NearbySheet.ROWS_PER_PAGE);
  protected readonly visibleSpots = computed(() => this.spots().slice(0, this.visibleCount()));
  protected readonly hasMore = computed(() => this.spots().length > this.visibleCount());

  /**
   * The selected spot, rendered in a fixed band above the list. One rule,
   * independent of `OasisService.lastSelectionSource` — it renders whenever
   * `selectedId` matches a spot in `spots`, whether the selection came from a
   * map tap or a list row, and even when that spot sits outside the
   * paginated `visibleSpots()` window.
   */
  protected readonly selectedRanked = computed<RankedSpot | null>(() => {
    const id = this.selectedId();
    if (!id) return null;
    return this.spots().find(ranked => ranked.spot.id === id) ?? null;
  });

  /** `null` (hides the link) until both the selected spot and the user's
   * position are known. */
  protected readonly selectedDirectionsUrl = computed<string | null>(() => {
    const ranked = this.selectedRanked();
    const position = this.userPosition();
    if (!ranked || !position) return null;
    return buildWalkingDirectionsUrl([position[0], position[1]], [ranked.spot.latitude, ranked.spot.longitude]);
  });

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

    // Reset the "Ver más" window whenever the ranked list itself changes
    // (a new filter, or position becoming known) — a previously expanded
    // window must not leak into a differently-scoped list.
    effect(() => {
      this.spots();
      untracked(() => this.visibleCount.set(NearbySheet.ROWS_PER_PAGE));
    });

    // Two-way selection sync, map -> list side. Raises `peek` to `half` so
    // the new selected-spot card is actually visible (at `half`/`full` the
    // sheet is left alone — never yanked back down). Also scrolls the
    // matching row into view but NEVER moves focus — a keyboard user's focus
    // must stay exactly where they put it; only their own discrete row
    // activation moves focus (native <button> behaviour), never this
    // reactive sync, and never the card appearing.
    effect(() => {
      const id = this.selectedId();
      if (!id) return;
      untracked(() => {
        if (this.snap() === 'peek') {
          this.snap.set('half');
        }
        const row = this.elementRef.nativeElement.querySelector<HTMLElement>(`[data-spot-row="${id}"]`);
        row?.scrollIntoView({ block: 'nearest' });
      });
    });
  }

  protected showMore(): void {
    this.visibleCount.update(count => count + NearbySheet.ROWS_PER_PAGE);
  }

  protected selectSpot(spot: OasisSpot): void {
    this.spotSelected.emit(spot.id);
  }

  /** Closes the selected-spot card. Does not touch `snap` — closing clears
   * the selection only; it must never yank the sheet back down. */
  protected closeSelected(): void {
    this.selectedClosed.emit();
  }

  /** Same emoji set as the map's marker icons (`MapView.getIconForType`),
   * kept in sync by hand until both call sites share one icon lookup. */
  protected typeIcon(type: OasisSpotType): string {
    switch (type) {
      case OasisSpotType.WATER_FOUNTAIN:
        return '💧';
      case OasisSpotType.SHADE:
        return '🌳';
      case OasisSpotType.AC_BUILDING:
        return '❄️';
    }
  }

  protected availabilityLabel(spot: OasisSpot): string {
    return spot.available ? 'Disponible' : 'Fuera de servicio';
  }

  protected availabilityClass(available: boolean): string {
    return available ? 'text-green-700' : 'text-red-600';
  }

  protected rowStateClasses(spotId: string): string {
    return spotId === this.selectedId() ? 'border-teal-600 bg-teal-50' : 'border-slate-200 bg-white';
  }

  /** Same Spanish labels used by the map's marker popups, kept in sync by hand
   * until slice 4 consolidates both call sites onto one shared formatter. */
  protected typeLabel(type: OasisSpotType): string {
    switch (type) {
      case OasisSpotType.WATER_FOUNTAIN:
        return 'Fuente de agua';
      case OasisSpotType.SHADE:
        return 'Parque o zona de sombra';
      case OasisSpotType.AC_BUILDING:
        return 'Edificio con A/A';
    }
  }

  /** `formatDistance` when known; otherwise a placeholder tied to why it
   * is not known yet, so the row never just silently omits the distance. */
  protected distanceLabel(ranked: RankedSpot): string {
    if (ranked.distanceMeters !== null) {
      return formatDistance(ranked.distanceMeters);
    }
    switch (this.locationStatus()) {
      case 'denied':
      case 'failed-or-timed-out':
        return 'Distancia no disponible';
      case 'granted':
        return 'Calculando distancia…';
      case 'never-asked':
      default:
        return 'Activa tu ubicación para ver la distancia';
    }
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
