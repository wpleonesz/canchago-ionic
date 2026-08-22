import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { useSessionStore } from '../../../store/sessionStore';
import { filterAdminNavigation } from '../navigation/admin-capabilities';
import { ADMIN_NAVIGATION } from '../navigation/admin-navigation';
import AdminDashboardPage from './AdminDashboardPage';

const mutate = vi.fn();
let isPending = false;

vi.mock('../../auth/hooks/useSession', () => ({
  useLogoutMutation: () => ({ mutate, isPending }),
}));

afterEach(() => {
  useSessionStore.getState().clearSession();
  mutate.mockClear();
  isPending = false;
});

describe('AdminDashboardPage', () => {
  it('shows the profile summary and a safe empty state when the user has no administrative capabilities', () => {
    useSessionStore.getState().setSession({
      id: 'user-1',
      email: 'player@example.com',
      name: 'Player One',
      roles: [],
      permissions: [],
    });

    render(
      <MemoryRouter>
        <AdminDashboardPage groups={[]} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Hola, Player' })).toBeInTheDocument();
    expect(screen.getByText('player@example.com')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('no tiene capacidades administrativas');
  });

  it('renders only the authorized modules as client-side links', () => {
    const permissions = [{ id: 'permission-1', code: 'organizaciones.read' }];
    useSessionStore.getState().setSession({
      id: 'user-1',
      email: 'manager@example.com',
      name: 'Alex Manager',
      roles: [{ id: 'role-1', code: 'anything', name: 'Anything' }],
      permissions,
    });

    render(
      <MemoryRouter>
        <AdminDashboardPage groups={filterAdminNavigation(ADMIN_NAVIGATION, permissions)} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /organizaciones y sedes/i })).toHaveAttribute(
      'href',
      '/admin/organizations',
    );
    expect(screen.queryByRole('link', { name: /usuarios/i })).not.toBeInTheDocument();
  });

  it('triggers logout and exposes its pending state', () => {
    useSessionStore.getState().setSession({
      id: 'user-1',
      email: 'mateo@canchago.local',
      name: 'Mateo Vera',
      roles: [{ id: 'role-1', code: 'futbolista', name: 'Futbolista' }],
      permissions: [],
    });
    isPending = true;

    const { container } = render(
      <MemoryRouter>
        <AdminDashboardPage groups={[]} />
      </MemoryRouter>,
    );
    const button = container.querySelector('ion-button');

    expect(button).not.toBeNull();
    expect(button?.disabled).toBe(true);
    expect(button).toHaveAttribute('aria-busy');
    expect(mutate).not.toHaveBeenCalled();
  });
});
