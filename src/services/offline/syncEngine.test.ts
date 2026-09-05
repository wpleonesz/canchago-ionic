import { Capacitor } from '@capacitor/core';
import type { QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OWN_PROFILE_QUERY_KEY } from '../../features/users/hooks/useOwnProfile';
import { useNetworkStore } from '../../store/networkStore';
import { useOutboxStore } from '../../store/outboxStore';
import { updateOwnProfile } from '../api/endpoints/users';
import { BusinessRuleError, NetworkError, ValidationError } from '../api/errorMapper';
import { MAX_AUTO_ATTEMPTS } from './retryPolicy';
import type { OutboxIntentRow, OwnProfileOutboxInput } from './outboxTypes';
import * as outboxRepository from './outboxRepository';
import { enqueueOwnProfileIntent, processOwnProfileOutbox, resolveConflictDiscard } from './syncEngine';

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: vi.fn(() => true) },
}));

vi.mock('../api/endpoints/users', () => ({
  updateOwnProfile: vi.fn(),
}));

vi.mock('./outboxRepository', () => ({
  getActiveIntent: vi.fn(),
  getDueIntent: vi.fn(),
  upsertOwnProfileIntent: vi.fn(),
  markSyncing: vi.fn(),
  markSynced: vi.fn(),
  markRetryScheduled: vi.fn(),
  markTerminalError: vi.fn(),
  markConflict: vi.fn(),
  resetToPending: vi.fn(),
  deleteIntent: vi.fn(),
}));

