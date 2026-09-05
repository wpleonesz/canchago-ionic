import { create } from 'zustand';
import type { OutboxIntentRow } from '../services/offline/outboxTypes';

interface OutboxState {
  intent: OutboxIntentRow | null;
  isSyncing: boolean;
  // Bandera efímera: la fila se borra de SQLite apenas sincroniza (outboxRepository.markSynced),
  // así que el badge "Sincronizado" no puede leerse de la fila — vive un momento aquí (ver
  // features/users/hooks/useOwnProfileOutbox.ts, que la apaga sola tras unos segundos).
  justSynced: boolean;
  setIntent: (intent: OutboxIntentRow | null) => void;
  setSyncing: (isSyncing: boolean) => void;
  setJustSynced: (justSynced: boolean) => void;
}

// Espejo en memoria de la fila activa del Outbox (igual que sessionStore.ts) para que la UI
// reaccione sin releer SQLite en cada render — SQLite sigue siendo la fuente de verdad que
// sobrevive a matar la app (services/offline/outboxRepository.ts).
export const useOutboxStore = create<OutboxState>(set => ({
  intent: null,
  isSyncing: false,
  justSynced: false,
  setIntent: intent => set({ intent }),
  setSyncing: isSyncing => set({ isSyncing }),
  setJustSynced: justSynced => set({ justSynced }),
}));
