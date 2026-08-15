import { SecureStorage } from '@aparajita/capacitor-secure-storage';

const SESSION_TOKEN_KEY = 'canchago_session_token';

// Único lugar del proyecto que toca este plugin. Cifrado real (Keychain/Keystore), nunca
// @capacitor/preferences ni localStorage — ver tech-stack.md §7.
export const getSessionToken = (): Promise<string | null> => SecureStorage.getItem(SESSION_TOKEN_KEY);

export const setSessionToken = async (token: string): Promise<void> => {
  await SecureStorage.setItem(SESSION_TOKEN_KEY, token);
};

export const clearSessionToken = async (): Promise<void> => {
  await SecureStorage.removeItem(SESSION_TOKEN_KEY);
};
