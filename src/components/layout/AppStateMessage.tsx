import type { ReactNode } from 'react';
import { IonIcon } from '@ionic/react';

interface AppStateMessageProps {
  icon: string;
  eyebrow: string;
  title: string;
  description?: ReactNode;
  role?: 'alert' | 'status';
  titleId?: string;
}

// Bloque de estado a pantalla completa (denegado/pendiente/no-encontrado/vacío) — unifica el
// patrón "icono + eyebrow + título + descripción" repetido en features/admin/pages/*.tsx.
const AppStateMessage: React.FC<AppStateMessageProps> = ({ icon, eyebrow, title, description, role, titleId }) => (
  <section className="admin-state" role={role} aria-labelledby={titleId}>
    <span className="admin-state__icon" aria-hidden="true">
      <IonIcon icon={icon} />
    </span>
    <p className="admin-state__eyebrow">{eyebrow}</p>
    <h2 id={titleId}>{title}</h2>
    {description && <p>{description}</p>}
  </section>
);

export default AppStateMessage;
