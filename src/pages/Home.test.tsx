import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SessionUser } from '../types/api/auth';
import { useSessionStore } from '../store/sessionStore';
import Home from './Home';

const mutate = vi.fn();
let isPending = false;

vi.mock('../features/auth/hooks/useSession', () => ({
  useLogoutMutation: () => ({ mutate, isPending }),
}));

const baseUser: SessionUser = {
  id: 'user-1',
  name: 'Mateo Vera',
  email: 'mateo@canchago.local',
  roles: [{ id: 'role-1', code: 'futbolista', name: 'Futbolista' }],
  permissions: [],
};

afterEach(() => {
  useSessionStore.getState().clearSession();
  mutate.mockClear();
  isPending = false;
});

describe('Home', () => {
  it('shows real session data and hides unauthorized summaries', () => {
    useSessionStore.getState().setSession(baseUser);

    render(<Home />);

    expect(screen.getByRole('heading', { name: 'Hola, Mateo' })).toBeInTheDocument();
    expect(screen.getByText('mateo@canchago.local')).toBeInTheDocument();
    expect(screen.queryByText('Acceso administrativo')).not.toBeInTheDocument();
    expect(screen.queryByText('Consulta de usuarios')).not.toBeInTheDocument();
  });

  it('shows summaries allowed by the current role and permission', () => {
    useSessionStore.getState().setSession({
      ...baseUser,
      roles: [{ id: 'role-2', code: 'administrador', name: 'Administrador' }],
      permissions: [{ id: 'permission-1', code: 'users.read' }],
    });

    render(<Home />);

    expect(screen.getByText('Acceso administrativo')).toBeInTheDocument();
    expect(screen.getByText('Consulta de usuarios')).toBeInTheDocument();
  });

  it('triggers logout and exposes its pending state', () => {
    useSessionStore.getState().setSession(baseUser);
    isPending = true;

    const { container } = render(<Home />);
    const button = container.querySelector('ion-button');

    expect(button).not.toBeNull();
    expect(button?.disabled).toBe(true);
    expect(button).toHaveAttribute('aria-busy');
    expect(button?.querySelector('ion-spinner')).toHaveAttribute('aria-label', 'Procesando');
    expect(mutate).not.toHaveBeenCalled();
  });
});
