export interface GeoPoint {
  lat: number;
  lon: number;
  height: number;
}

export interface LocalPoint {
  x: number;
  y: number;
  z: number;
}

const EARTH_RADIUS_M = 6378137;

/**
 * Converts a lat/lon/height point to local ground-plane meters relative to
 * an origin point, using a flat-earth (equirectangular) approximation.
 * Accurate enough at the tens-of-metres scale this app works at; breaks
 * down over large distances or near the poles.
 */
export function toLocal(point: GeoPoint, origin: GeoPoint): LocalPoint {
  const originLatRad = (origin.lat * Math.PI) / 180;

  const x = (point.lon - origin.lon) * (Math.PI / 180) * EARTH_RADIUS_M * Math.cos(originLatRad);
  const y = (point.lat - origin.lat) * (Math.PI / 180) * EARTH_RADIUS_M;
  const z = point.height - origin.height;

  return { x, y, z };
}
