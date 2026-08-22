import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { SessionUser } from '../../../types/api/auth';
import type { OwnUserProfileDto } from '../../../types/api/users';
import { OWN_PROFILE_QUERY_KEY } from '../../users/hooks/useOwnProfile';
import ProfileSummary from './ProfileSummary';

const user: SessionUser = {
  id: 'user-1',
  name: 'Mateo Vera',
  email: 'mateo@canchago.local',
  roles: [{ id: 'role-1', code: 'futbolista', name: 'Futbolista' }],
  permissions: [],
};

describe('ProfileSummary', () => {
  const renderSummary = (sessionUser: SessionUser, profile?: OwnUserProfileDto): void => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    if (profile) client.setQueryData(OWN_PROFILE_QUERY_KEY, profile);
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <ProfileSummary user={sessionUser} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };
  it('shows session identity and assigned roles', () => {
    renderSummary(user);

    expect(screen.getByRole('heading', { name: 'Mateo Vera' })).toBeInTheDocument();
    expect(screen.getByText('mateo@canchago.local')).toBeInTheDocument();
    expect(screen.getByText('Futbolista')).toBeInTheDocument();
  });

  it('shows an understandable empty state without roles', () => {
    renderSummary({ ...user, roles: [] });

    expect(screen.getByText('Aún no tienes roles asignados.')).toBeInTheDocument();
  });

  it('muestra celular e iconos sociales únicamente cuando tienen valor', () => {
    renderSummary(user, {
      phone: '+593999999999',
      facebookUrl: 'https://facebook.com/mateo',
      instagramUrl: null,
      linkedinUrl: null,
      xUrl: null,
      githubUrl: 'https://github.com/mateo',
      tiktokUrl: null,
      websiteUrl: null,
      hasAvatar: false,
      avatarUpdatedAt: null,
      profileUpdatedAt: '2026-08-21T12:00:00.000Z',
    });

    expect(screen.getByRole('link', { name: '+593999999999' })).toHaveAttribute('href', 'tel:+593999999999');
    expect(screen.getByRole('link', { name: 'Abrir Facebook' })).toHaveAttribute('href', 'https://facebook.com/mateo');
    expect(screen.getByRole('link', { name: 'Abrir GitHub' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Abrir Instagram' })).not.toBeInTheDocument();
  });
});
