import { ChangeDetectionStrategy, Component, computed, effect, inject, OnChanges, signal, SimpleChanges } from '@angular/core';
import { MapView } from "../../components/map-view/map-view";
import { OasisService } from '../../services/oasis';
import { WeatherService } from '../../services/wheater';

@Component({
  selector: 'app-home',
  imports: [MapView],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private weatherService = inject(WeatherService);
  protected readonly oasisService = inject(OasisService);
  protected readonly wheater = this.weatherService.weather;
  protected showInfo = signal(false);
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

  constructor() {
    this.weatherService.getWeather();
  }

  filter(type: string) {
    this.oasisService.activeFilter.set(type);
  }

  updateActualPosition() {
    this.oasisService.updateActualPosition();
  }
}
