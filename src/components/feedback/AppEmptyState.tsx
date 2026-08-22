import { IonIcon } from '@ionic/react';
import { fileTrayOutline } from 'ionicons/icons';

interface AppEmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
}

const AppEmptyState: React.FC<AppEmptyStateProps> = ({ icon = fileTrayOutline, title, description }) => (
  <div className="app-empty-state" role="status">
    <IonIcon icon={icon} aria-hidden="true" />
    <p className="app-empty-state__title">{title}</p>
    {description && <p className="app-empty-state__description">{description}</p>}
  </div>
);

export default AppEmptyState;
