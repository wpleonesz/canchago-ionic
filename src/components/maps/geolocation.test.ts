import { beforeEach, describe, expect, it, vi } from 'vitest';
import { classifyGeolocationError, detectCurrentPosition } from './geolocation';

const getCurrentPosition = vi.hoisted(() => vi.fn());
vi.mock('@capacitor/geolocation', () => ({ Geolocation: { getCurrentPosition } }));

const position = { coords: { latitude: -0.18, longitude: -78.47, accuracy: 20 } };

describe('geolocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('clasifica códigos del plugin nativo y de la API web', () => {
    expect(classifyGeolocationError({ code: 'OS-PLUG-GLOC-0003' })).toBe('permission-denied');
    expect(classifyGeolocationError({ code: 'OS-PLUG-GLOC-0007' })).toBe('location-disabled');
    expect(classifyGeolocationError({ code: 'OS-PLUG-GLOC-0010' })).toBe('timeout');
    expect(classifyGeolocationError({ code: 1 })).toBe('permission-denied');
    expect(classifyGeolocationError({ code: 3 })).toBe('timeout');
    expect(classifyGeolocationError(new Error('boom'))).toBe('unavailable');
    expect(classifyGeolocationError(undefined)).toBe('unavailable');
  });

  it('devuelve la posición de alta precisión sin reintentar', async () => {
    getCurrentPosition.mockResolvedValue(position);
    await expect(detectCurrentPosition()).resolves.toEqual({ latitude: -0.18, longitude: -78.47 });
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(getCurrentPosition).toHaveBeenCalledWith(expect.objectContaining({ enableHighAccuracy: true }));
  });

  it('reintenta con baja precisión cuando el GPS no responde a tiempo', async () => {
    getCurrentPosition.mockRejectedValueOnce({ code: 'OS-PLUG-GLOC-0010' }).mockResolvedValueOnce(position);
    await expect(detectCurrentPosition()).resolves.toEqual({ latitude: -0.18, longitude: -78.47 });
    expect(getCurrentPosition).toHaveBeenNthCalledWith(2, expect.objectContaining({ enableHighAccuracy: false }));
  });

  it('no reintenta si el permiso fue denegado o el GPS está apagado', async () => {
    getCurrentPosition.mockRejectedValue({ code: 'OS-PLUG-GLOC-0007' });
    await expect(detectCurrentPosition()).rejects.toEqual({ code: 'OS-PLUG-GLOC-0007' });
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
  });
});
