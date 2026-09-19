import { Capacitor } from '@capacitor/core';

interface AppEnv {
  apiBaseUrl: string;
  apiTimeoutMs: number;
}

interface ApiBaseUrlSources {
  platform: string;
  base?: string;
  android?: string;
  ios?: string;
}

const requireEnv = (key: string, value: string | undefined): string => {
  if (!value) {
    throw new Error(`${key} no está definida. Revisa tu archivo .env (ver .env.example).`);
  }
  return value;
};

// El emulador de Android llega al Mac por 10.0.2.2 y el simulador de iOS por localhost: un mismo build debe servir
// para ambos sin cambiar archivos a mano, así que la URL se elige por plataforma en ejecución. En web (yarn dev) y
// en cualquier otra plataforma se usa VITE_API_BASE_URL (p. ej. "/api" con el proxy de Vite).
export const resolveApiBaseUrl = ({ platform, base, android, ios }: ApiBaseUrlSources): string => {
  const byPlatform = platform === 'android' ? android : platform === 'ios' ? ios : undefined;
  return requireEnv('VITE_API_BASE_URL', byPlatform || base);
};

const readEnv = (): AppEnv => ({
  apiBaseUrl: resolveApiBaseUrl({
    platform: Capacitor.getPlatform(),
    base: import.meta.env.VITE_API_BASE_URL,
    android: import.meta.env.VITE_API_BASE_URL_ANDROID,
    ios: import.meta.env.VITE_API_BASE_URL_IOS,
  }),
  apiTimeoutMs: Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 15000),
});

export const env = readEnv();
