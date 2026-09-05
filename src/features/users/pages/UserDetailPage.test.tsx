import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { MemoryRouter, Route } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserDto } from '../../../types/api/users';

vi.mock('../../auth/components/PermissionGuard', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

// Catálogos reales que consumen OrganizationPicker (useOrganizations) y UserRolesEditor
// (useRoles) — mismo estilo de mock que UserRolesEditor.test.tsx: se mockea el endpoint, no
// el hook, para probar los componentes reales con un QueryClientProvider real.
vi.mock('../../../services/api/endpoints/organizaciones', () => ({
  getOrganizations: vi.fn().mockResolvedValue({
    data: [{ id: 'org-1', name: 'Cancha Central' }],
    meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
  }),
}));

vi.mock('../../../services/api/endpoints/roles', () => ({
  getRoles: vi.fn().mockResolvedValue({
    data: [
      {
        id: 'role-1',
        name: 'Gestor de Cancha',
        code: 'gestor-de-cancha',
        description: null,
        isSystem: false,
        createdAt: '',
        updatedAt: '',
        permissionsCount: 1,
      },
    ],
    meta: { page: 1, pageSize: 50, total: 1, totalPages: 1 },
  }),
}));

const mocks = vi.hoisted(() => ({
  user: undefined as UserDto | undefined,
  assignMutate: vi.fn(),
  removeMutate: vi.fn(),
  deactivateMutate: vi.fn(),
}));

vi.mock('../hooks/useUsers', () => ({
  useUser: () => ({ data: mocks.user, isLoading: false, isError: false, refetch: vi.fn() }),
}));

vi.mock('../hooks/useUserRoles', () => ({
  useAssignUserRoles: () => ({ mutate: mocks.assignMutate, isPending: false }),
  useRemoveUserRole: () => ({ mutate: mocks.removeMutate, isPending: false }),
}));

vi.mock('../hooks/useUserMutations', () => ({
  useDeactivateUser: () => ({ mutate: mocks.deactivateMutate, isPending: false }),
}));

import UserDetailPage from './UserDetailPage';

const USER_WITHOUT_ROLES: UserDto = {
  id: 'user-1',
  email: 'sin-rol@example.com',
  firstName: 'Sin',
  lastName: 'Rol',
  active: true,
  roles: [],
  createdAt: '2026-09-04T10:00:00.000Z',
};

const USER_WITH_ROLE: UserDto = {
  ...USER_WITHOUT_ROLES,
  roles: [
    {
      id: 'role-1',
      organizationId: 'org-1',
      code: 'gestor-de-cancha',
      name: 'Gestor de Cancha',
      description: null,
      isSystem: false,
      createdAt: '2026-09-04T10:00:00.000Z',
      updatedAt: '2026-09-04T10:00:00.000Z',
      deletedAt: null,
    },
  ],
};

const renderPage = (): ReturnType<typeof render> => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: PropsWithChildren): React.ReactElement => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/admin/users/user-1']}>
        <Route path="/admin/users/:userId">{children}</Route>
      </MemoryRouter>
    </QueryClientProvider>
  );
  return render(<UserDetailPage />, { wrapper: Wrapper });
};

describe('UserDetailPage — asignación de roles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('usuario sin roles: ofrece elegir la organización porque no hay ninguna que inferir (root cause corregido)', async () => {
    mocks.user = USER_WITHOUT_ROLES;
    const { container } = renderPage();

    expect(screen.getByText('Este usuario no tiene roles de organización asignados.')).toBeInTheDocument();

    // Dos <ion-select>: el de Organización (nuevo) y el de Roles — antes del fix solo existía
    // el segundo, deshabilitado sin ninguna forma de habilitarlo.
    await waitFor(() => {
      expect(container.querySelectorAll('ion-select')).toHaveLength(2);
    });

    const roleSelect = container.querySelectorAll('ion-select')[1];
    expect(roleSelect).toHaveProperty('disabled', true);
  });

  it('usuario con un rol existente: no pide organización (ya se infiere) y el selector de roles queda habilitado', async () => {
    mocks.user = USER_WITH_ROLE;
    const { container } = renderPage();

    // El nombre del rol vive dentro de <IonLabel>, cuyo contenido no se serializa como texto
    // plano bajo el runtime de pruebas de Ionic — se verifica en su lugar por el aria-label
    // real del botón de remover, que sí es una cadena simple.
    expect(screen.getByLabelText('Remover rol Gestor de Cancha')).toBeInTheDocument();
    expect(container.querySelector('ion-chip')).toBeInTheDocument();

    // Un único <ion-select>: solo el de Roles, ya habilitado con la organización inferida.
    await waitFor(() => {
      const selects = container.querySelectorAll('ion-select');
      expect(selects).toHaveLength(1);
      expect(selects[0]).toHaveProperty('disabled', false);
    });
  });
});
