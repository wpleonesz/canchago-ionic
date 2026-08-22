import { lockClosedOutline } from 'ionicons/icons';
import { IonIcon } from '@ionic/react';

const AdminAccessDeniedPage: React.FC = () => (
  <section className="admin-state" role="alert" aria-labelledby="admin-denied-title">
    <span className="admin-state__icon" aria-hidden="true">
      <IonIcon icon={lockClosedOutline} />
    </span>
    <p className="admin-state__eyebrow">Acceso restringido</p>
    <h2 id="admin-denied-title">No tienes permiso para abrir esta sección</h2>
    <p>Tu sesión sigue activa. Solicita el acceso correspondiente a un administrador autorizado.</p>
  </section>
);

export default AdminAccessDeniedPage;
