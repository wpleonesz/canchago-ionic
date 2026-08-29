import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { OrganizationDto } from '../../../types/api/organizaciones';
import OrganizationListItem from './OrganizationListItem';

vi.mock('../../auth/components/PermissionGuard', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

const ORGANIZATION: OrganizationDto = {
  id: 'org-1',
  name: 'Cancha Central',
  legalName: null,
  taxIdentification: '1234567890',
  email: 'contacto@cancha.com',
  phone: '+593999999999',
  domain: null,
  status: 'ACTIVE',
  createdAt: '2026-08-29T10:00:00.000Z',
  updatedAt: '2026-08-29T10:00:00.000Z',
  venuesCount: 3,
};

describe('OrganizationListItem', () => {
  it('muestra el número de sedes ya resuelto por el backend', () => {
    render(
      <MemoryRouter>
        <OrganizationListItem organization={ORGANIZATION} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/3 sedes/)).toBeInTheDocument();
  });

  it('navega al detalle al consultar', () => {
    render(
      <MemoryRouter initialEntries={['/admin/organizations']}>
        <OrganizationListItem organization={ORGANIZATION} />
        <Route path="/admin/organizations/:organizationId">
          <p>Detalle de organización</p>
        </Route>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByLabelText('Consultar Cancha Central'));

    expect(screen.getByText('Detalle de organización')).toBeInTheDocument();
  });

  it('navega al formulario de edición', () => {
    render(
      <MemoryRouter initialEntries={['/admin/organizations']}>
        <OrganizationListItem organization={ORGANIZATION} />
        <Route path="/admin/organizations/:organizationId/edit">
          <p>Edición de organización</p>
        </Route>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByLabelText('Editar Cancha Central'));

    expect(screen.getByText('Edición de organización')).toBeInTheDocument();
  });
});
