import { IonBadge } from '@ionic/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Prompt, useHistory, useLocation, useParams } from 'react-router-dom';
import AppButton from '../../../components/common/AppButton';
import AppConfirmDialog from '../../../components/feedback/AppConfirmDialog';
import AppErrorState from '../../../components/feedback/AppErrorState';
import AppInteractionAlert from '../../../components/feedback/AppInteractionAlert';
import AppSkeleton from '../../../components/feedback/AppSkeleton';
import AppSearchInput from '../../../components/forms/AppSearchInput';
import AppDetailActions from '../../../components/layout/AppDetailActions';
import { AppClientError, BusinessRuleError, NotFoundError } from '../../../services/api/errorMapper';
import type { PermissionDto } from '../../../types/api/roles';
import { rolePermissionSelectionSchema } from '../../../validation/roles';
import RolePermissionSelector from '../components/RolePermissionSelector';
import { usePermissions, useRole, useUpdateRolePermissions } from '../hooks/useRoles';
import { getPermissionDiff } from '../utils/permission-selection';
import '../roles.css';

const sameIds = (left: string[], right: string[]): boolean => {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every(id => rightSet.has(id));
};

const PermissionManagementPage: React.FC = () => {
  const { roleId } = useParams<{ roleId: string }>();
  const location = useLocation();
  const history = useHistory();
  const organizationId = new URLSearchParams(location.search).get('organizationId') ?? '';
  const [search, setSearch] = useState('');
  const roleQuery = useRole(roleId, organizationId);
  const permissionsQuery = usePermissions({ search: search || undefined });
  const updateMutation = useUpdateRolePermissions(roleId, organizationId);
  const [initialIds, setInitialIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [knownPermissions, setKnownPermissions] = useState<Map<string, PermissionDto>>(new Map());
  const [initializedAt, setInitializedAt] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const allowNavigationRef = useRef(false);

  const catalogPermissions = useMemo(
    () => permissionsQuery.data?.pages.flatMap(page => page.data) ?? [],
    [permissionsQuery.data],
  );

  useEffect(() => {
    if (!roleQuery.data || initializedAt !== null) return;
    const ids = roleQuery.data.permissions.map(permission => permission.id);
    setInitialIds(ids);
    setSelectedIds(ids);
    setKnownPermissions(new Map(roleQuery.data.permissions.map(permission => [permission.id, permission])));
    setInitializedAt(roleQuery.data.updatedAt);
  }, [initializedAt, roleQuery.data]);

  useEffect(() => {
    if (catalogPermissions.length === 0) return;
    setKnownPermissions(current => {
      const hasChanges = catalogPermissions.some(permission => current.get(permission.id) !== permission);
      if (!hasChanges) return current;
      const next = new Map(current);
      catalogPermissions.forEach(permission => next.set(permission.id, permission));
      return next;
    });
  }, [catalogPermissions]);

  const isDirty = !sameIds(initialIds, selectedIds);
  const diff = useMemo(
    () => getPermissionDiff(initialIds, selectedIds, knownPermissions),
    [initialIds, knownPermissions, selectedIds],
  );

  const togglePermission = (permissionId: string, checked: boolean): void => {
    setSuccessMessage(null);
    setSelectedIds(current =>
      checked ? [...new Set([...current, permissionId])] : current.filter(id => id !== permissionId),
    );
  };

  const goBack = (): void => {
    allowNavigationRef.current = true;
    history.push(`/admin/roles/${roleId}?organizationId=${encodeURIComponent(organizationId)}`);
  };

  const cancel = (): void => {
    if (isDirty) setShowCancelConfirmation(true);
    else goBack();
  };

  const reloadSnapshot = async (): Promise<void> => {
    const result = await roleQuery.refetch();
    if (!result.data) return;
    const ids = result.data.permissions.map(permission => permission.id);
    setInitialIds(ids);
    setSelectedIds(ids);
    setKnownPermissions(current => {
      const next = new Map(current);
      result.data?.permissions.forEach(permission => next.set(permission.id, permission));
      return next;
    });
    setInitializedAt(result.data.updatedAt);
    setSubmitError(null);
  };

  const save = async (): Promise<void> => {
    if (!isDirty || updateMutation.isPending || !initializedAt) return;
    setSubmitError(null);
    setSuccessMessage(null);
    const permissionIds = rolePermissionSelectionSchema.safeParse(selectedIds);
    if (!permissionIds.success) {
      setSubmitError(permissionIds.error.issues[0]?.message ?? 'Revisa los permisos seleccionados.');
      return;
    }
    try {
      const updated = await updateMutation.mutateAsync({
        permissionIds: permissionIds.data,
        expectedUpdatedAt: initializedAt,
      });
      const ids = updated.permissions.map(permission => permission.id);
      setInitialIds(ids);
      setSelectedIds(ids);
      setKnownPermissions(current => {
        const next = new Map(current);
        updated.permissions.forEach(permission => next.set(permission.id, permission));
        return next;
      });
      setInitializedAt(updated.updatedAt);
      setSuccessMessage('Los permisos del rol se actualizaron correctamente.');
    } catch (error) {
      if (error instanceof BusinessRuleError) {
        setSubmitError('El rol cambió mientras lo editabas. Recarga los permisos actuales antes de guardar.');
        return;
      }
      setSubmitError(error instanceof AppClientError ? error.message : 'No se pudieron actualizar los permisos.');
    }
  };

  if (!organizationId) return <AppErrorState message="Selecciona una organización para gestionar permisos." />;
  if (roleQuery.isLoading) return <AppSkeleton rows={6} />;
  if (roleQuery.isError || !roleQuery.data) {
    return (
      <AppErrorState
        message={
          roleQuery.error instanceof NotFoundError ? 'El rol solicitado no existe.' : 'No se pudo cargar el rol.'
        }
        onRetry={() => void roleQuery.refetch()}
      />
    );
  }

  const role = roleQuery.data;
  if (role.isSystem) return <AppErrorState message="Los permisos de los roles de sistema son de solo lectura." />;

  return (
    <section className="role-permission-page" aria-labelledby="role-permission-title">
      <header className="roles-page-header">
        <div>
          <p className="roles-page-header__eyebrow">Gestionar permisos</p>
          <h1 id="role-permission-title">{role.name}</h1>
          <p>{role.description ?? 'Sin descripción'}</p>
          <IonBadge color="primary">Personalizado</IonBadge>
        </div>
        <AppDetailActions className="roles-page-header__actions">
          <AppButton fill="outline" disabled={updateMutation.isPending} onClick={cancel}>
            Volver
          </AppButton>
          <AppButton
            disabled={!isDirty || updateMutation.isPending}
            isLoading={updateMutation.isPending}
            onClick={() => void save()}
          >
            Guardar cambios
          </AppButton>
        </AppDetailActions>
      </header>

      <div className="role-permission-page__search">
        <AppSearchInput placeholder="Buscar por código o descripción" onSearch={setSearch} />
      </div>

      <RolePermissionSelector
        permissions={catalogPermissions}
        selectedIds={selectedIds}
        disabled={updateMutation.isPending}
        isLoading={permissionsQuery.isLoading}
        isError={permissionsQuery.isError}
        hasNextPage={permissionsQuery.hasNextPage}
        isFetchingNextPage={permissionsQuery.isFetchingNextPage}
        onToggle={togglePermission}
        onRetry={() => void permissionsQuery.refetch()}
        onLoadMore={() => void permissionsQuery.fetchNextPage()}
      />

      <section className="role-permission-diff" aria-labelledby="permission-diff-title">
        <h2 id="permission-diff-title">Cambios pendientes</h2>
        {!isDirty && <p>No hay cambios pendientes.</p>}
        {diff.added.length > 0 && (
          <div>
            <h3>Se añadirán</h3>
            <ul>
              {diff.added.map(permission => (
                <li key={permission.id}>{permission.description ?? permission.code}</li>
              ))}
            </ul>
          </div>
        )}
        {diff.removed.length > 0 && (
          <div>
            <h3>Se retirarán</h3>
            <ul>
              {diff.removed.map(permission => (
                <li key={permission.id}>{permission.description ?? permission.code}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <AppInteractionAlert
        isOpen={Boolean(successMessage)}
        kind="success"
        header="Permisos actualizados"
        message={successMessage ?? ''}
        onDismiss={() => setSuccessMessage(null)}
      />
      <AppInteractionAlert
        isOpen={Boolean(submitError)}
        kind="error"
        header="No se pudieron actualizar los permisos"
        message={submitError ?? ''}
        onDismiss={() => setSubmitError(null)}
      />
      {submitError && updateMutation.error instanceof BusinessRuleError && (
        <AppButton fill="outline" onClick={() => void reloadSnapshot()}>
          Recargar permisos actuales
        </AppButton>
      )}

      <Prompt
        when={isDirty}
        message={() => allowNavigationRef.current || 'Tienes cambios sin guardar. Si sales, se perderán.'}
      />
      <AppConfirmDialog
        isOpen={showCancelConfirmation}
        header="Descartar cambios"
        message="Tienes cambios de permisos sin guardar. ¿Quieres salir y descartarlos?"
        confirmText="Descartar"
        isDestructive
        onConfirm={() => {
          setShowCancelConfirmation(false);
          goBack();
        }}
        onCancel={() => setShowCancelConfirmation(false)}
      />
    </section>
  );
};

export default PermissionManagementPage;
