import { Capacitor } from '@capacitor/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: vi.fn() },
}));

vi.mock('@capacitor-community/sqlite', () => ({
  CapacitorSQLite: {},
  SQLiteConnection: vi.fn().mockImplementation(() => ({
    addUpgradeStatement: vi.fn(),
    isConnection: vi.fn(),
    createConnection: vi.fn(),
    retrieveConnection: vi.fn(),
  })),
}));

describe('services/offline/db', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('rejects explicitly on non-native platforms instead of trying to open SQLite', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    const { getOutboxDb } = await import('./db');
    await expect(getOutboxDb()).rejects.toThrow(/solo está disponible en la app nativa/);
  });
});
