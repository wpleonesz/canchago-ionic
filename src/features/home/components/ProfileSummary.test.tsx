import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { SessionUser } from '../../../types/api/auth';
import ProfileSummary from './ProfileSummary';

const user: SessionUser = {
  id: 'user-1',
  name: 'Mateo Vera',
  email: 'mateo@canchago.local',
  roles: [{ id: 'role-1', code: 'futbolista', name: 'Futbolista' }],
  permissions: [],
};

describe('ProfileSummary', () => {
  it('shows session identity and assigned roles', () => {
    render(<ProfileSummary user={user} />);

    expect(screen.getByRole('heading', { name: 'Mateo Vera' })).toBeInTheDocument();
    expect(screen.getByText('mateo@canchago.local')).toBeInTheDocument();
    expect(screen.getByText('Futbolista')).toBeInTheDocument();
  });

  it('shows an understandable empty state without roles', () => {
    render(<ProfileSummary user={{ ...user, roles: [] }} />);

    expect(screen.getByText('Aún no tienes roles asignados.')).toBeInTheDocument();
  });
});
