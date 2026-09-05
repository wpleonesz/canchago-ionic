import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as basePreferences from './preferences';
import {
  applyDisplayDensity,
  applyThemeMode,
  DEFAULT_USER_PREFERENCES,
  getUserPreferences,
  resetUserPreferences,
  saveUserPreferences,
  USER_PREFERENCES_KEY,
  type UserPreferences,
} from './userPreferences';

vi.mock('./preferences', () => ({
  getPreference: vi.fn(),
  setPreference: vi.fn(),
  removePreference: vi.fn(),
}));

describe('services/storage/userPreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-density');
  });

  it('returns default preferences when nothing is stored', async () => {
    vi.mocked(basePreferences.getPreference).mockResolvedValueOnce(null);

    const result = await getUserPreferences();

    expect(result).toEqual(DEFAULT_USER_PREFERENCES);
    expect(basePreferences.getPreference).toHaveBeenCalledWith(USER_PREFERENCES_KEY);
  });

  it('parses valid stored preferences correctly', async () => {
    const customPrefs: UserPreferences = {
      theme: 'dark',
      displayDensity: 'compact',
      pageSize: 50,
      confirmBeforeActions: false,
    };
    vi.mocked(basePreferences.getPreference).mockResolvedValueOnce(JSON.stringify(customPrefs));

    const result = await getUserPreferences();

    expect(result).toEqual(customPrefs);
  });

  it('falls back to default preferences when stored json is corrupt or invalid', async () => {
    vi.mocked(basePreferences.getPreference).mockResolvedValueOnce('{ corrupt json...');

    const result = await getUserPreferences();

    expect(result).toEqual(DEFAULT_USER_PREFERENCES);
  });

  it('falls back to defaults when stored schema contains invalid enum values', async () => {
    vi.mocked(basePreferences.getPreference).mockResolvedValueOnce(
      JSON.stringify({ theme: 'neon-cyberpunk', displayDensity: 'ultra' }),
    );

    const result = await getUserPreferences();

    expect(result).toEqual(DEFAULT_USER_PREFERENCES);
  });

  it('saves validated user preferences to preferences storage', async () => {
    const customPrefs: UserPreferences = {
      theme: 'light',
      displayDensity: 'compact',
      pageSize: 10,
      confirmBeforeActions: true,
    };

    await saveUserPreferences(customPrefs);

    expect(basePreferences.setPreference).toHaveBeenCalledWith(USER_PREFERENCES_KEY, JSON.stringify(customPrefs));
  });

  it('resets preferences by removing the storage key and returning defaults', async () => {
    const result = await resetUserPreferences();

    expect(basePreferences.removePreference).toHaveBeenCalledWith(USER_PREFERENCES_KEY);
    expect(result).toEqual(DEFAULT_USER_PREFERENCES);
  });

  describe('DOM side-effects: applyThemeMode and applyDisplayDensity', () => {
    it('applies dark theme by adding .ion-palette-dark class', () => {
      applyThemeMode('dark');
      expect(document.documentElement.classList.contains('ion-palette-dark')).toBe(true);
      expect(document.documentElement.classList.contains('ion-palette-light')).toBe(false);
    });

    it('applies light theme by adding .ion-palette-light class and removing dark', () => {
      applyThemeMode('dark');
      applyThemeMode('light');
      expect(document.documentElement.classList.contains('ion-palette-dark')).toBe(false);
      expect(document.documentElement.classList.contains('ion-palette-light')).toBe(true);
    });

    it('applies system theme matching media query', () => {
      applyThemeMode('system');
      expect(document.documentElement.classList.contains('ion-palette-light')).toBe(false);
    });

    it('applies display density attribute on html element', () => {
      applyDisplayDensity('compact');
      expect(document.documentElement.getAttribute('data-density')).toBe('compact');

      applyDisplayDensity('comfortable');
      expect(document.documentElement.getAttribute('data-density')).toBe('comfortable');
    });
  });
});