const buildIntent = (overrides: Partial<OutboxIntentRow> = {}): OutboxIntentRow => ({
  id: 'intent-1',
  status: 'pending',
  phone: '+593999999999',
  facebookUrl: null,
  instagramUrl: null,
  linkedinUrl: null,
  xUrl: null,
  githubUrl: null,
  tiktokUrl: null,
  websiteUrl: null,
  expectedProfileUpdatedAt: '2026-01-01T00:00:00.000Z',
  attemptCount: 0,
  nextAttemptAt: null,
  lastErrorCode: null,
  lastErrorMessage: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const buildQueryClient = () =>
  ({
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn(),
    getQueryData: vi.fn(),
  }) as unknown as QueryClient;

describe('services/offline/syncEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    useNetworkStore.setState({ isOnline: true });
    useOutboxStore.setState({ intent: null, isSyncing: false, justSynced: false });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('is a no-op on non-native platforms', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    await processOwnProfileOutbox(buildQueryClient());
    expect(outboxRepository.getDueIntent).not.toHaveBeenCalled();
  });

  it('refreshes the store without attempting a sync while offline', async () => {
    useNetworkStore.setState({ isOnline: false });
    vi.mocked(outboxRepository.getActiveIntent).mockResolvedValue(buildIntent());

    await processOwnProfileOutbox(buildQueryClient());

    expect(outboxRepository.getDueIntent).not.toHaveBeenCalled();
    expect(updateOwnProfile).not.toHaveBeenCalled();
    expect(useOutboxStore.getState().intent?.id).toBe('intent-1');
  });

  it('does nothing when online but no intent is due', async () => {
    vi.mocked(outboxRepository.getDueIntent).mockResolvedValue(null);
    vi.mocked(outboxRepository.getActiveIntent).mockResolvedValue(null);

    await processOwnProfileOutbox(buildQueryClient());

    expect(updateOwnProfile).not.toHaveBeenCalled();
  });

  it('on success: marks the row synced, updates the query cache and flags justSynced', async () => {
    const intent = buildIntent();
    vi.mocked(outboxRepository.getDueIntent).mockResolvedValue(intent);
    vi.mocked(outboxRepository.getActiveIntent).mockResolvedValue(null); // after markSynced deletes it
    vi.mocked(updateOwnProfile).mockResolvedValue({
      phone: intent.phone,
      facebookUrl: null,
      instagramUrl: null,
      linkedinUrl: null,
      xUrl: null,
      githubUrl: null,
      tiktokUrl: null,
      websiteUrl: null,
      hasAvatar: false,
      avatarUpdatedAt: null,
      profileUpdatedAt: '2026-01-02T00:00:00.000Z',
    });
    const queryClient = buildQueryClient();

    await processOwnProfileOutbox(queryClient);

    expect(outboxRepository.markSyncing).toHaveBeenCalledWith('intent-1');
    expect(outboxRepository.markSynced).toHaveBeenCalledWith('intent-1');
    expect(queryClient.setQueryData).toHaveBeenCalledWith(
      OWN_PROFILE_QUERY_KEY,
      expect.objectContaining({ profileUpdatedAt: '2026-01-02T00:00:00.000Z' }),
    );
    expect(useOutboxStore.getState().justSynced).toBe(true);
    expect(useOutboxStore.getState().intent).toBeNull();
  });

  it('on 409: marks the row as conflict and refreshes the real profile, never overwriting it', async () => {
    const intent = buildIntent();
    vi.mocked(outboxRepository.getDueIntent).mockResolvedValue(intent);
    vi.mocked(outboxRepository.getActiveIntent).mockResolvedValue(buildIntent({ status: 'conflict' }));
    vi.mocked(updateOwnProfile).mockRejectedValue(new BusinessRuleError('El perfil cambió en otra sesión.'));
    const queryClient = buildQueryClient();

    await processOwnProfileOutbox(queryClient);

    expect(outboxRepository.markConflict).toHaveBeenCalledWith('intent-1', 'El perfil cambió en otra sesión.');
    expect(outboxRepository.markSynced).not.toHaveBeenCalled();
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: OWN_PROFILE_QUERY_KEY });
    expect(useOutboxStore.getState().intent?.status).toBe('conflict');
  });

  it('on a retryable error with attempts left: schedules a backoff retry instead of failing terminally', async () => {
    vi.useFakeTimers();
    const intent = buildIntent({ attemptCount: 0 });
    vi.mocked(outboxRepository.getDueIntent).mockResolvedValueOnce(intent).mockResolvedValueOnce(null);
    vi.mocked(outboxRepository.getActiveIntent).mockResolvedValue(buildIntent({ status: 'error', attemptCount: 1 }));
    vi.mocked(updateOwnProfile).mockRejectedValue(new NetworkError('sin conexión'));

    await processOwnProfileOutbox(buildQueryClient());

    expect(outboxRepository.markRetryScheduled).toHaveBeenCalledWith(
      'intent-1',
      1,
      expect.any(String),
      'NETWORK_ERROR',
      'sin conexión',
    );
    expect(outboxRepository.markTerminalError).not.toHaveBeenCalled();

    // El propio motor reprograma su siguiente intento con un timer.
    await vi.runOnlyPendingTimersAsync();
    expect(outboxRepository.getDueIntent).toHaveBeenCalledTimes(2);
  });

  it('stops auto-retrying once MAX_AUTO_ATTEMPTS is reached, falling back to a terminal error', async () => {
    const intent = buildIntent({ attemptCount: MAX_AUTO_ATTEMPTS - 1 });
    vi.mocked(outboxRepository.getDueIntent).mockResolvedValue(intent);
    vi.mocked(outboxRepository.getActiveIntent).mockResolvedValue(buildIntent({ status: 'error' }));
    vi.mocked(updateOwnProfile).mockRejectedValue(new NetworkError('sin conexión'));

    await processOwnProfileOutbox(buildQueryClient());

    expect(outboxRepository.markRetryScheduled).not.toHaveBeenCalled();
    expect(outboxRepository.markTerminalError).toHaveBeenCalledWith('intent-1', 'NETWORK_ERROR', 'sin conexión');
  });

  it('never auto-retries a non-retryable error (validation/auth/authorization)', async () => {
    const intent = buildIntent();
    vi.mocked(outboxRepository.getDueIntent).mockResolvedValue(intent);
    vi.mocked(outboxRepository.getActiveIntent).mockResolvedValue(buildIntent({ status: 'error' }));
    vi.mocked(updateOwnProfile).mockRejectedValue(new ValidationError('celular inválido'));

    await processOwnProfileOutbox(buildQueryClient());

    expect(outboxRepository.markRetryScheduled).not.toHaveBeenCalled();
    expect(outboxRepository.markTerminalError).toHaveBeenCalledWith('intent-1', 'VALIDATION_ERROR', 'celular inválido');
  });

  it('enqueueOwnProfileIntent stores the intent and mirrors it into outboxStore', async () => {
    const intent = buildIntent();
    vi.mocked(outboxRepository.upsertOwnProfileIntent).mockResolvedValue(intent);
    vi.mocked(outboxRepository.getDueIntent).mockResolvedValue(null);
    vi.mocked(outboxRepository.getActiveIntent).mockResolvedValue(intent);

    const input: OwnProfileOutboxInput = { phone: '+593999999999', expectedProfileUpdatedAt: intent.expectedProfileUpdatedAt };
    const result = await enqueueOwnProfileIntent(input);

    expect(outboxRepository.upsertOwnProfileIntent).toHaveBeenCalledWith(input);
    expect(result).toEqual(intent);
    expect(useOutboxStore.getState().intent).toEqual(intent);
  });

  it('resolveConflictDiscard deletes the pending row and clears the store', async () => {
    vi.mocked(outboxRepository.getActiveIntent).mockResolvedValue(buildIntent({ status: 'conflict' }));

    await resolveConflictDiscard();

    expect(outboxRepository.deleteIntent).toHaveBeenCalledWith('intent-1');
    expect(useOutboxStore.getState().intent).toBeNull();
  });
});
