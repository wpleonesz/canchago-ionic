import { create } from 'zustand';
import type { SessionUser } from '../types/api/auth';

type SessionStatus = 'idle' | 'authenticated' | 'unauthenticated';

interface SessionState {
  user: SessionUser | null;
  status: SessionStatus;
  setSession: (user: SessionUser) => void;
  clearSession: () => void;
}

// Espejo imperativo de la sesión (server-state real vive en TanStack Query, ver
// features/auth/hooks/useSession.ts) para que código no-React, como el interceptor 401 de
// apiClient, pueda leer/limpiar la sesión sin depender de hooks — ver tech-stack.md §5.
export const useSessionStore = create<SessionState>(set => ({
  user: null,
  status: 'idle',
  setSession: user => set({ user, status: 'authenticated' }),
  clearSession: () => set({ user: null, status: 'unauthenticated' }),
}));
