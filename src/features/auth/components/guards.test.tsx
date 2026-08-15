import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useSessionStore } from '../../../store/sessionStore';
import PermissionGuard from './PermissionGuard';
import RoleGuard from './RoleGuard';

const userWithRoleOnly = {
  id: 'user-1',
  email: 'futbolista@canchago.local',
  name: 'Mateo Vera',
  roles: [{ id: 'role-1', code: 'futbolista', name: 'Futbolista' }],
  permissions: [],
};

afterEach(() => {
  useSessionStore.getState().clearSession();
});

describe('RoleGuard', () => {
  it('renders children when the user has the required role', () => {
    useSessionStore.getState().setSession(userWithRoleOnly);

    render(
      <RoleGuard role="futbolista">
        <p>contenido de futbolista</p>
      </RoleGuard>,
    );

    expect(screen.getByText('contenido de futbolista')).toBeInTheDocument();
  });

  it('renders nothing when the user lacks the required role', () => {
    useSessionStore.getState().setSession(userWithRoleOnly);

    render(
      <RoleGuard role="administrador">
        <p>contenido de administrador</p>
      </RoleGuard>,
    );

    expect(screen.queryByText('contenido de administrador')).not.toBeInTheDocument();
  });
});

describe('PermissionGuard', () => {
  it('renders nothing for a user with a role but no permissions (caso real: futbolista)', () => {
    useSessionStore.getState().setSession(userWithRoleOnly);

    render(
      <PermissionGuard permission="users.read">
        <p>contenido con permiso</p>
      </PermissionGuard>,
    );

    expect(screen.queryByText('contenido con permiso')).not.toBeInTheDocument();
  });
});
