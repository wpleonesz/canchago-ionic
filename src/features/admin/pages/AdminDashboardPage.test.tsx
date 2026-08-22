import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { useSessionStore } from '../../../store/sessionStore';
import { filterAdminNavigation } from '../navigation/admin-capabilities';
import { ADMIN_NAVIGATION } from '../navigation/admin-navigation';
import AdminDashboardPage from './AdminDashboardPage';

afterEach(() => {
  useSessionStore.getState().clearSession();
});

describe('AdminDashboardPage', () => {
  it('shows the safe empty state when the user has no administrative capabilities', () => {
    useSessionStore.getState().setSession({
      id: 'user-1',
      email: 'player@example.com',
      name: 'Player',
      roles: [],
      permissions: [],
    });

    render(
      <MemoryRouter>
        <AdminDashboardPage groups={[]} />
      </MemoryRouter>,
    );

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
});
