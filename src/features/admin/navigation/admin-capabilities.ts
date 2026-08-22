import type { PermissionSummary } from '../../../types/api/auth';
import type { AdminNavigationGroup, AdminNavigationItem } from './admin-navigation';

export const hasAnyPermission = (
  permissions: PermissionSummary[] | null | undefined,
  requiredPermissions: string[],
): boolean => {
  if (!permissions || requiredPermissions.length === 0) return false;

  const permissionCodes = new Set(permissions.map(permission => permission.code));
  return requiredPermissions.some(required => permissionCodes.has(required));
};

export const filterAdminNavigation = (
  groups: AdminNavigationGroup[],
  permissions: PermissionSummary[] | null | undefined,
): AdminNavigationGroup[] =>
  groups
    .map(group => ({
      ...group,
      items: group.items.filter(item => hasAnyPermission(permissions, item.requiredPermissions)),
    }))
    .filter(group => group.items.length > 0);

export const isAdminPathActive = (currentPath: string, itemPath: string): boolean =>
  currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);

export const findActiveAdminItem = (
  groups: AdminNavigationGroup[],
  currentPath: string,
): AdminNavigationItem | undefined =>
  groups.flatMap(group => group.items).find(item => isAdminPathActive(currentPath, item.path));

export const getFirstAdminPath = (
  groups: AdminNavigationGroup[],
  permissions: PermissionSummary[] | null | undefined,
): string | null => filterAdminNavigation(groups, permissions)[0]?.items[0]?.path ?? null;
