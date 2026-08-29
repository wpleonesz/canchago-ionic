import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSessionStore } from '../../../store/sessionStore';
import AccessRequestsModule from './AccessRequestsModule';

vi.mock('../../../services/api/endpoints/access-requests', () => ({
  getAccessRequests: vi.fn().mockResolvedValue({
    data: [],
    meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
  }),
}));

const renderModule = (): ReturnType<typeof render> => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/admin/organizations/access-requests']}>
        <AccessRequestsModule />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

afterEach(() => {
  useSessionStore.getState().clearSession();
});

describe('AccessRequestsModule', () => {
  it('renders the pending requests screen for a user with organizaciones.manage', () => {
    useSessionStore.getState().setSession({
      id: 'user-1',
      email: 'admin@example.com',
      name: 'Admin',
      roles: [],
      permissions: [{ id: 'permission-1', code: 'organizaciones.manage' }],
    });

    renderModule();

    expect(screen.getByText('Solicitudes de acceso')).toBeInTheDocument();
  });

  it('hides the screen for a user without organizaciones.manage', () => {
    useSessionStore.getState().setSession({
      id: 'user-2',
      email: 'gestor@example.com',
      name: 'Gestor',
      roles: [],
      permissions: [],
    });

    renderModule();

    expect(screen.queryByText('Solicitudes de acceso')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('No tienes permiso');
  });
});
