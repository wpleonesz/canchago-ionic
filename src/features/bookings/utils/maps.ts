import type { ResourceDto } from '../../../types/api/reservas';
import type { GeoPoint } from '../../../utils/geo';

// null cuando la cancha no tiene coordenadas válidas (el mapa no se puede mostrar; "Cómo llegar" usa la dirección).
export const resourceCoordinates = (resource: ResourceDto): GeoPoint | null => {
  if (!resource.latitude || !resource.longitude) return null;
  const latitude = Number(resource.latitude);
  const longitude = Number(resource.longitude);
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
};

export const directionsUrl = (resource: ResourceDto): string => {
  const destination = resource.latitude && resource.longitude
    ? `${resource.latitude},${resource.longitude}`
    : resource.address;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
};

export const formatUsd = (value: string | number): string =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(Number(value));
