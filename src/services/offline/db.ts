import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, type SQLiteDBConnection } from '@capacitor-community/sqlite';
import { OUTBOX_DB_NAME, OUTBOX_DB_VERSION, OUTBOX_MIGRATIONS } from './migrations';

// Solo nativo: la app nunca se distribuye como web/PWA (tech-stack.md §13) y no se registra
// jeep-sqlite, así que en navegador este módulo debe fallar explícito en vez de intentar abrir
// una base inexistente.
const sqliteConnection = new SQLiteConnection(CapacitorSQLite);

let dbConnectionPromise: Promise<SQLiteDBConnection> | null = null;

const openConnection = async (): Promise<SQLiteDBConnection> => {
  await sqliteConnection.addUpgradeStatement(OUTBOX_DB_NAME, OUTBOX_MIGRATIONS);

  const { result: alreadyOpen } = await sqliteConnection.isConnection(OUTBOX_DB_NAME, false);
  const db = alreadyOpen
    ? await sqliteConnection.retrieveConnection(OUTBOX_DB_NAME, false)
    : await sqliteConnection.createConnection(OUTBOX_DB_NAME, false, 'no-encryption', OUTBOX_DB_VERSION, false);

  await db.open();
  return db;
};

export const getOutboxDb = (): Promise<SQLiteDBConnection> => {
  if (!Capacitor.isNativePlatform()) {
    return Promise.reject(new Error('El almacenamiento offline solo está disponible en la app nativa (Android/iOS).'));
  }
  return (dbConnectionPromise ??= openConnection());
};

// Solo para pruebas: fuerza reabrir la conexión en el siguiente getOutboxDb().
export const resetOutboxDbConnectionForTests = (): void => {
  dbConnectionPromise = null;
};
