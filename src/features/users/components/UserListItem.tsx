import { IonBadge, IonButtons, IonIcon, IonItem, IonLabel } from '@ionic/react';
import { banOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import PermissionGuard from '../../auth/components/PermissionGuard';
import AppButton from '../../../components/common/AppButton';
import type { UserDto } from '../../../types/api/users';

interface UserListItemProps {
  user: UserDto;
  onDeactivate: (user: UserDto) => void;
  isBusy?: boolean;
}

const UserListItem: React.FC<UserListItemProps> = ({ user, onDeactivate, isBusy = false }) => {
  const history = useHistory();

  return (
    <IonItem
      button
      detail={false}
      lines="full"
      className="user-list-item"
      onClick={() => history.push(`/admin/users/${user.id}`)}
    >
      <IonLabel>
        <div className="user-list-item__title">
          <h2>
            {user.firstName} {user.lastName}
          </h2>
          <IonBadge color={user.active ? 'success' : 'medium'}>{user.active ? 'Activo' : 'Inactivo'}</IonBadge>
        </div>
        <p>{user.email}</p>
      </IonLabel>

      <PermissionGuard permission="users.delete">
        <IonButtons slot="end" className="user-list-item__actions">
          <AppButton
            fill="clear"
            color="danger"
            size="small"
            disabled={isBusy}
            aria-label={`Desactivar a ${user.firstName} ${user.lastName}`}
            onClick={event => {
              event.stopPropagation();
              onDeactivate(user);
            }}
          >
            <IonIcon icon={banOutline} slot="icon-only" />
          </AppButton>
        </IonButtons>
      </PermissionGuard>
    </IonItem>
  );
};

export default UserListItem;
