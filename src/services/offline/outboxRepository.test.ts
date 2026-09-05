import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getOutboxDb } from './db';
import {
  deleteIntent,
  getActiveIntent,
  getDueIntent,
  markConflict,
  markRetryScheduled,
  markSynced,
  markSyncing,
  markTerminalError,
  resetToPending,
  upsertOwnProfileIntent,
} from './outboxRepository';
import type { OwnProfileOutboxInput } from './outboxTypes';

vi.mock('./db', () => ({
  getOutboxDb: vi.fn(),
}));

const mockRow = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'intent-1',
  status: 'pending',
  phone: '+593999999999',
  facebook_url: null,
  instagram_url: null,
  linkedin_url: null,
  x_url: null,
  github_url: null,
  tiktok_url: null,
  website_url: null,
  expected_profile_updated_at: '2026-01-01T00:00:00.000Z',
  attempt_count: 0,
  next_attempt_at: null,
  last_error_code: null,
  last_error_message: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const buildDbMock = () => ({
  query: vi.fn(),
  run: vi.fn(),
});

const sampleInput: OwnProfileOutboxInput = {
  phone: '+593999999999',
  facebookUrl: null,
  instagramUrl: null,
  linkedinUrl: null,
  xUrl: null,
  githubUrl: null,
  tiktokUrl: null,
  websiteUrl: null,
  expectedProfileUpdatedAt: '2026-01-01T00:00:00.000Z',
};

describe('services/offline/outboxRepository', () => {
  let db: ReturnType<typeof buildDbMock>;

  beforeEach(() => {
    vi.clearAllMocks();
    db = buildDbMock();
    vi.mocked(getOutboxDb).mockResolvedValue(db as never);
  });

  describe('getActiveIntent', () => {
    it('returns null when there is no row', async () => {
      db.query.mockResolvedValueOnce({ values: [] });
      expect(await getActiveIntent()).toBeNull();
    });

    it('maps the SQL row into a camelCase OutboxIntentRow', async () => {
      db.query.mockResolvedValueOnce({ values: [mockRow({ status: 'conflict' })] });
      const intent = await getActiveIntent();
      expect(intent).toMatchObject({ id: 'intent-1', status: 'conflict', phone: '+593999999999' });
    });
  });

  describe('getDueIntent', () => {
    it('returns null when nothing is due', async () => {
      db.query.mockResolvedValueOnce({ values: [] });
      expect(await getDueIntent()).toBeNull();
    });

    it('queries pending, due-error and orphaned-syncing rows', async () => {
      db.query.mockResolvedValueOnce({ values: [mockRow()] });
      await getDueIntent();
      const [sql] = db.query.mock.calls[0] as [string, unknown[]];
      expect(sql).toContain("status = 'pending'");
      expect(sql).toContain("status = 'error'");
      expect(sql).toContain("status = 'syncing'");
    });
  });

  describe('upsertOwnProfileIntent', () => {
    it('inserts a new row when there is no active intent', async () => {
      db.query.mockResolvedValueOnce({ values: [] }); // check existing
      db.run.mockResolvedValueOnce({});
      db.query.mockResolvedValueOnce({ values: [mockRow()] }); // getActiveIntent after insert

      await upsertOwnProfileIntent(sampleInput);

      const [sql] = db.run.mock.calls[0] as [string, unknown[]];
      expect(sql).toContain('INSERT INTO outbox_own_profile_intent');
    });

    it('coalesces onto the existing row (same id) when one is already pending', async () => {
      db.query.mockResolvedValueOnce({ values: [{ id: 'intent-1', status: 'pending' }] });
      db.run.mockResolvedValueOnce({});
      db.query.mockResolvedValueOnce({ values: [mockRow()] });

      await upsertOwnProfileIntent(sampleInput);

      const [sql, params] = db.run.mock.calls[0] as [string, unknown[]];
      expect(sql).toContain('UPDATE outbox_own_profile_intent');
      expect(sql).toContain('attempt_count = 0');
      expect(params.at(-1)).toBe('intent-1');
    });

    it('refuses to coalesce onto a row already in conflict', async () => {
      db.query.mockResolvedValueOnce({ values: [{ id: 'intent-1', status: 'conflict' }] });
      await expect(upsertOwnProfileIntent(sampleInput)).rejects.toThrow(/conflicto/);
      expect(db.run).not.toHaveBeenCalled();
    });
  });

  it('markSyncing sets status to syncing', async () => {
    db.run.mockResolvedValueOnce({});
    await markSyncing('intent-1');
    const [sql, params] = db.run.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("status = 'syncing'");
    expect(params).toContain('intent-1');
  });

  it('markSynced deletes the row (success never lingers in the table)', async () => {
    db.run.mockResolvedValueOnce({});
    await markSynced('intent-1');
    const [sql, params] = db.run.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('DELETE FROM outbox_own_profile_intent');
    expect(params).toEqual(['intent-1']);
  });

  it('markRetryScheduled stores the attempt count and next attempt timestamp', async () => {
    db.run.mockResolvedValueOnce({});
    await markRetryScheduled('intent-1', 2, '2026-01-01T00:05:00.000Z', 'NETWORK_ERROR', 'sin conexión');
    const [sql, params] = db.run.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("status = 'error'");
    expect(params).toEqual(
      expect.arrayContaining([2, '2026-01-01T00:05:00.000Z', 'NETWORK_ERROR', 'sin conexión']),
    );
  });

  it('markTerminalError clears next_attempt_at so it never auto-retries', async () => {
    db.run.mockResolvedValueOnce({});
    await markTerminalError('intent-1', 'VALIDATION_ERROR', 'dato inválido');
    const [sql] = db.run.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('next_attempt_at = NULL');
  });

  it('markConflict preserves the row for the user to decide', async () => {
    db.run.mockResolvedValueOnce({});
    await markConflict('intent-1', 'El perfil cambió en otra sesión.');
    const [sql] = db.run.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("status = 'conflict'");
    expect(sql).not.toContain('DELETE');
  });

  it('resetToPending clears errors and refreshes expectedProfileUpdatedAt', async () => {
    db.run.mockResolvedValueOnce({});
    await resetToPending('intent-1', '2026-02-01T00:00:00.000Z');
    const [sql, params] = db.run.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("status = 'pending'");
    expect(sql).toContain('attempt_count = 0');
    expect(params).toEqual(expect.arrayContaining(['2026-02-01T00:00:00.000Z', 'intent-1']));
  });

  it('deleteIntent removes the row outright', async () => {
    db.run.mockResolvedValueOnce({});
    await deleteIntent('intent-1');
    const [sql, params] = db.run.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('DELETE FROM outbox_own_profile_intent');
    expect(params).toEqual(['intent-1']);
  });
});
