import { Preferences } from '@capacitor/preferences';

// Solo para preferencias NO sensibles (tema, idioma). Sesión y tokens nunca van aquí — ver tech-stack.md §7.
export const getPreference = async (key: string): Promise<string | null> => {
  const { value } = await Preferences.get({ key });
  return value;
};

export const setPreference = async (key: string, value: string): Promise<void> => {
  await Preferences.set({ key, value });
};

export const removePreference = async (key: string): Promise<void> => {
  await Preferences.remove({ key });
};
