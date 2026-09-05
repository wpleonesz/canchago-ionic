import { describe, expect, it } from 'vitest';
import type { PermissionDto } from '../../../types/api/roles';
import { getPermissionDiff } from './permission-selection';

const permission = (id: string, code: string): PermissionDto => ({
  id,
  code,
  module: 'roles',
  action: code.split('.')[1] ?? code,
  description: null,
  createdAt: '2026-09-04T00:00:00.000Z',
});

describe('getPermissionDiff', () => {
  it('separa permisos añadidos y retirados sin depender del orden', () => {
    const read = permission('read', 'roles.read');
    const manage = permission('manage', 'roles.manage');
    const permissions = new Map([
      [read.id, read],
      [manage.id, manage],
    ]);

    expect(getPermissionDiff(['read'], ['manage'], permissions)).toEqual({
      added: [manage],
      removed: [read],
    });
  });

  it('devuelve un diff vacío cuando no hay cambios', () => {
    const read = permission('read', 'roles.read');
    expect(getPermissionDiff(['read'], ['read'], new Map([[read.id, read]]))).toEqual({
      added: [],
      removed: [],
    });
  });
});
