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
  it('shows the profile summary and a neutral (non-admin-framed) empty state for a plain user without modules', () => {
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
    // No debe mencionar "administrativo"/"capacidades administrativas": una cuenta Futbolista o
    // Gestor de Cancha recién aprobada nunca tendrá módulos y no le falta ningún permiso.
    expect(screen.queryByText(/administrativ/i)).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Todo en orden');
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

    renderDashboard(filterAdminNavigation(ADMIN_NAVIGATION, permissions));

    expect(screen.getByRole('link', { name: /organizaciones/i })).toHaveAttribute('href', '/admin/organizations');
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
