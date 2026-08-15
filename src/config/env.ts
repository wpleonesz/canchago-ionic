interface AppEnv {
  apiBaseUrl: string;
  apiTimeoutMs: number;
}

const requireEnv = (key: string, value: string | undefined): string => {
  if (!value) {
    throw new Error(`${key} no está definida. Revisa tu archivo .env (ver .env.example).`);
  }
  return value;
};

const readEnv = (): AppEnv => ({
  apiBaseUrl: requireEnv('VITE_API_BASE_URL', import.meta.env.VITE_API_BASE_URL),
  apiTimeoutMs: Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 15000),
});

export const env = readEnv();
