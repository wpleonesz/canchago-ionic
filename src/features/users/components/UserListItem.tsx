import { IonBadge, IonItem, IonLabel } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import PermissionGuard from '../../auth/components/PermissionGuard';
import AppButton from '../../../components/common/AppButton';
import type { UserDto } from '../../../types/api/users';

interface UserListItemProps {
  user: UserDto;
  onDeactivate: (user: UserDto) => void;
}

const UserListItem: React.FC<UserListItemProps> = ({ user, onDeactivate }) => {
  const history = useHistory();

  return (
    <IonItem
      button
      detail={false}
      lines="full"
      className="user-list-item"
      onClick={() => history.push(`/users/${user.id}`)}
    >
      <IonLabel>
        <h2>
          {user.firstName} {user.lastName}
        </h2>
        <p>{user.email}</p>
      </IonLabel>

      <IonBadge slot="end" color={user.active ? 'success' : 'medium'}>
        {user.active ? 'Activo' : 'Inactivo'}
      </IonBadge>

      <PermissionGuard permission="users.delete">
        <AppButton
          slot="end"
          fill="clear"
          color="danger"
          size="small"
          onClick={event => {
            event.stopPropagation();
            onDeactivate(user);
          }}
        >
          Desactivar
        </AppButton>
      </PermissionGuard>
    </IonItem>
  );
};

export default UserListItem;
