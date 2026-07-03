import { OasisSpotType } from "../enum/oasisSpotType";

export interface OasisSpot {
  id: string;
  name: string;
  type: OasisSpotType;
  latitude: number;
  longitude: number;
  available: boolean;
}
