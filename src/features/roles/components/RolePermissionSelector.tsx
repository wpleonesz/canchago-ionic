import { IonCheckbox } from '@ionic/react';
import { useMemo } from 'react';
import AppButton from '../../../components/common/AppButton';
import AppEmptyState from '../../../components/feedback/AppEmptyState';
import AppErrorState from '../../../components/feedback/AppErrorState';
import AppSkeleton from '../../../components/feedback/AppSkeleton';
import type { PermissionDto } from '../../../types/api/roles';

interface RolePermissionSelectorProps {
  permissions: PermissionDto[];
  selectedIds: string[];
  disabled?: boolean;
  isLoading: boolean;
  isError: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onToggle: (permissionId: string, checked: boolean) => void;
  onRetry: () => void;
  onLoadMore: () => void;
}

const RolePermissionSelector: React.FC<RolePermissionSelectorProps> = ({
  permissions,
  selectedIds,
  disabled = false,
  isLoading,
  isError,
  hasNextPage = false,
  isFetchingNextPage = false,
  onToggle,
  onRetry,
  onLoadMore,
}) => {
  const groups = useMemo(
    () =>
      Object.entries(
        permissions.reduce<Record<string, PermissionDto[]>>((result, permission) => {
          (result[permission.module] ??= []).push(permission);
          return result;
        }, {}),
      ),
    [permissions],
  );

  if (isLoading) return <AppSkeleton rows={3} />;
  if (isError) return <AppErrorState message="No se pudo cargar el catálogo de permisos." onRetry={onRetry} />;

  return (
    <div className="role-permission-selector">
      {groups.length === 0 && (
        <AppEmptyState title="No hay permisos disponibles" description="Prueba con otro término de búsqueda." />
      )}
      {groups.map(([moduleName, modulePermissions]) => (
        <fieldset key={moduleName} className="role-form__permission-group" disabled={disabled}>
          <legend>{moduleName}</legend>
          {modulePermissions.map(permission => (
            <IonCheckbox
              key={permission.id}
              checked={selectedIds.includes(permission.id)}
              disabled={disabled}
              onIonChange={event => onToggle(permission.id, event.detail.checked)}
            >
              <strong>{permission.description ?? permission.action}</strong>
              <small>
                {permission.action} · <code>{permission.code}</code>
              </small>
            </IonCheckbox>
          ))}
        </fieldset>
      ))}
      {hasNextPage && (
        <AppButton type="button" fill="outline" isLoading={isFetchingNextPage} disabled={disabled} onClick={onLoadMore}>
          Cargar más permisos
        </AppButton>
      )}
    </div>
  );
};

export default RolePermissionSelector;
