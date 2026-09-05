import type { capSQLiteVersionUpgrade } from '@capacitor-community/sqlite';

export const OUTBOX_DB_NAME = 'canchago_offline';
export const OUTBOX_DB_VERSION = 1;

// Forward-only: nunca editar una entrada ya publicada ni hacer DROP+CREATE para evolucionar el
// esquema — una futura migración agrega { toVersion: 2, statements: [...] } al final del array.
export const OUTBOX_MIGRATIONS: capSQLiteVersionUpgrade[] = [
  {
    toVersion: 1,
    statements: [
      `CREATE TABLE IF NOT EXISTS outbox_own_profile_intent (
        id                          TEXT PRIMARY KEY NOT NULL,
        status                      TEXT NOT NULL CHECK (status IN ('pending','syncing','synced','error','conflict')),
        phone                       TEXT,
        facebook_url                TEXT,
        instagram_url               TEXT,
        linkedin_url                TEXT,
        x_url                       TEXT,
        github_url                  TEXT,
        tiktok_url                  TEXT,
        website_url                 TEXT,
        expected_profile_updated_at TEXT NOT NULL,
        attempt_count               INTEGER NOT NULL DEFAULT 0,
        next_attempt_at             TEXT,
        last_error_code             TEXT,
        last_error_message          TEXT,
        created_at                  TEXT NOT NULL,
        updated_at                  TEXT NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_outbox_status_next_attempt
        ON outbox_own_profile_intent (status, next_attempt_at);`,
    ],
  },
];
