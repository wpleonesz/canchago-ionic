import { helpCircleOutline } from 'ionicons/icons';
import { IonIcon } from '@ionic/react';

const AdminNotFoundPage: React.FC = () => (
  <section className="admin-state" role="alert" aria-labelledby="admin-not-found-title">
    <span className="admin-state__icon" aria-hidden="true">
      <IonIcon icon={helpCircleOutline} />
    </span>
    <p className="admin-state__eyebrow">Ruta no disponible</p>
    <h2 id="admin-not-found-title">Esta sección administrativa no existe</h2>
    <p>Usa el menú para volver a uno de los módulos habilitados para tu cuenta.</p>
  </section>
);

export default AdminNotFoundPage;
