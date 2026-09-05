import { helpCircleOutline } from 'ionicons/icons';
import AppStateMessage from '../../../components/layout/AppStateMessage';

const AdminNotFoundPage: React.FC = () => (
  <AppStateMessage
    icon={helpCircleOutline}
    role="alert"
    eyebrow="Ruta no disponible"
    title="Esta sección administrativa no existe"
    description="Usa el menú para volver a uno de los módulos habilitados para tu cuenta."
    titleId="admin-not-found-title"
  />
);

export default AdminNotFoundPage;
