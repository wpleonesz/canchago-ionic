import { IonIcon, IonItem, IonLabel } from '@ionic/react';
import { fileTrayOutline } from 'ionicons/icons';

interface AppEmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
}

const AppEmptyState: React.FC<AppEmptyStateProps> = ({ icon = fileTrayOutline, title, description }) => (
  <IonItem className="app-empty-state" lines="none" role="status">
    <IonIcon icon={icon} slot="start" aria-hidden="true" />
    <IonLabel>
      <p className="app-empty-state__title">{title}</p>
      {description && <p className="app-empty-state__description">{description}</p>}
    </IonLabel>
  </IonItem>
);

export default AppEmptyState;
