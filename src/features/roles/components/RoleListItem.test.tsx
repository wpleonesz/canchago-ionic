import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { RoleDto } from '../../../types/api/roles';
import RoleListItem from './RoleListItem';

vi.mock('../../auth/components/PermissionGuard', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

const ROLE: RoleDto = {
  id: 'role-1',
  name: 'Gestor de Canchas',
  code: 'gestor-de-canchas',
  description: 'Administra espacios deportivos.',
  isSystem: false,
  permissionsCount: 2,
  createdAt: '2026-08-29T10:00:00.000Z',
  updatedAt: '2026-08-29T10:00:00.000Z',
};

describe('RoleListItem', () => {
  it('abre la edición conservando la organización seleccionada', () => {
    render(
      <MemoryRouter initialEntries={['/admin/roles']}>
        <RoleListItem role={ROLE} organizationId="org-1" />
        <Route path="/admin/roles/:roleId/edit">
          <p>Edición administrativa</p>
        </Route>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByLabelText('Editar Gestor de Canchas'));

    expect(screen.getByText('Edición administrativa')).toBeInTheDocument();
  });

  it('no ofrece edición para roles del sistema', () => {
    render(
      <MemoryRouter>
        <RoleListItem role={{ ...ROLE, isSystem: true }} organizationId="org-1" />
      </MemoryRouter>,
    );

    expect(screen.getByText('Sistema')).toBeInTheDocument();
    expect(screen.queryByLabelText('Editar Gestor de Canchas')).not.toBeInTheDocument();
  });
});
