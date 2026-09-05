import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';
import { useOutboxStore } from '../../../store/outboxStore';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import type { OwnProfileOutboxInput } from '../../../services/offline/outboxTypes';
import {
  enqueueOwnProfileIntent,
  loadActiveOutboxIntent,
  processOwnProfileOutbox,
  resolveConflictDiscard,
  resolveConflictKeepMine,
  retryOutboxIntentNow,
} from '../../../services/offline/syncEngine';
import type { OwnUserProfileDto } from '../../../types/api/users';
import { OWN_PROFILE_QUERY_KEY } from './useOwnProfile';

const JUST_SYNCED_DISPLAY_MS = 3_000;

export const useOwnProfileOutbox = () => {
  const queryClient = useQueryClient();
  const intent = useOutboxStore(state => state.intent);
  const isSyncing = useOutboxStore(state => state.isSyncing);
  const justSynced = useOutboxStore(state => state.justSynced);
  const isOnline = useNetworkStatus();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    void (async () => {
      await loadActiveOutboxIntent();
      await processOwnProfileOutbox(queryClient);
    })();
    // Solo al montar la pantalla — el motor ya reacciona por su cuenta a la reconexión de red.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!justSynced) return;
    const timer = setTimeout(() => useOutboxStore.getState().setJustSynced(false), JUST_SYNCED_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [justSynced]);

  // input trae siempre los 8 campos (snapshot completo, ver plan.md §Decisiones) — el valor
  // puede ser null (campo vaciado por el usuario) o el nuevo texto, nunca undefined en la
  // práctica; se respeta undefined igual por si esta función se reutiliza con un input parcial.
  const applyOptimisticContact = (current: OwnUserProfileDto, input: OwnProfileOutboxInput): OwnUserProfileDto => ({
    ...current,
    phone: input.phone !== undefined ? input.phone : current.phone,
    facebookUrl: input.facebookUrl !== undefined ? input.facebookUrl : current.facebookUrl,
    instagramUrl: input.instagramUrl !== undefined ? input.instagramUrl : current.instagramUrl,
    linkedinUrl: input.linkedinUrl !== undefined ? input.linkedinUrl : current.linkedinUrl,
    xUrl: input.xUrl !== undefined ? input.xUrl : current.xUrl,
    githubUrl: input.githubUrl !== undefined ? input.githubUrl : current.githubUrl,
    tiktokUrl: input.tiktokUrl !== undefined ? input.tiktokUrl : current.tiktokUrl,
    websiteUrl: input.websiteUrl !== undefined ? input.websiteUrl : current.websiteUrl,
  });

  const enqueue = async (input: OwnProfileOutboxInput): Promise<void> => {
    const current = queryClient.getQueryData<OwnUserProfileDto>(OWN_PROFILE_QUERY_KEY);
    if (current) {
      queryClient.setQueryData<OwnUserProfileDto>(OWN_PROFILE_QUERY_KEY, applyOptimisticContact(current, input));
    }
    await enqueueOwnProfileIntent(input);
    void processOwnProfileOutbox(queryClient);
  };

  const retryNow = (): void => void retryOutboxIntentNow(queryClient);

  const keepMineAfterConflict = (): void => {
    const freshProfile = queryClient.getQueryData<OwnUserProfileDto>(OWN_PROFILE_QUERY_KEY);
    if (!freshProfile) return;
    void resolveConflictKeepMine(freshProfile.profileUpdatedAt, queryClient);
  };

  const discardPending = (): void => void resolveConflictDiscard();

  return { intent, isSyncing, justSynced, isOnline, enqueue, retryNow, keepMineAfterConflict, discardPending };
};
