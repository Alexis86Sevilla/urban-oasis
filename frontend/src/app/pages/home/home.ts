import { ChangeDetectionStrategy, Component } from '@angular/core';
import * as L from 'leaflet';
import { MapView } from "../../components/map-view/map-view";

@Component({
  selector: 'app-home',
  imports: [MapView],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {}
