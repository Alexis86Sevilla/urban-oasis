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
    const temp = this.wheater()?.temperature;
    if (temp! < 30) {
      return 'bg-green-100 text-green-700';
    } else if (temp! >= 30 && temp! < 35) {
      return 'bg-orange-100 text-orange-700';
    } else {
      return 'bg-red-100 text-red-700';
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
