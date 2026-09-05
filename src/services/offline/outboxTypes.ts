import type { UpdateOwnUserProfileRequest } from '../../types/api/users';

export type OutboxStatus = 'pending' | 'syncing' | 'synced' | 'error' | 'conflict';

// Snapshot completo de los campos de contacto (no un diff parcial) — evita ambigüedad entre "no
// tocado" y "vaciado a null", igual que ya envía OwnProfilePage.tsx en el camino online.
export type OwnProfileOutboxInput = UpdateOwnUserProfileRequest;

// 1:1 con las columnas de outbox_own_profile_intent (ver services/offline/migrations.ts).
export interface OutboxIntentRow {
  id: string;
  status: OutboxStatus;
  phone: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  xUrl: string | null;
  githubUrl: string | null;
  tiktokUrl: string | null;
  websiteUrl: string | null;
  expectedProfileUpdatedAt: string;
  attemptCount: number;
  nextAttemptAt: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}
