import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as userPreferencesService from '../services/storage/userPreferences';
import { usePreferencesStore } from './preferencesStore';

vi.mock('../services/storage/userPreferences', () => ({
  DEFAULT_USER_PREFERENCES: {
    theme: 'system',
    displayDensity: 'comfortable',
    pageSize: 20,
    confirmBeforeActions: true,
  },
  getUserPreferences: vi.fn(),
  saveUserPreferences: vi.fn(),
  resetUserPreferences: vi.fn(),
  applyThemeMode: vi.fn(),
  applyDisplayDensity: vi.fn(),
}));

describe('store/preferencesStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePreferencesStore.setState({
      preferences: userPreferencesService.DEFAULT_USER_PREFERENCES,
      isLoading: false,
      isSaving: false,
      error: null,
      successMessage: null,
    });
  });

  it('starts with default state', () => {
    const state = usePreferencesStore.getState();
    expect(state.preferences).toEqual(userPreferencesService.DEFAULT_USER_PREFERENCES);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('loadPreferences loads preferences and applies theme & density', async () => {
    const stored = {
      theme: 'dark' as const,
      displayDensity: 'compact' as const,
      pageSize: 50 as const,
      confirmBeforeActions: false,
    };
    vi.mocked(userPreferencesService.getUserPreferences).mockResolvedValueOnce(stored);

    await usePreferencesStore.getState().loadPreferences();

    const state = usePreferencesStore.getState();
    expect(state.preferences).toEqual(stored);
    expect(state.isLoading).toBe(false);
    expect(userPreferencesService.applyThemeMode).toHaveBeenCalledWith('dark');
    expect(userPreferencesService.applyDisplayDensity).toHaveBeenCalledWith('compact');
  });

  it('updatePreference updates single key, persists to storage and applies theme', async () => {
    vi.mocked(userPreferencesService.saveUserPreferences).mockResolvedValueOnce();

    await usePreferencesStore.getState().updatePreference('theme', 'dark');

    const state = usePreferencesStore.getState();
    expect(state.preferences.theme).toBe('dark');
    expect(state.isSaving).toBe(false);
    expect(state.successMessage).toBe('Preferencia guardada correctamente.');
    expect(userPreferencesService.saveUserPreferences).toHaveBeenCalledWith({
      ...userPreferencesService.DEFAULT_USER_PREFERENCES,
      theme: 'dark',
    });
    expect(userPreferencesService.applyThemeMode).toHaveBeenCalledWith('dark');
  });

  it('resetPreferences clears storage, applies defaults and notifies', async () => {
    vi.mocked(userPreferencesService.resetUserPreferences).mockResolvedValueOnce(
      userPreferencesService.DEFAULT_USER_PREFERENCES,
    );

    // First change a value in state
    usePreferencesStore.setState({
      preferences: {
        theme: 'dark',
        displayDensity: 'compact',
        pageSize: 50,
        confirmBeforeActions: false,
      },
    });

    await usePreferencesStore.getState().resetPreferences();

    const state = usePreferencesStore.getState();
    expect(state.preferences).toEqual(userPreferencesService.DEFAULT_USER_PREFERENCES);
    expect(state.successMessage).toBe('Preferencias restablecidas a los valores predeterminados.');
    expect(userPreferencesService.resetUserPreferences).toHaveBeenCalledTimes(1);
    expect(userPreferencesService.applyThemeMode).toHaveBeenCalledWith('system');
  });

  it('sets error when saveUserPreferences fails', async () => {
    vi.mocked(userPreferencesService.saveUserPreferences).mockRejectedValueOnce(new Error('Storage disk full'));

    await usePreferencesStore.getState().updatePreference('theme', 'light');

    const state = usePreferencesStore.getState();
    expect(state.error).toBe('No se pudo guardar la preferencia en el dispositivo.');
    expect(state.isSaving).toBe(false);
  });
});
