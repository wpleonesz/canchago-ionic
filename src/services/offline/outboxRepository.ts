import { getOutboxDb } from './db';
import type { OutboxIntentRow, OutboxStatus, OwnProfileOutboxInput } from './outboxTypes';

// Único módulo del proyecto con SQL disperso, a propósito: es el equivalente local de
// database/<modulo>/ en el backend (tech-stack.md §2) — el resto del código nunca escribe SQL.

// Fila huérfana: quedó "syncing" porque la app se mató a medio-envío. Se recupera para
// reintentar; en el peor caso el servidor responde 409 (fallo seguro, ver plan.md §Riesgos).
const SYNCING_ORPHAN_THRESHOLD_MS = 30_000;

interface OutboxRow {
  id: string;
  status: OutboxStatus;
  phone: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  x_url: string | null;
  github_url: string | null;
  tiktok_url: string | null;
  website_url: string | null;
  expected_profile_updated_at: string;
  attempt_count: number;
  next_attempt_at: string | null;
  last_error_code: string | null;
  last_error_message: string | null;
  created_at: string;
  updated_at: string;
}

const mapRow = (row: OutboxRow): OutboxIntentRow => ({
  id: row.id,
  status: row.status,
  phone: row.phone,
  facebookUrl: row.facebook_url,
  instagramUrl: row.instagram_url,
  linkedinUrl: row.linkedin_url,
  xUrl: row.x_url,
  githubUrl: row.github_url,
  tiktokUrl: row.tiktok_url,
  websiteUrl: row.website_url,
  expectedProfileUpdatedAt: row.expected_profile_updated_at,
  attemptCount: row.attempt_count,
  nextAttemptAt: row.next_attempt_at,
  lastErrorCode: row.last_error_code,
  lastErrorMessage: row.last_error_message,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const nowIso = (): string => new Date().toISOString();

export const getActiveIntent = async (): Promise<OutboxIntentRow | null> => {
  const db = await getOutboxDb();
  const { values } = await db.query(
    `SELECT * FROM outbox_own_profile_intent WHERE status IN ('pending','syncing','error','conflict') LIMIT 1;`,
  );
  const row = values?.[0] as OutboxRow | undefined;
  return row ? mapRow(row) : null;
};

// Fila elegible para que el motor de sincronización la procese ahora: pendiente, en error con
// reintento vencido, o huérfana de un "syncing" interrumpido.
export const getDueIntent = async (): Promise<OutboxIntentRow | null> => {
  const db = await getOutboxDb();
  const now = nowIso();
  const orphanCutoff = new Date(Date.now() - SYNCING_ORPHAN_THRESHOLD_MS).toISOString();
  const { values } = await db.query(
    `SELECT * FROM outbox_own_profile_intent
     WHERE status = 'pending'
        OR (status = 'error' AND next_attempt_at IS NOT NULL AND next_attempt_at <= ?)
        OR (status = 'syncing' AND updated_at <= ?)
     ORDER BY created_at ASC
     LIMIT 1;`,
    [now, orphanCutoff],
  );
  const row = values?.[0] as OutboxRow | undefined;
  return row ? mapRow(row) : null;
};

// Coalescing: una sola fila activa por usuario. Si ya hay una pendiente/en error, la actualiza en
// vez de crear una nueva (reinicia intentos); si hay una en conflicto, la UI ya bloqueó el
// formulario (readOnly) y no debería llegar aquí.
export const upsertOwnProfileIntent = async (input: OwnProfileOutboxInput): Promise<OutboxIntentRow> => {
  const db = await getOutboxDb();
  const { values } = await db.query(
    `SELECT id, status FROM outbox_own_profile_intent WHERE status IN ('pending','syncing','error','conflict') LIMIT 1;`,
  );
  const existing = values?.[0] as Pick<OutboxRow, 'id' | 'status'> | undefined;

  if (existing?.status === 'conflict') {
    throw new Error('Ya existe un cambio pendiente en conflicto; resuélvelo antes de editar de nuevo.');
  }

  const timestamp = nowIso();
  const fields = [
    input.phone ?? null,
    input.facebookUrl ?? null,
    input.instagramUrl ?? null,
    input.linkedinUrl ?? null,
    input.xUrl ?? null,
    input.githubUrl ?? null,
    input.tiktokUrl ?? null,
    input.websiteUrl ?? null,
    input.expectedProfileUpdatedAt,
  ];

  if (existing) {
    await db.run(
      `UPDATE outbox_own_profile_intent SET
         status = 'pending', phone = ?, facebook_url = ?, instagram_url = ?, linkedin_url = ?,
         x_url = ?, github_url = ?, tiktok_url = ?, website_url = ?, expected_profile_updated_at = ?,
         attempt_count = 0, next_attempt_at = NULL, last_error_code = NULL, last_error_message = NULL,
         updated_at = ?
       WHERE id = ?;`,
      [...fields, timestamp, existing.id],
    );
    return { ...(await getActiveIntent())! };
  }

  const id = crypto.randomUUID();
  await db.run(
    `INSERT INTO outbox_own_profile_intent
       (id, status, phone, facebook_url, instagram_url, linkedin_url, x_url, github_url, tiktok_url,
        website_url, expected_profile_updated_at, attempt_count, next_attempt_at, last_error_code,
        last_error_message, created_at, updated_at)
     VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, NULL, NULL, ?, ?);`,
    [id, ...fields, timestamp, timestamp],
  );
  return { ...(await getActiveIntent())! };
};

export const markSyncing = async (id: string): Promise<void> => {
  const db = await getOutboxDb();
  await db.run(`UPDATE outbox_own_profile_intent SET status = 'syncing', updated_at = ? WHERE id = ?;`, [
    nowIso(),
    id,
  ]);
};

// Sincronización exitosa: la fila se borra de inmediato — el estado "Sincronizado" que ve el
// usuario vive un momento en outboxStore (memoria), no se relee de SQLite (plan.md §Decisiones).
export const markSynced = async (id: string): Promise<void> => {
  const db = await getOutboxDb();
  await db.run(`DELETE FROM outbox_own_profile_intent WHERE id = ?;`, [id]);
};

// Reintentable: programa el próximo intento (backoff calculado por retryPolicy.ts).
export const markRetryScheduled = async (
  id: string,
  attemptCount: number,
  nextAttemptAt: string,
  errorCode: string,
  errorMessage: string,
): Promise<void> => {
  const db = await getOutboxDb();
  await db.run(
    `UPDATE outbox_own_profile_intent SET
       status = 'error', attempt_count = ?, next_attempt_at = ?, last_error_code = ?,
       last_error_message = ?, updated_at = ?
     WHERE id = ?;`,
    [attemptCount, nextAttemptAt, errorCode, errorMessage, nowIso(), id],
  );
};

// Terminal (validación/auth/agotó reintentos): igual que arriba pero sin próximo intento
// automático — solo reintento manual (resetToPending) queda disponible.
export const markTerminalError = async (id: string, errorCode: string, errorMessage: string): Promise<void> => {
  const db = await getOutboxDb();
  await db.run(
    `UPDATE outbox_own_profile_intent SET
       status = 'error', next_attempt_at = NULL, last_error_code = ?, last_error_message = ?, updated_at = ?
     WHERE id = ?;`,
    [errorCode, errorMessage, nowIso(), id],
  );
};

// Conflicto (409): la fila se conserva tal cual para que el usuario decida (plan.md §Conflicto).
export const markConflict = async (id: string, errorMessage: string): Promise<void> => {
  const db = await getOutboxDb();
  await db.run(
    `UPDATE outbox_own_profile_intent SET
       status = 'conflict', next_attempt_at = NULL, last_error_code = 'CONFLICT', last_error_message = ?, updated_at = ?
     WHERE id = ?;`,
    [errorMessage, nowIso(), id],
  );
};

// Reintento manual (botón "Reintentar" tras agotar intentos automáticos) o "usar mis cambios de
// nuevo" tras un conflicto — vuelve a pending con expectedProfileUpdatedAt fresco.
export const resetToPending = async (id: string, expectedProfileUpdatedAt: string): Promise<void> => {
  const db = await getOutboxDb();
  await db.run(
    `UPDATE outbox_own_profile_intent SET
       status = 'pending', attempt_count = 0, next_attempt_at = NULL, last_error_code = NULL,
       last_error_message = NULL, expected_profile_updated_at = ?, updated_at = ?
     WHERE id = ?;`,
    [expectedProfileUpdatedAt, nowIso(), id],
  );
};

export const deleteIntent = async (id: string): Promise<void> => {
  const db = await getOutboxDb();
  await db.run(`DELETE FROM outbox_own_profile_intent WHERE id = ?;`, [id]);
};

export const outboxRepository = {
  getActiveIntent,
  getDueIntent,
  upsertOwnProfileIntent,
  markSyncing,
  markSynced,
  markRetryScheduled,
  markTerminalError,
  markConflict,
  resetToPending,
  deleteIntent,
};
