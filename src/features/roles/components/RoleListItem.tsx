import { IonBadge, IonIcon, IonItem, IonLabel } from '@ionic/react';
import { createOutline, eyeOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import AppButton from '../../../components/common/AppButton';
import type { RoleDto } from '../../../types/api/roles';
import PermissionGuard from '../../auth/components/PermissionGuard';

interface RoleListItemProps {
  role: RoleDto;
  organizationId: string;
}

const RoleListItem: React.FC<RoleListItemProps> = ({ role, organizationId }) => {
  const history = useHistory();
  const query = `?organizationId=${encodeURIComponent(organizationId)}`;

  return (
    <IonItem className="role-list-item" lines="full">
      <IonLabel>
        <div className="role-list-item__title">
          <h2>{role.name}</h2>
          <IonBadge color={role.isSystem ? 'medium' : 'primary'}>
            {role.isSystem ? 'Sistema' : 'Personalizado'}
          </IonBadge>
        </div>
        <p>{role.description ?? 'Sin descripción'}</p>
        <p className="role-list-item__meta">
          <code>{role.code}</code> · {role.permissionsCount} permiso{role.permissionsCount === 1 ? '' : 's'}
        </p>
      </IonLabel>

      <div slot="end" className="role-list-item__actions">
        <AppButton
          fill="clear"
          size="small"
          aria-label={`Consultar ${role.name}`}
          onClick={() => history.push(`/admin/roles/${role.id}${query}`)}
        >
          <IonIcon icon={eyeOutline} slot="icon-only" />
        </AppButton>
        {!role.isSystem && (
          <PermissionGuard permission="roles.manage">
            <PermissionGuard permission="permisos.read">
              <AppButton
                fill="clear"
                size="small"
                aria-label={`Editar ${role.name}`}
                onClick={() => history.push(`/admin/roles/${role.id}/edit${query}`)}
              >
                <IonIcon icon={createOutline} slot="icon-only" />
              </AppButton>
            </PermissionGuard>
          </PermissionGuard>
        )}
      </div>
    </IonItem>
  );
};

export default RoleListItem;
