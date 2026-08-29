import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { useSessionStore } from '../store/sessionStore';
import AdminRoute from './AdminRoute';

afterEach(() => {
  useSessionStore.getState().clearSession();
});

describe('AdminRoute', () => {
  it('renders the destination when the effective permission is present', () => {
    useSessionStore.getState().setSession({
      id: 'user-1',
      email: 'manager@example.com',
      name: 'Manager',
      roles: [{ id: 'role-1', code: 'custom-role', name: 'Custom role' }],
      permissions: [{ id: 'permission-1', code: 'roles.read' }],
    });

    render(
      <MemoryRouter initialEntries={['/admin/roles']}>
        <AdminRoute path="/admin/roles" requiredPermissions={['roles.read']}>
          <p>Contenido autorizado</p>
        </AdminRoute>
      </MemoryRouter>,
    );

    expect(screen.getByText('Contenido autorizado')).toBeInTheDocument();
  });

  it('renders a safe denied state for a manually entered unauthorized URL', () => {
    useSessionStore.getState().setSession({
      id: 'user-1',
      email: 'reader@example.com',
      name: 'Reader',
      roles: [],
      permissions: [{ id: 'permission-1', code: 'users.read' }],
    });

    render(
      <MemoryRouter initialEntries={['/admin/roles']}>
        <AdminRoute path="/admin/roles" requiredPermissions={['roles.read']}>
          <p>Contenido restringido</p>
        </AdminRoute>
      </MemoryRouter>,
    );

    expect(screen.queryByText('Contenido restringido')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('No tienes permiso');
  });

  it('requires every permission when requireAllPermissions is enabled', () => {
    useSessionStore.getState().setSession({
      id: 'user-1',
      email: 'admin@example.com',
      name: 'Admin',
      roles: [],
      permissions: [{ id: 'permission-1', code: 'roles.manage' }],
    });

    render(
      <MemoryRouter initialEntries={['/admin/roles/new']}>
        <AdminRoute
          path="/admin/roles/new"
          requiredPermissions={['roles.manage', 'permisos.read']}
          requireAllPermissions
        >
          <p>Formulario de roles</p>
        </AdminRoute>
      </MemoryRouter>,
    );

    expect(screen.queryByText('Formulario de roles')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('No tienes permiso');
  });
});
