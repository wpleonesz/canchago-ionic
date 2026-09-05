import { Capacitor } from '@capacitor/core';
import type { QueryClient } from '@tanstack/react-query';
import { OWN_PROFILE_QUERY_KEY } from '../../features/users/hooks/useOwnProfile';
import { updateOwnProfile } from '../api/endpoints/users';
import { AppClientError, BusinessRuleError } from '../api/errorMapper';
import { useNetworkStore } from '../../store/networkStore';
import { useOutboxStore } from '../../store/outboxStore';
import { computeNextAttempt, isRetryableError, MAX_AUTO_ATTEMPTS } from './retryPolicy';
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
import type { OutboxIntentRow, OwnProfileOutboxInput } from './outboxTypes';

let retryTimer: ReturnType<typeof setTimeout> | null = null;
let syncInFlight: Promise<void> | null = null;

const clearRetryTimer = (): void => {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
};

const refreshOutboxStore = async (): Promise<void> => {
  useOutboxStore.getState().setIntent(await getActiveIntent());
};

const toRequestBody = (intent: OutboxIntentRow): OwnProfileOutboxInput => ({
  phone: intent.phone,
  facebookUrl: intent.facebookUrl,
  instagramUrl: intent.instagramUrl,
  linkedinUrl: intent.linkedinUrl,
  xUrl: intent.xUrl,
  githubUrl: intent.githubUrl,
  tiktokUrl: intent.tiktokUrl,
  websiteUrl: intent.websiteUrl,
  expectedProfileUpdatedAt: intent.expectedProfileUpdatedAt,
});

const processIntent = async (intent: OutboxIntentRow, queryClient: QueryClient): Promise<void> => {
  await markSyncing(intent.id);
  useOutboxStore.getState().setSyncing(true);
  await refreshOutboxStore();

  try {
    const profile = await updateOwnProfile(toRequestBody(intent));
    await markSynced(intent.id);
    queryClient.setQueryData(OWN_PROFILE_QUERY_KEY, profile);
    useOutboxStore.getState().setJustSynced(true);
  } catch (caught) {
    const error = caught instanceof AppClientError ? caught : null;

    if (error instanceof BusinessRuleError) {
      await markConflict(intent.id, error.message);
      // Trae el estado real del servidor para que la UI de conflicto pueda ofrecerlo — nunca se
      // sobrescribe la fila local con esto, solo se refresca la lectura de servidor.
      void queryClient.invalidateQueries({ queryKey: OWN_PROFILE_QUERY_KEY });
    } else if (error && isRetryableError(error) && intent.attemptCount + 1 < MAX_AUTO_ATTEMPTS) {
      const attemptCount = intent.attemptCount + 1;
      const { delayMs, nextAttemptAt } = computeNextAttempt(attemptCount);
      await markRetryScheduled(intent.id, attemptCount, nextAttemptAt, error.code, error.message);
      clearRetryTimer();
      retryTimer = setTimeout(() => void processOwnProfileOutbox(queryClient), delayMs);
    } else {
      const code = error?.code ?? 'UNKNOWN_ERROR';
      const message = error?.message ?? 'No se pudo sincronizar el cambio pendiente.';
      await markTerminalError(intent.id, code, message);
    }
  } finally {
    useOutboxStore.getState().setSyncing(false);
    await refreshOutboxStore();
  }
};

// Punto de entrada único del motor: procesa como máximo un intent por llamada (hay a lo sumo uno
// activo por coalescing) y reprograma su propio reintento vía retryTimer si aplica.
export const processOwnProfileOutbox = async (queryClient: QueryClient): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;
  if (syncInFlight) return syncInFlight;

  syncInFlight = (async () => {
    if (!useNetworkStore.getState().isOnline) {
      await refreshOutboxStore();
      return;
    }

    const due = await getDueIntent();
    if (!due) {
      await refreshOutboxStore();
      return;
    }

    await processIntent(due, queryClient);
  })();

  try {
    await syncInFlight;
  } finally {
    syncInFlight = null;
  }
};

export const enqueueOwnProfileIntent = async (input: OwnProfileOutboxInput): Promise<OutboxIntentRow> => {
  const intent = await upsertOwnProfileIntent(input);
  useOutboxStore.getState().setIntent(intent);
  return intent;
};

export const retryOutboxIntentNow = async (queryClient: QueryClient): Promise<void> => {
  const active = await getActiveIntent();
  if (!active) return;
  await resetToPending(active.id, active.expectedProfileUpdatedAt);
  await refreshOutboxStore();
  await processOwnProfileOutbox(queryClient);
};

// Conflicto: "usar mis cambios de nuevo" — reintenta con el timestamp fresco del servidor.
export const resolveConflictKeepMine = async (
  freshExpectedProfileUpdatedAt: string,
  queryClient: QueryClient,
): Promise<void> => {
  const active = await getActiveIntent();
  if (!active) return;
  await resetToPending(active.id, freshExpectedProfileUpdatedAt);
  await refreshOutboxStore();
  await processOwnProfileOutbox(queryClient);
};

// Conflicto: "descartar mi cambio pendiente".
export const resolveConflictDiscard = async (): Promise<void> => {
  const active = await getActiveIntent();
  if (!active) return;
  await deleteIntent(active.id);
  useOutboxStore.getState().setIntent(null);
};

export const loadActiveOutboxIntent = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;
  await refreshOutboxStore();
};
