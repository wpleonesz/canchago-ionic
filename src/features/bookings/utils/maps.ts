import type { ResourceDto } from '../../../types/api/reservas';

export const directionsUrl = (resource: ResourceDto): string => {
  const destination = resource.latitude && resource.longitude
    ? `${resource.latitude},${resource.longitude}`
    : resource.address;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
};

export const formatUsd = (value: string | number): string =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(Number(value));
