import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../hooks/useUserProfile', () => ({
  useUserProfile: () => ({
    data: {
      id: 'user-1',
      email: 'ada@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      active: true,
      profileUpdatedAt: '2026-08-21T12:00:00.000Z',
    },
    isLoading: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
  }),
  useUpdateUserProfile: () => ({ mutateAsync: vi.fn(), error: null }),
}));

import UserProfileEditPage from './UserProfileEditPage';

describe('UserProfileEditPage', () => {
  it('renderiza el formulario dentro de la ruta administrativa', () => {
    render(
      <MemoryRouter initialEntries={['/admin/users/user-1/edit']}>
        <Route path="/admin/users/:userId/edit">
          <UserProfileEditPage />
        </Route>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Editar perfil' })).toBeInTheDocument();
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
  });
});
