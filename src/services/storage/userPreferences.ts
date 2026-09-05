import { z } from 'zod';
import { getPreference, removePreference, setPreference } from './preferences';

export const THEME_MODES = ['system', 'light', 'dark'] as const;
export const DISPLAY_DENSITIES = ['comfortable', 'compact'] as const;
export const PAGE_SIZES = [10, 20, 50] as const;

export const themeModeSchema = z.enum(THEME_MODES);
export const displayDensitySchema = z.enum(DISPLAY_DENSITIES);
export const pageSizeSchema = z.union([z.literal(10), z.literal(20), z.literal(50)]);

export const userPreferencesSchema = z.object({
  theme: themeModeSchema.default('system'),
  displayDensity: displayDensitySchema.default('comfortable'),
  pageSize: pageSizeSchema.default(20),
  confirmBeforeActions: z.boolean().default(true),
});

export type ThemeMode = z.infer<typeof themeModeSchema>;
export type DisplayDensity = z.infer<typeof displayDensitySchema>;
export type PageSize = z.infer<typeof pageSizeSchema>;
export type UserPreferences = z.infer<typeof userPreferencesSchema>;

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: 'system',
  displayDensity: 'comfortable',
  pageSize: 20,
  confirmBeforeActions: true,
};

export const USER_PREFERENCES_KEY = 'canchago_user_preferences';

/**
 * Carga las preferencias no sensibles del usuario desde @capacitor/preferences.
 * Si no existen o el contenido no es válido, retorna los valores predeterminados.
 */
export const getUserPreferences = async (): Promise<UserPreferences> => {
  try {
    const raw = await getPreference(USER_PREFERENCES_KEY);
    if (!raw) return DEFAULT_USER_PREFERENCES;

    const parsedJson: unknown = JSON.parse(raw);
    const result = userPreferencesSchema.safeParse(parsedJson);
    if (result.success) {
      return result.data;
    }
    return DEFAULT_USER_PREFERENCES;
  } catch {
    return DEFAULT_USER_PREFERENCES;
  }
};

/**
 * Guarda las preferencias no sensibles en @capacitor/preferences.
 * Valida la estructura mediante Zod antes de serializar a JSON.
 */
export const saveUserPreferences = async (preferences: UserPreferences): Promise<void> => {
  const validated = userPreferencesSchema.parse(preferences);
  await setPreference(USER_PREFERENCES_KEY, JSON.stringify(validated));
};

/**
 * Restablece las preferencias a sus valores predeterminados de fábrica.
 */
export const resetUserPreferences = async (): Promise<UserPreferences> => {
  await removePreference(USER_PREFERENCES_KEY);
  return DEFAULT_USER_PREFERENCES;
};

/**
 * Aplica el modo de tema en el DOM para Ionic React y variables CSS de CanchaGO.
 */
export const applyThemeMode = (theme: ThemeMode): void => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('ion-palette-dark');
    root.classList.remove('ion-palette-light');
  } else if (theme === 'light') {
    root.classList.remove('ion-palette-dark');
    root.classList.add('ion-palette-light');
  } else {
    // Modo 'system'
    root.classList.remove('ion-palette-light');
    const prefersDark =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('ion-palette-dark', Boolean(prefersDark));
  }
};

/**
 * Aplica el atributo de densidad en el elemento raíz para ajustar espacios de listas y tablas.
 */
export const applyDisplayDensity = (density: DisplayDensity): void => {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-density', density);
};
