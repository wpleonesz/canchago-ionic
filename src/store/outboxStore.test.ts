import { describe, expect, it } from 'vitest';
import { useOutboxStore } from './outboxStore';
import type { OutboxIntentRow } from '../services/offline/outboxTypes';

const intent: OutboxIntentRow = {
  id: 'intent-1',
  status: 'pending',
  phone: null,
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
};

describe('store/outboxStore', () => {
  it('defaults to no active intent', () => {
    useOutboxStore.setState({ intent: null, isSyncing: false, justSynced: false });
    expect(useOutboxStore.getState().intent).toBeNull();
  });

  it('setIntent/setSyncing/setJustSynced update independently', () => {
    useOutboxStore.getState().setIntent(intent);
    useOutboxStore.getState().setSyncing(true);
    useOutboxStore.getState().setJustSynced(true);

    const state = useOutboxStore.getState();
    expect(state.intent).toEqual(intent);
    expect(state.isSyncing).toBe(true);
    expect(state.justSynced).toBe(true);
  });
});
