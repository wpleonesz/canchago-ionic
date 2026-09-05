import { Preferences } from '@capacitor/preferences';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearAllPreferences, getPreference, removePreference, setPreference } from './preferences';

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
  },
}));

describe('services/storage/preferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gets a stored value successfully', async () => {
    vi.mocked(Preferences.get).mockResolvedValueOnce({ value: 'compact' });

    const value = await getPreference('display_density');

    expect(Preferences.get).toHaveBeenCalledWith({ key: 'display_density' });
    expect(value).toBe('compact');
  });

  it('returns null when key does not exist', async () => {
    vi.mocked(Preferences.get).mockResolvedValueOnce({ value: null });

    const value = await getPreference('non_existent');

    expect(value).toBeNull();
  });

  it('sets a non-sensitive preference value', async () => {
    vi.mocked(Preferences.set).mockResolvedValueOnce();

    await setPreference('theme_mode', 'dark');

    expect(Preferences.set).toHaveBeenCalledWith({ key: 'theme_mode', value: 'dark' });
  });

  it('removes a preference', async () => {
    vi.mocked(Preferences.remove).mockResolvedValueOnce();

    await removePreference('theme_mode');

    expect(Preferences.remove).toHaveBeenCalledWith({ key: 'theme_mode' });
  });

  it('clears all preferences', async () => {
    vi.mocked(Preferences.clear).mockResolvedValueOnce();

    await clearAllPreferences();

    expect(Preferences.clear).toHaveBeenCalledTimes(1);
  });

  describe('Security safeguards: Prohibits storing sensitive data in plain preferences', () => {
    it('throws when attempting to store a session token', async () => {
      await expect(setPreference('canchago_session_token', 'jwt.secret.token')).rejects.toThrow(
        /datos potencialmente sensibles/,
      );
      expect(Preferences.set).not.toHaveBeenCalled();
    });

    it('throws when key contains "auth", "secret" or "password"', async () => {
      await expect(setPreference('user_auth_token', 'val')).rejects.toThrow();
      await expect(setPreference('api_secret_key', 'val')).rejects.toThrow();
      await expect(setPreference('saved_password', 'val')).rejects.toThrow();
      await expect(setPreference('keycloak_session', 'val')).rejects.toThrow();
      await expect(setPreference('refresh_token', 'val')).rejects.toThrow();
    });
  });
});
