import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { describe, expect, it, vi } from 'vitest';
import UserRolesEditor from './UserRolesEditor';

vi.mock('../../../services/api/endpoints/roles', () => ({
  getRoles: vi.fn().mockResolvedValue({
    data: [
      { id: 'role-1', name: 'Gestor de Cancha', code: 'gestor-de-cancha', description: null, isSystem: false, createdAt: '', updatedAt: '', permissionsCount: 2 },
      { id: 'role-2', name: 'Recepción', code: 'recepcion', description: null, isSystem: false, createdAt: '', updatedAt: '', permissionsCount: 1 },
    ],
    meta: { page: 1, pageSize: 50, total: 2, totalPages: 1 },
  }),
}));

const wrapper = ({ children }: PropsWithChildren): React.ReactElement => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('UserRolesEditor', () => {
  it('never offers a role the user already has assigned', async () => {
    const { container } = render(
      <UserRolesEditor
        organizationId="org-1"
        value={[]}
        onChange={() => {}}
        excludeRoleIds={['role-1']}
      />,
      { wrapper },
    );

    await waitFor(() => {
      expect(container.querySelectorAll('ion-select-option')).toHaveLength(1);
    });

    const remaining = container.querySelector('ion-select-option');
    expect(remaining).toHaveTextContent('Recepción');
    expect(container.querySelector('ion-select-option[value="role-1"]')).not.toBeInTheDocument();
  });

  it('is disabled until an organization is selected', () => {
    const { container } = render(
      <UserRolesEditor organizationId={undefined} value={[]} onChange={() => {}} />,
      { wrapper },
    );

    expect(container.querySelector('ion-select')).toHaveProperty('disabled', true);
  });
});
