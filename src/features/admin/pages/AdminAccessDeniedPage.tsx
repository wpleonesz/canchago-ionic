import { lockClosedOutline } from 'ionicons/icons';
import AppStateMessage from '../../../components/layout/AppStateMessage';

const AdminAccessDeniedPage: React.FC = () => (
  <AppStateMessage
    icon={lockClosedOutline}
    role="alert"
    eyebrow="Acceso restringido"
    title="No tienes permiso para abrir esta sección"
    description="Tu sesión sigue activa. Solicita el acceso correspondiente a un administrador autorizado."
    titleId="admin-denied-title"
  />
);

export default AdminAccessDeniedPage;
