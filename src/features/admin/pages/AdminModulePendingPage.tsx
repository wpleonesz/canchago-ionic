import { constructOutline } from 'ionicons/icons';
import { IonIcon } from '@ionic/react';

interface AdminModulePendingPageProps {
  moduleName: string;
}

const AdminModulePendingPage: React.FC<AdminModulePendingPageProps> = ({ moduleName }) => (
  <section className="admin-state" aria-labelledby="admin-pending-title">
    <span className="admin-state__icon" aria-hidden="true">
      <IonIcon icon={constructOutline} />
    </span>
    <p className="admin-state__eyebrow">Módulo previsto</p>
    <h2 id="admin-pending-title">{moduleName}</h2>
    <p>La navegación ya está preparada. Las operaciones de este módulo se implementarán en su propia feature.</p>
  </section>
);

export default AdminModulePendingPage;
