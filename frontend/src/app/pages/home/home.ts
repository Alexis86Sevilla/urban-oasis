import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { MapView } from "../../components/map-view/map-view";
import { OasisService } from '../../services/oasis';
import { TempBand, WeatherService } from '../../services/wheater';
import { LocationService } from '../../services/location';
import { Announcer } from '../../services/announcer';
import { NearbySheet, SheetSnap } from '../../components/nearby-sheet/nearby-sheet';

@Component({
  selector: 'app-home',
  imports: [MapView, NearbySheet],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private weatherService = inject(WeatherService);
  protected readonly oasisService = inject(OasisService);
  protected readonly locationService = inject(LocationService);
  private announcer = inject(Announcer);
  protected readonly wheater = this.weatherService.weather;
  protected showInfo = signal(false);
  protected showSupport = signal(false);
  protected readonly currentYear = new Date().getFullYear();
  /** Shown once, the first time the locate control is tapped with no prior decision. */
  protected showLocationExplainer = signal(false);
  /**
   * Owned here (not just inside `NearbySheet`) so the thumb-zone controls
   * know when the sheet has risen past `peek` and dock themselves out of the
   * way instead of sitting underneath the sheet's opaque surface.
   */
  protected readonly sheetSnap = signal<SheetSnap>('peek');
  private readonly confirmLocationBtn = viewChild<ElementRef<HTMLButtonElement>>('confirmLocationBtn');

  /**
   * Visual metadata per shared temperature band. The classification itself
   * now lives in `WeatherService.band` (a signal the sheet and the map read
   * too, via the `--uo-*` custom properties it drives — design D-9), reused
   * here rather than re-deriving the same thresholds locally.
   *
   * `icon` is the non-colour cue mandated by design D-9: a colour shift alone
   * is invisible to a colour-blind user and washes out in direct sunlight,
   * which is this app's real outdoor usage context. `extreme` additionally
   * swaps the wording to an explicit "¡Extremo!" and the icon to a warning
   * triangle, on top of the colour change — never colour alone.
   */
  private static readonly BAND_META: Record<TempBand, { label: string; class: string; icon: 'thermometer' | 'warning' }> = {
    // Every entry owns its own border-width utility (`border` or `border-2`)
    // rather than relying on a static one on the container: Tailwind would
    // otherwise emit two conflicting border-width utilities whose winner
    // depends on generated-CSS order, not template order.
    cold: { label: 'Frío', class: 'bg-blue-500/20 text-blue-700 border border-blue-200', icon: 'thermometer' },
    cool: { label: 'Fresco', class: 'bg-blue-600/20 text-slate-700 border border-slate-200', icon: 'thermometer' },
    mild: { label: 'Templado', class: 'bg-green-500/20 text-slate-700 border border-slate-200', icon: 'thermometer' },
    warm: { label: 'Caluroso', class: 'bg-orange-200/50 text-orange-600 border border-orange-200', icon: 'thermometer' },
    hot: { label: 'Muy caluroso', class: 'bg-red-200/50 text-red-600 border border-red-200', icon: 'thermometer' },
    // Higher-contrast fill (not just a tinted background) plus a thicker
    // border: the emphasis cue is structural, not only the colour swap.
    extreme: { label: '¡Extremo!', class: 'bg-red-700 text-white border-2 border-red-800', icon: 'warning' },
  };

  protected readonly temperatureIndicator = computed(() => {
    const temp = Math.round(this.wheater()?.temperature ?? 0);
    const meta = Home.BAND_META[this.weatherService.band()];
    return { temp: temp + '°', ...meta };
  });

  protected readonly windInfo = computed(() => {
    const wind = Math.round(this.wheater()?.windspeed ?? 0);

    if (wind >= 40) {
      return { speed: wind + ' km/h', class: 'bg-red-200/50 text-red-600 border-red-200', label: 'Vendaval' };
    } else if (wind >= 30) {
      return { speed: wind + ' km/h', class: 'bg-orange-200/50 text-orange-600 border-slate-200', label: 'Viento' };
    } else if (wind >= 25) {
      return { speed: wind + ' km/h', class: 'bg-green-500/20 text-slate-700 border-slate-200', label: 'Brisa fuerte' };
    } else if (wind >= 20) {
      return { speed: wind + ' km/h', class: 'bg-green-500/20 text-slate-700 border-slate-200', label: 'Brisa' };
    } else {
      return { speed: wind + ' km/h', class: 'bg-green-200/60 text-slate-700 border-slate-200', label: 'Calmo' };
    }
  });

  /** `show` is gated on the same shared `band` signal driving the badge and
   * the theme, so this alert and the badge can never disagree about whether
   * the reading currently counts as extreme; only the message wording still
   * needs the raw temperature/wind values, to say which one tripped it. */
  protected readonly extremeAlert = computed(() => {
    if (this.weatherService.band() !== 'extreme') {
      return { show: false, text: '', type: null };
    }

    const temp = Math.round(this.wheater()?.temperature ?? 0);
    const wind = Math.round(this.wheater()?.windspeed ?? 0);

    if (temp >= 40 && wind >= 40) {
      return { show: true, text: `Alerta extrema: ${temp}°C y ${wind} km/h`, type: 'both' };
    }
    if (temp >= 40) {
      return { show: true, text: `Alerta de Calor Extremo (${temp}°C)`, type: 'heat' };
    }
    return { show: true, text: `Alerta de Viento Extremo (${wind} km/h)`, type: 'wind' };
  });

  constructor() {
    this.weatherService.getWeather();

    // role="dialog" promises focus containment, so honour it: move focus into
    // the explainer when it opens. Escape dismisses it from the template.
    effect(() => {
      if (this.showLocationExplainer()) {
        this.confirmLocationBtn()?.nativeElement.focus();
      }
    });

    // Catalogue load feedback, announced once per transition into a
    // terminal status (never on the initial 'loading' read).
    effect(() => {
      const status = this.oasisService.status();
      if (status === 'ready') {
        this.announcer.announce(`${this.oasisService.oases().length} puntos disponibles`, 'polite');
      } else if (status === 'error') {
        this.announcer.announce('No se pudieron cargar los puntos. Reintentar.', 'assertive');
      }
    });

    // Location permission feedback, one distinct message per terminal state.
    effect(() => {
      const status = this.locationService.status();
      if (status === 'granted') {
        this.announcer.announce('Ubicación activada. Lista ordenada por cercanía.', 'polite');
      } else if (status === 'denied') {
        this.announcer.announce('Permiso de ubicación denegado. Actívalo en los ajustes del navegador.', 'assertive');
      } else if (status === 'failed-or-timed-out') {
        this.announcer.announce('No se pudo obtener tu ubicación a tiempo.', 'assertive');
      }
    });
  }

  /** Spanish labels matching the filter chips in the template. */
  private static readonly FILTER_LABELS: Record<string, string> = {
    ALL: 'Todo',
    WATER_FOUNTAIN: 'Fuentes',
    SHADE: 'Sombra',
    AC_BUILDING: 'A/A',
  };

  filter(type: string) {
    this.oasisService.activeFilter.set(type);
    const label = Home.FILTER_LABELS[type] ?? type;
    const count = this.oasisService.filteredOases().length;
    this.announcer.announce(`Filtro ${label}. ${count} puntos.`, 'polite');
  }

  /**
   * Locate control gesture. The very first tap (status still 'never-asked')
   * only opens the in-app explanation — it must not itself trigger the OS
   * permission prompt. Any later tap (denied / failed-or-timed-out / already
   * granted) re-requests directly; that is the state's own retry affordance.
   */
  onLocateClick(): void {
    if (this.locationService.status() === 'never-asked') {
      this.showLocationExplainer.set(true);
      return;
    }
    this.locationService.request();
  }

  /** The actual user gesture that triggers the OS permission prompt. */
  confirmLocationRequest(): void {
    this.showLocationExplainer.set(false);
    this.locationService.request();
  }

  dismissLocationExplainer(): void {
    this.showLocationExplainer.set(false);
  }
}
