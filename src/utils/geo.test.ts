import { describe, expect, it } from 'vitest';
import { distanceMeters, formatDistance } from './geo';

describe('geo', () => {
  it('calcula la distancia entre dos puntos conocidos (Quito → Guayaquil ≈ 270 km)', () => {
    const quito = { latitude: -0.1807, longitude: -78.4678 };
    const guayaquil = { latitude: -2.1709, longitude: -79.9224 };
    const km = distanceMeters(quito, guayaquil) / 1000;
    expect(km).toBeGreaterThan(245);
    expect(km).toBeLessThan(275);
  });

  it('la distancia entre el mismo punto es 0', () => {
    const point = { latitude: -1.83, longitude: -78.18 };
    expect(distanceMeters(point, point)).toBe(0);
  });

  it('formatea metros y kilómetros en español', () => {
    expect(formatDistance(842)).toBe('840 m');
    expect(formatDistance(3240)).toBe('3,2 km');
    expect(formatDistance(12_000)).toBe('12 km');
  });
});
