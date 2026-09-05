import { IonBadge, IonItem, IonLabel } from '@ionic/react';
import type { PermissionDto } from '../../../types/api/roles';

interface PermissionListItemProps {
  permission: PermissionDto;
}

const PermissionListItem: React.FC<PermissionListItemProps> = ({ permission }) => (
  <IonItem className="permission-list-item" lines="full">
    <IonLabel>
      <div className="permission-list-item__title">
        <h2>{permission.description ?? permission.action}</h2>
        <IonBadge color="medium">{permission.module}</IonBadge>
      </div>
      <p className="permission-list-item__meta">
        <code>{permission.code}</code>
      </p>
    </IonLabel>
  </IonItem>
);

export default PermissionListItem;
