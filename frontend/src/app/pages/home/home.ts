import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { MapView } from "../../components/map-view/map-view";
import { OasisService } from '../../services/oasis';
import { WeatherService } from '../../services/wheater';
import { LocationService } from '../../services/location';
import { Announcer } from '../../services/announcer';
import { NearbySheet } from '../../components/nearby-sheet/nearby-sheet';

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
  /** Shown once, the first time the locate control is tapped with no prior decision. */
  protected showLocationExplainer = signal(false);
  private readonly confirmLocationBtn = viewChild<ElementRef<HTMLButtonElement>>('confirmLocationBtn');
  protected readonly temperatureIndicator = computed(() => {
    const temp = Math.round(this.wheater()?.temperature ?? 0) ;

    if (temp >= 35) {
      return { temp: temp + '°', class: 'bg-red-200/50 text-red-600 border-red-200', label: 'Muy caluroso' };
    } else if (temp >= 30) {
      return { temp: temp + '°', class: 'bg-orange-200/50 text-orange-600 border-orange-200', label: 'Caluroso' };
    } else if (temp >= 20) {
      return { temp: temp + '°', class: 'bg-green-500/20 text-slate-700 border-slate-200', label: 'Templado' };
    } else if (temp >= 15) {
      return { temp: temp + '°', class: 'bg-blue-600/20 text-slate-700 border-slate-200', label: 'Fresco' };
    } else {
      return { temp: temp + '°', class: 'bg-blue-500/20 text-blue-700 border-blue-200', label: 'Frío' };
    }
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

  protected readonly extremeAlert = computed(() => {
    const temp = Math.round(this.wheater()?.temperature ?? 0);
    const wind = Math.round(this.wheater()?.windspeed ?? 0);

    if (temp >= 40 && wind >= 40) {
      return { show: true, text: `Alerta extrema: ${temp}°C y ${wind} km/h`, type: 'both' };
    }
    if (temp >= 40) {
      return { show: true, text: `Alerta de Calor Extremo (${temp}°C)`, type: 'heat' };
    }
    if (wind >= 40) {
      return { show: true, text: `Alerta de Viento Extremo (${wind} km/h)`, type: 'wind' };
    }
    return { show: false, text: '', type: null };
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

    // Temporary bridge (documented deviation, see apply-progress): MapView
    // still reads OasisService.actualPosition for its popup distance line
    // and user marker, and is not migrated to LocationService until slice 4
    // (popup retirement). Until then, mirror a granted position across so
    // that existing map behaviour does not regress in the interim.
    effect(() => {
      const position = this.locationService.position();
      if (position) {
        this.oasisService.actualPosition.set(position);
      }
    });
  }

  filter(type: string) {
    this.oasisService.activeFilter.set(type);
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
