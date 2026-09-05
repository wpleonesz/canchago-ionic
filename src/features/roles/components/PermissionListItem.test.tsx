import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { PermissionDto } from '../../../types/api/roles';
import PermissionListItem from './PermissionListItem';

const PERMISSION: PermissionDto = {
  id: 'permission-1',
  module: 'roles',
  action: 'read',
  code: 'roles.read',
  description: 'Leer roles',
  createdAt: '2026-06-23T00:00:00.000Z',
};

describe('PermissionListItem', () => {
  it('muestra la descripción, el módulo y el código real', () => {
    render(<PermissionListItem permission={PERMISSION} />);

    expect(screen.getByText('Leer roles')).toBeInTheDocument();
    expect(screen.getByText('roles')).toBeInTheDocument();
    expect(screen.getByText('roles.read')).toBeInTheDocument();
  });

  it('usa la acción como título cuando no hay descripción', () => {
    render(<PermissionListItem permission={{ ...PERMISSION, description: null }} />);

    expect(screen.getByText('read')).toBeInTheDocument();
  });
});
