import { ChangeDetectionStrategy, Component, computed, effect, inject, OnChanges, SimpleChanges } from '@angular/core';
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
  protected readonly temperatureIndicator = computed(() => {
    const temp = this.wheater()?.temperature ?? 0;
    if (temp < 30) {
      return {
        temp: Math.round(temp) + ' °C',
        class: 'bg-green-100 text-green-700',

      }
    } else if (temp >= 30 && temp < 35) {
      return {
        temp: Math.round(temp) + ' °C',
        class: 'bg-orange-100 text-orange-700',

      }
    } else {
      return {
        temp: Math.round(temp) + ' °C',
        class: 'bg-red-100 text-red-700',
      }
    }
  });
  protected readonly windInfo = computed(() => {
    const wind = this.wheater()?.windspeed ?? 0;
    if (wind < 10) {
      return {
        class: 'bg-green-100 text-green-700',
        text: 'Calma',
        speed: `${Math.round(wind)} km/h`,
        description: 'Sin viento'
      };
    } else if (wind < 20) {
      return {
        class: 'bg-yellow-100 text-yellow-700',
        text: 'Brisa',
        speed: `${Math.round(wind)} km/h`,
        description: `${Math.round(wind)} km/h`
      };
    } else if (wind < 30) {
      return {
        class: 'bg-orange-100 text-orange-700',
        text: 'Viento',
        speed: `${Math.round(wind)} km/h`,
        description: `${Math.round(wind)} km/h`
      };
    } else {
      return {
        class: 'bg-red-100 text-red-700',
        text: 'Ventoso',
        speed: `${Math.round(wind)} km/h`,
        description: `${Math.round(wind)} km/h`
      };
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
