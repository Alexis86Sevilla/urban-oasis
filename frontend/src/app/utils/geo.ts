/** A latitude/longitude pair. */
export type LatLng = readonly [number, number];

/** Mean Earth radius in meters, matching Leaflet's `L.CRS.Earth`. */
const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Great-circle distance between two coordinates using the haversine formula.
 * Uses the same mean Earth radius as Leaflet's `L.CRS.Earth`, so results are
 * consistent with any distance already computed via `map.distance(...)`.
 */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const [lat1, lng1] = a;
  const [lat2, lng2] = b;

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const h = sinDLat * sinDLat +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * sinDLng * sinDLng;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

/** Formats a distance in meters as `"240 m"` or `"1.2 km"`. */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Builds a Google Maps walking-directions URL from an origin to a
 * destination. The single source of truth for this construction — kept as a
 * pure helper here (rather than duplicated at each call site) so there is
 * exactly one copy of it in the app.
 */
export function buildWalkingDirectionsUrl(origin: LatLng, destination: LatLng): string {
  const [originLat, originLng] = origin;
  const [destLat, destLng] = destination;
  return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=walking`;
}
