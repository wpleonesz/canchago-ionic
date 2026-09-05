import { Preferences } from '@capacitor/preferences';

/**
 * Lista de claves o patrones sensibles que ESTÁN ESTRICTAMENTE PROHIBIDOS
 * en almacenamiento de preferencias no cifradas (@capacitor/preferences).
 * Tokens de sesión, credenciales o secretos DEBEN almacenarse en secureToken.ts
 * mediante @aparajita/capacitor-secure-storage (Keychain/Keystore).
 */
const SENSITIVE_KEY_PATTERNS = ['token', 'secret', 'password', 'session', 'auth', 'credential', 'keycloak', 'refresh'];

const assertNonSensitiveKey = (key: string): void => {
  const lowerKey = key.toLowerCase();
  const isSensitive = SENSITIVE_KEY_PATTERNS.some(pattern => lowerKey.includes(pattern));
  if (isSensitive) {
    throw new Error(
      `[Seguridad] La clave "${key}" contiene datos potencialmente sensibles y no debe almacenarse en Preferences. Usa secureToken.ts.`,
    );
  }
};

// Solo para preferencias NO sensibles (tema, idioma, densidad). Sesión y tokens nunca van aquí — ver tech-stack.md §7.
export const getPreference = async (key: string): Promise<string | null> => {
  const { value } = await Preferences.get({ key });
  return value;
};

export const setPreference = async (key: string, value: string): Promise<void> => {
  assertNonSensitiveKey(key);
  await Preferences.set({ key, value });
};

export const removePreference = async (key: string): Promise<void> => {
  await Preferences.remove({ key });
};

export const clearAllPreferences = async (): Promise<void> => {
  await Preferences.clear();
};
