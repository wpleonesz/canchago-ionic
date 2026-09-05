import { create } from 'zustand';
import {
  applyDisplayDensity,
  applyThemeMode,
  DEFAULT_USER_PREFERENCES,
  getUserPreferences,
  resetUserPreferences,
  saveUserPreferences,
  type UserPreferences,
} from '../services/storage/userPreferences';

interface PreferencesState {
  preferences: UserPreferences;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  successMessage: string | null;
  loadPreferences: () => Promise<void>;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => Promise<void>;
  setPreferences: (newPreferences: Partial<UserPreferences>) => Promise<void>;
  resetPreferences: () => Promise<void>;
  clearFeedback: () => void;
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  preferences: DEFAULT_USER_PREFERENCES,
  isLoading: false,
  isSaving: false,
  error: null,
  successMessage: null,

  loadPreferences: async () => {
    set({ isLoading: true, error: null });
    try {
      const loaded = await getUserPreferences();
      applyThemeMode(loaded.theme);
      applyDisplayDensity(loaded.displayDensity);
      set({ preferences: loaded, isLoading: false });
    } catch {
      set({
        isLoading: false,
        error: 'No se pudieron cargar tus preferencias locales.',
      });
    }
  },

  updatePreference: async (key, value) => {
    const current = get().preferences;
    const next: UserPreferences = {
      ...current,
      [key]: value,
    };

    set({ isSaving: true, error: null, successMessage: null });
    try {
      await saveUserPreferences(next);
      if (key === 'theme') {
        applyThemeMode(next.theme);
      }
      if (key === 'displayDensity') {
        applyDisplayDensity(next.displayDensity);
      }
      set({
        preferences: next,
        isSaving: false,
        successMessage: 'Preferencia guardada correctamente.',
      });
    } catch {
      set({
        isSaving: false,
        error: 'No se pudo guardar la preferencia en el dispositivo.',
      });
    }
  },

  setPreferences: async partial => {
    const current = get().preferences;
    const next: UserPreferences = {
      ...current,
      ...partial,
    };

    set({ isSaving: true, error: null, successMessage: null });
    try {
      await saveUserPreferences(next);
      applyThemeMode(next.theme);
      applyDisplayDensity(next.displayDensity);
      set({
        preferences: next,
        isSaving: false,
        successMessage: 'Preferencias actualizadas correctamente.',
      });
    } catch {
      set({
        isSaving: false,
        error: 'No se pudieron actualizar las preferencias.',
      });
    }
  },

  resetPreferences: async () => {
    set({ isSaving: true, error: null, successMessage: null });
    try {
      const defaults = await resetUserPreferences();
      applyThemeMode(defaults.theme);
      applyDisplayDensity(defaults.displayDensity);
      set({
        preferences: defaults,
        isSaving: false,
        successMessage: 'Preferencias restablecidas a los valores predeterminados.',
      });
    } catch {
      set({
        isSaving: false,
        error: 'No se pudieron restablecer las preferencias.',
      });
    }
  },

  clearFeedback: () => set({ error: null, successMessage: null }),
}));
