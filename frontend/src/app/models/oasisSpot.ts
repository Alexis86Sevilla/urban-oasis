import { OasisSpotType } from "../enum/oasisSpotType";

export interface OasisSpot {
  id: string;
  name: string;
  type: OasisSpotType;
  lat: number;
  lng: number;
  isWorking: boolean;
}
