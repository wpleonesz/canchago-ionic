import { useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { IonBadge, IonChip, IonIcon, IonLabel } from '@ionic/react';
import { closeCircleOutline } from 'ionicons/icons';
import AppButton from '../../../components/common/AppButton';
import AppConfirmDialog from '../../../components/feedback/AppConfirmDialog';
import AppInteractionAlert, { type AppInteractionAlertKind } from '../../../components/feedback/AppInteractionAlert';
import AppErrorState from '../../../components/feedback/AppErrorState';
import AppSkeleton from '../../../components/feedback/AppSkeleton';
import AppDetailActions from '../../../components/layout/AppDetailActions';
import PermissionGuard from '../../auth/components/PermissionGuard';
import { useDeactivateUser } from '../hooks/useUserMutations';
import { useAssignUserRoles, useRemoveUserRole } from '../hooks/useUserRoles';
import { useUser } from '../hooks/useUsers';
import UserRolesEditor from '../components/UserRolesEditor';
import type { UserRoleDto } from '../../../types/api/users';
import { AppClientError } from '../../../services/api/errorMapper';
import '../users.css';

const UserDetailPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const history = useHistory();
  const { data: user, isLoading, isError, refetch } = useUser(userId);
  const [roleToRemove, setRoleToRemove] = useState<UserRoleDto | null>(null);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [rolesToAdd, setRolesToAdd] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ kind: AppInteractionAlertKind; header: string; message: string } | null>(
    null,
  );

  const assignRolesMutation = useAssignUserRoles(userId);
  const removeRoleMutation = useRemoveUserRole(userId);
  const deactivateMutation = useDeactivateUser();

  if (isLoading) {
    return <AppSkeleton rows={4} />;
  }

  if (isError || !user) {
    return <AppErrorState message="No se pudo cargar este usuario." onRetry={() => void refetch()} />;
  }

  const handleAddRoles = (): void => {
    if (rolesToAdd.length === 0) return;
    assignRolesMutation.mutate(rolesToAdd, {
      onSuccess: () => {
        setRolesToAdd([]);
        setFeedback({
          kind: 'success',
          header: 'Roles actualizados',
          message: 'Los roles se asignaron correctamente.',
        });
      },
      onError: error =>
        setFeedback({
          kind: 'error',
          header: 'No se pudieron asignar los roles',
          message: error instanceof AppClientError ? error.message : 'Intenta nuevamente.',
        }),
    });
  };

  const handleConfirmRemoveRole = (): void => {
    if (!roleToRemove) return;
    const role = roleToRemove;
    setRoleToRemove(null);
    removeRoleMutation.mutate(role.id, {
      onSuccess: () =>
        setFeedback({
          kind: 'success',
          header: 'Rol removido',
          message: `El rol "${role.name}" fue removido correctamente.`,
        }),
      onError: error =>
        setFeedback({
          kind: 'error',
          header: 'No se pudo remover el rol',
          message: error instanceof AppClientError ? error.message : 'Intenta nuevamente.',
        }),
    });
  };

  const handleConfirmDeactivate = (): void => {
    setIsDeactivateOpen(false);
    deactivateMutation.mutate(user.id, {
      onSuccess: () =>
        setFeedback({
          kind: 'success',
          header: 'Usuario desactivado',
          message: `${user.firstName} ${user.lastName} fue desactivado correctamente.`,
        }),
      onError: error =>
        setFeedback({
          kind: 'error',
          header: 'No se pudo desactivar el usuario',
          message: error instanceof AppClientError ? error.message : 'Intenta nuevamente.',
        }),
    });
  };

  const roleOrganizationId = user.roles[0]?.organizationId ?? undefined;

  return (
    <section className="user-detail-page" aria-labelledby="user-detail-title">
      <header className="user-detail-page__header">
        <div>
          <h1 id="user-detail-title">
            {user.firstName} {user.lastName}
          </h1>
          <p>{user.email}</p>
        </div>
        <IonBadge color={user.active ? 'success' : 'medium'}>{user.active ? 'Activo' : 'Inactivo'}</IonBadge>
      </header>

      <AppDetailActions className="user-detail-page__actions">
        <PermissionGuard permission="users.update">
          <AppButton fill="outline" onClick={() => history.push(`/admin/users/${user.id}/edit`)}>
            Editar perfil
          </AppButton>
        </PermissionGuard>

        <PermissionGuard permission="users.delete">
          {user.active && (
            <AppButton
              fill="outline"
              color="danger"
              isLoading={deactivateMutation.isPending}
              onClick={() => setIsDeactivateOpen(true)}
            >
              Desactivar
            </AppButton>
          )}
        </PermissionGuard>
      </AppDetailActions>

      <section aria-labelledby="user-detail-roles-title">
        <h2 id="user-detail-roles-title">Roles asignados</h2>

        {user.roles.length === 0 ? (
          <p>Este usuario no tiene roles de organización asignados.</p>
        ) : (
          <ul className="user-detail-page__roles" aria-label="Roles asignados">
            {user.roles.map(role => (
              <li key={role.id}>
                <IonChip>
                  <IonLabel>{role.name}</IonLabel>
                  <PermissionGuard permission="users.manage">
                    <AppButton
                      fill="clear"
                      size="small"
                      className="user-detail-page__remove-role"
                      disabled={removeRoleMutation.isPending}
                      aria-label={`Remover rol ${role.name}`}
                      onClick={() => setRoleToRemove(role)}
                    >
                      <IonIcon icon={closeCircleOutline} slot="icon-only" aria-hidden="true" />
                    </AppButton>
                  </PermissionGuard>
                </IonChip>
              </li>
            ))}
          </ul>
        )}

        <PermissionGuard permission="users.manage">
          <div className="user-detail-page__add-role">
            <UserRolesEditor
              organizationId={roleOrganizationId}
              value={rolesToAdd}
              onChange={setRolesToAdd}
              excludeRoleIds={user.roles.map(role => role.id)}
              disabled={assignRolesMutation.isPending}
            />
            <AppButton
              fill="outline"
              disabled={rolesToAdd.length === 0}
              isLoading={assignRolesMutation.isPending}
              onClick={handleAddRoles}
            >
              Agregar roles
            </AppButton>
          </div>
        </PermissionGuard>
      </section>

      <AppConfirmDialog
        isOpen={Boolean(roleToRemove)}
        header="Remover rol"
        message={roleToRemove ? `¿Quitar el rol "${roleToRemove.name}" a este usuario?` : ''}
        confirmText="Remover"
        isDestructive
        onConfirm={handleConfirmRemoveRole}
        onCancel={() => setRoleToRemove(null)}
      />
      <AppInteractionAlert
        isOpen={Boolean(feedback)}
        kind={feedback?.kind ?? 'info'}
        header={feedback?.header}
        message={feedback?.message ?? ''}
        onDismiss={() => setFeedback(null)}
      />

      <AppConfirmDialog
        isOpen={isDeactivateOpen}
        header="Desactivar usuario"
        message={`¿Seguro que quieres desactivar a ${user.firstName} ${user.lastName}?`}
        confirmText="Desactivar"
        isDestructive
        onConfirm={handleConfirmDeactivate}
        onCancel={() => setIsDeactivateOpen(false)}
      />
    </section>
  );
};

export default UserDetailPage;
