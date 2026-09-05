import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  role: {
    id: 'role-1',
    organizationId: '123e4567-e89b-42d3-a456-426614174001',
    name: 'Operaciones',
    description: 'Gestiona la operación diaria.',
    code: 'operaciones',
    isSystem: false,
    createdAt: '2026-09-04T10:00:00.000Z',
    updatedAt: '2026-09-04T10:00:00.000Z',
    permissions: [
      {
        id: '123e4567-e89b-42d3-a456-426614174002',
        module: 'roles',
        action: 'read',
        code: 'roles.read',
        description: 'Consultar roles',
        createdAt: '2026-09-04T10:00:00.000Z',
      },
    ],
  },
  mutateAsync: vi.fn(),
  refetchRole: vi.fn(),
  refetchPermissions: vi.fn(),
}));

vi.mock('../hooks/useRoles', () => ({
  useRole: () => ({
    data: mocks.role,
    isLoading: false,
    isError: false,
    refetch: mocks.refetchRole,
  }),
  usePermissions: () => ({
    data: { pages: [{ data: mocks.role.permissions, meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 } }] },
    isLoading: false,
    isError: false,
    hasNextPage: false,
    isFetchingNextPage: false,
    refetch: mocks.refetchPermissions,
    fetchNextPage: vi.fn(),
  }),
  useUpdateRolePermissions: () => ({
    mutateAsync: mocks.mutateAsync,
    isPending: false,
    error: null,
  }),
}));

import PermissionManagementPage from './PermissionManagementPage';

describe('PermissionManagementPage', () => {
  beforeEach(() => {
    mocks.role.isSystem = false;
    vi.clearAllMocks();
  });

  it('muestra el rol, el catálogo real y el resumen de cambios', async () => {
    render(
      <MemoryRouter
        initialEntries={['/admin/roles/role-1/permissions?organizationId=123e4567-e89b-42d3-a456-426614174001']}
      >
        <Route path="/admin/roles/:roleId/permissions">
          <PermissionManagementPage />
        </Route>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Operaciones' })).toBeInTheDocument();
    expect(screen.getByText('Consultar roles')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Cambios pendientes' })).toBeInTheDocument();
    expect(screen.getByText('No hay cambios pendientes.')).toBeInTheDocument();
  });

  it('bloquea la gestión de un rol de sistema', () => {
    mocks.role.isSystem = true;
    render(
      <MemoryRouter
        initialEntries={['/admin/roles/role-1/permissions?organizationId=123e4567-e89b-42d3-a456-426614174001']}
      >
        <Route path="/admin/roles/:roleId/permissions">
          <PermissionManagementPage />
        </Route>
      </MemoryRouter>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('solo lectura');
  });
});
