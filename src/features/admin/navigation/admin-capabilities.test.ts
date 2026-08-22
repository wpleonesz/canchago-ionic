import { describe, expect, it } from 'vitest';
import type { PermissionSummary } from '../../../types/api/auth';
import {
  filterAdminNavigation,
  findActiveAdminItem,
  getFirstAdminPath,
  hasAnyPermission,
  isAdminPathActive,
} from './admin-capabilities';
import { ADMIN_NAVIGATION } from './admin-navigation';

const permissions = (...codes: string[]): PermissionSummary[] =>
  codes.map((code, index) => ({ id: `permission-${index}`, code }));

describe('admin capabilities', () => {
  it('denies access while permissions are absent or empty', () => {
    expect(hasAnyPermission(undefined, ['users.read'])).toBe(false);
    expect(filterAdminNavigation(ADMIN_NAVIGATION, [])).toEqual([]);
    expect(getFirstAdminPath(ADMIN_NAVIGATION, null)).toBeNull();
  });

  it('shows only the modules allowed to a partial administrator', () => {
    const filtered = filterAdminNavigation(ADMIN_NAVIGATION, permissions('roles.read'));

    expect(filtered).toHaveLength(1);
    expect(filtered[0].items.map(item => item.id)).toEqual(['roles']);
    expect(getFirstAdminPath(ADMIN_NAVIGATION, permissions('roles.read'))).toBe('/admin/roles');
  });

  it('shows every real module from effective permissions without checking role names', () => {
    const filtered = filterAdminNavigation(
      ADMIN_NAVIGATION,
      permissions('users.read', 'roles.read', 'permisos.read', 'organizaciones.manage'),
    );

    expect(filtered.flatMap(group => group.items)).toHaveLength(4);
  });

  it('matches deep links by complete route segments', () => {
    expect(isAdminPathActive('/admin/users/user-1/edit', '/admin/users')).toBe(true);
    expect(isAdminPathActive('/admin/users-archive', '/admin/users')).toBe(false);
    expect(findActiveAdminItem(ADMIN_NAVIGATION, '/admin/roles/role-1')?.id).toBe('roles');
  });

  it('does not contain duplicate ids or paths', () => {
    const items = ADMIN_NAVIGATION.flatMap(group => group.items);

    expect(new Set(items.map(item => item.id)).size).toBe(items.length);
    expect(new Set(items.map(item => item.path)).size).toBe(items.length);
  });
});
