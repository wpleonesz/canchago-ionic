import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
	const renderDashboard = (groups: Parameters<typeof AdminDashboardPage>[0]['groups']) => {
		const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
		return render(<QueryClientProvider client={client}><MemoryRouter><AdminDashboardPage groups={groups} /></MemoryRouter></QueryClientProvider>);
	};
  it('shows the profile summary and a safe empty state when the user has no administrative capabilities', () => {
    useSessionStore.getState().setSession({
      id: 'user-1',
      email: 'player@example.com',
      name: 'Player One',
      roles: [],
      permissions: [],
    });

    renderDashboard([]);

    expect(screen.getByRole('heading', { name: 'Hola, Player' })).toBeInTheDocument();
    expect(screen.getByText('player@example.com')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('no tiene capacidades administrativas');
  });

  it('renders only the authorized modules as client-side links', () => {
    const permissions = [{ id: 'permission-1', code: 'organizaciones.manage' }];
    useSessionStore.getState().setSession({
      id: 'user-1',
      email: 'manager@example.com',
      name: 'Alex Manager',
      roles: [{ id: 'role-1', code: 'anything', name: 'Anything' }],
      permissions,
    });

    renderDashboard(filterAdminNavigation(ADMIN_NAVIGATION, permissions));

    expect(screen.getByRole('link', { name: /solicitudes de acceso/i })).toHaveAttribute(
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

    const { container } = renderDashboard([]);
    const buttons = container.querySelectorAll('ion-button');
    const button = buttons.item(buttons.length - 1);

    expect(button).not.toBeNull();
    expect(button?.disabled).toBe(true);
    expect(button).toHaveAttribute('aria-busy');
    expect(mutate).not.toHaveBeenCalled();
  });
});
