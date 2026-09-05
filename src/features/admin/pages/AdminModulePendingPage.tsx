import { constructOutline } from 'ionicons/icons';
import AppStateMessage from '../../../components/layout/AppStateMessage';

interface AdminModulePendingPageProps {
  moduleName: string;
}

const AdminModulePendingPage: React.FC<AdminModulePendingPageProps> = ({ moduleName }) => (
  <AppStateMessage
    icon={constructOutline}
    eyebrow="Módulo previsto"
    title={moduleName}
    description="La navegación ya está preparada. Las operaciones de este módulo se implementarán en su propia feature."
    titleId="admin-pending-title"
  />
);

export default AdminModulePendingPage;
