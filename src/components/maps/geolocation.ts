import { Geolocation } from '@capacitor/geolocation';

export interface DetectedPosition {
  latitude: number;
  longitude: number;
}

export type GeolocationFailure = 'permission-denied' | 'location-disabled' | 'timeout' | 'unavailable';

// Códigos del plugin nativo (Android/iOS: "OS-PLUG-GLOC-00NN") y numéricos de la API Web
// (GeolocationPositionError.code: 1 permiso, 2 no disponible, 3 timeout).
const PLUGIN_CODES: Record<string, GeolocationFailure> = {
  'OS-PLUG-GLOC-0003': 'permission-denied',
  'OS-PLUG-GLOC-0007': 'location-disabled',
  'OS-PLUG-GLOC-0009': 'location-disabled',
  'OS-PLUG-GLOC-0016': 'location-disabled',
  'OS-PLUG-GLOC-0010': 'timeout',
};
const WEB_CODES: Record<number, GeolocationFailure> = {
  1: 'permission-denied',
  2: 'unavailable',
  3: 'timeout',
};

export const classifyGeolocationError = (error: unknown): GeolocationFailure => {
  if (typeof error !== 'object' || error === null || !('code' in error)) return 'unavailable';
  const { code } = error;
  if (typeof code === 'string') return PLUGIN_CODES[code] ?? 'unavailable';
  if (typeof code === 'number') return WEB_CODES[code] ?? 'unavailable';
  return 'unavailable';
};

export const GEOLOCATION_MESSAGES: Record<GeolocationFailure, string> = {
  'permission-denied':
    'CanchaGO no tiene permiso de ubicación. Actívalo en los ajustes del dispositivo o marca el punto en el mapa.',
  'location-disabled':
    'La ubicación (GPS) del dispositivo está desactivada. Actívala e inténtalo de nuevo, o marca el punto en el mapa.',
  timeout: 'Tardó demasiado en obtener tu ubicación. Prueba en un lugar abierto o marca el punto en el mapa.',
  unavailable: 'No se pudo detectar tu ubicación. Puedes marcar el punto manualmente en el mapa.',
};

const RETRYABLE: GeolocationFailure[] = ['timeout', 'unavailable'];

// Primero GPS (alta precisión); si no hay fix a tiempo (interiores, emulador, señal débil) se
// reintenta una vez con red/WiFi y una posición reciente en caché, que casi siempre basta para ubicar
// una cancha. getCurrentPosition solicita el permiso por sí mismo: no se llama a requestPermissions
// antes porque en Android rechaza con "GPS desactivado" antes de poder pedir el permiso.
export const detectCurrentPosition = async (): Promise<DetectedPosition> => {
  const toPosition = ({ coords }: { coords: { latitude: number; longitude: number } }): DetectedPosition => ({
    latitude: coords.latitude,
    longitude: coords.longitude,
  });
  try {
    return toPosition(
      await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }),
    );
  } catch (error) {
    if (!RETRYABLE.includes(classifyGeolocationError(error))) throw error;
    return toPosition(
      await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }),
    );
  }
};
