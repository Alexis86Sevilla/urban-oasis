import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { WeatherInfo } from '../models/wheater';


@Injectable({
  providedIn: 'root',
})
export class WeatherService {
 private http = inject(HttpClient);
 private apiUrl = "https://api.open-meteo.com/v1/forecast?latitude=37.3886&longitude=-5.9823&current_weather=true"

 private readonly _weather = signal<WeatherInfo | null>(null);
 public readonly weather = this._weather.asReadonly();

 getWeather() {
   this.http.get<any>(this.apiUrl).subscribe(res => {
     this._weather.set({
       temperature: res.current_weather.temperature,
       windspeed: res.current_weather.windspeed
     });
   });
 }

}
