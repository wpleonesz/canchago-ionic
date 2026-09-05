import type { PermissionDto } from '../../../types/api/roles';

export interface PermissionDiff {
  added: PermissionDto[];
  removed: PermissionDto[];
}

export const getPermissionDiff = (
  initialIds: string[],
  selectedIds: string[],
  permissionsById: ReadonlyMap<string, PermissionDto>,
): PermissionDiff => {
  const initial = new Set(initialIds);
  const selected = new Set(selectedIds);
  const resolve = (ids: string[]): PermissionDto[] =>
    ids.flatMap(id => {
      const permission = permissionsById.get(id);
      return permission ? [permission] : [];
    });

  return {
    added: resolve(selectedIds.filter(id => !initial.has(id))),
    removed: resolve(initialIds.filter(id => !selected.has(id))),
  };
};
