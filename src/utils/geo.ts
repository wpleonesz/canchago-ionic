export interface GeoPoint {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_METERS = 6_371_000;
const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

// Distancia en línea recta sobre la esfera terrestre (Haversine); suficiente para orientar al usuario.
export const distanceMeters = (from: GeoPoint, to: GeoPoint): number => {
  const deltaLatitude = toRadians(to.latitude - from.latitude);
  const deltaLongitude = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) * Math.sin(deltaLongitude / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(a)));
};

export const formatDistance = (meters: number): string => {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${new Intl.NumberFormat('es-EC', { maximumFractionDigits: 1 }).format(meters / 1000)} km`;
};
