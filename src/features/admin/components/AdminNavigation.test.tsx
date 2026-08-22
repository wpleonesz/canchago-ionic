import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { filterAdminNavigation } from '../navigation/admin-capabilities';
import { ADMIN_NAVIGATION } from '../navigation/admin-navigation';
import AdminNavigation from './AdminNavigation';

describe('AdminNavigation', () => {
  it('renders only allowed options and marks a deep route as active', () => {
    const groups = filterAdminNavigation(ADMIN_NAVIGATION, [
      { id: 'permission-1', code: 'users.read' },
      { id: 'permission-2', code: 'roles.read' },
    ]);

    const { container } = render(
      <MemoryRouter initialEntries={['/admin/users/user-1/edit']}>
        <AdminNavigation groups={groups} />
        <div id="admin-content" />
      </MemoryRouter>,
    );

    expect(container.querySelector('ion-item[aria-label="Usuarios"]')).toBeInTheDocument();
    expect(container.querySelector('ion-item[aria-label="Roles"]')).toBeInTheDocument();
    expect(container.querySelector('ion-item[aria-label="Permisos"]')).not.toBeInTheDocument();
    expect(container.querySelector('ion-item[aria-current="page"]')).toHaveAttribute('aria-label', 'Usuarios');
  });

  it('expands and collapses groups with an accessible control', () => {
    const groups = filterAdminNavigation(ADMIN_NAVIGATION, [{ id: 'permission-1', code: 'users.read' }]);

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminNavigation groups={groups} />
        <div id="admin-content" />
      </MemoryRouter>,
    );

    const groupButton = screen.getByRole('button', { name: /usuarios y acceso/i });
    expect(groupButton).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(groupButton);
    expect(groupButton).toHaveAttribute('aria-expanded', 'false');
    expect(document.querySelector('ion-item[aria-label="Usuarios"]')).not.toBeInTheDocument();
  });
});
