import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSessionStore } from '../../../store/sessionStore';
import { useSession } from './useSession';

vi.mock('../../../services/api/endpoints/auth', () => ({
  getSession: vi.fn().mockResolvedValue({
    id: 'user-1',
    email: 'futbolista@canchago.local',
    name: 'Mateo Vera',
    roles: [{ id: 'role-1', code: 'futbolista', name: 'Futbolista' }],
    permissions: [],
  }),
  logout: vi.fn(),
}));

const wrapper = ({ children }: PropsWithChildren): React.ReactElement => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

afterEach(() => {
  useSessionStore.getState().clearSession();
});

describe('useSession', () => {
  it('syncs a successful session fetch into sessionStore', async () => {
    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(useSessionStore.getState().status).toBe('authenticated');
    expect(useSessionStore.getState().user?.email).toBe('futbolista@canchago.local');
  });
});
