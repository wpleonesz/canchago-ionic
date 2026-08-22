import { useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { IonBadge, IonChip, IonLabel } from '@ionic/react';
import AppButton from '../../../components/common/AppButton';
import AppConfirmDialog from '../../../components/feedback/AppConfirmDialog';
import AppErrorState from '../../../components/feedback/AppErrorState';
import AppSkeleton from '../../../components/feedback/AppSkeleton';
import PermissionGuard from '../../auth/components/PermissionGuard';
import { useDeactivateUser } from '../hooks/useUserMutations';
import { useAssignUserRoles, useRemoveUserRole } from '../hooks/useUserRoles';
import { useUser } from '../hooks/useUsers';
import UserRolesEditor from '../components/UserRolesEditor';
import type { UserRoleDto } from '../../../types/api/users';
import '../users.css';

const UserDetailPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const history = useHistory();
  const { data: user, isLoading, isError, refetch } = useUser(userId);
  const [roleToRemove, setRoleToRemove] = useState<UserRoleDto | null>(null);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [rolesToAdd, setRolesToAdd] = useState<string[]>([]);

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
    assignRolesMutation.mutate(rolesToAdd, { onSuccess: () => setRolesToAdd([]) });
  };

  const handleConfirmRemoveRole = (): void => {
    if (!roleToRemove) return;
    removeRoleMutation.mutate(roleToRemove.id, { onSettled: () => setRoleToRemove(null) });
  };

  const handleConfirmDeactivate = (): void => {
    deactivateMutation.mutate(user.id, { onSettled: () => setIsDeactivateOpen(false) });
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

      <div className="user-detail-page__actions">
        <PermissionGuard permission="users.update">
          <AppButton fill="outline" onClick={() => history.push(`/admin/users/${user.id}/edit`)}>
            Editar
          </AppButton>
        </PermissionGuard>

        <PermissionGuard permission="users.delete">
          {user.active && (
            <AppButton fill="outline" color="danger" onClick={() => setIsDeactivateOpen(true)}>
              Desactivar
            </AppButton>
          )}
        </PermissionGuard>
      </div>

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
                    <button
                      type="button"
                      className="user-detail-page__remove-role"
                      aria-label={`Remover rol ${role.name}`}
                      onClick={() => setRoleToRemove(role)}
                    >
                      ×
                    </button>
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
