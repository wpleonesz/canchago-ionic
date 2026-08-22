import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import UserListItem from './UserListItem';

vi.mock('../../auth/components/PermissionGuard', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

const USER = {
  id: 'user-1',
  email: 'ada@example.com',
  firstName: 'Ada',
  lastName: 'Lovelace',
  active: true,
  roles: [],
  createdAt: '2026-08-21T12:00:00.000Z',
};

describe('UserListItem', () => {
  it('abre el detalle dentro del módulo administrativo', () => {
    render(
      <MemoryRouter initialEntries={['/admin/users']}>
        <UserListItem user={USER} onDeactivate={vi.fn()} />
        <Route path="/admin/users/:userId">
          <p>Detalle administrativo</p>
        </Route>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText('Ada Lovelace'));

    expect(screen.getByText('Detalle administrativo')).toBeInTheDocument();
  });
});
