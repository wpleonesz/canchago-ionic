import { IonIcon } from '@ionic/react';
import { arrowForwardOutline } from 'ionicons/icons';
import { Link } from 'react-router-dom';
import type { AdminNavigationGroup } from '../navigation/admin-navigation';
import { useSessionStore } from '../../../store/sessionStore';

interface AdminDashboardPageProps {
  groups: AdminNavigationGroup[];
}

const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ groups }) => {
  const user = useSessionStore(state => state.user);
  const items = groups.flatMap(group => group.items);

  if (!user) {
    return (
      <section className="admin-state" aria-live="polite">
        <h2>Verificando tu acceso</h2>
        <p>Estamos comprobando las capacidades de tu sesión.</p>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="admin-state" role="status" aria-labelledby="admin-empty-title">
        <p className="admin-state__eyebrow">Sin módulos disponibles</p>
        <h2 id="admin-empty-title">Tu cuenta no tiene capacidades administrativas</h2>
        <p>Cuando recibas un permiso administrativo, su sección aparecerá aquí automáticamente.</p>
      </section>
    );
  }

  return (
    <main className="admin-dashboard">
      <header className="admin-dashboard__hero">
        <p className="admin-state__eyebrow">Panel administrativo</p>
        <h1>Hola, {user.name.split(' ')[0]}</h1>
        <p>Accede únicamente a las herramientas habilitadas para tu cuenta.</p>
      </header>

      <section aria-labelledby="admin-modules-title">
        <div className="admin-dashboard__section-heading">
          <h2 id="admin-modules-title">Módulos disponibles</h2>
          <span>{items.length} disponibles</span>
        </div>
        <div className="admin-dashboard__grid">
          {items.map(item => (
            <Link key={item.id} to={item.path} className="admin-module-card">
              <span className="admin-module-card__icon" aria-hidden="true">
                <IonIcon icon={item.icon} />
              </span>
              <span className="admin-module-card__copy">
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>
              <IonIcon className="admin-module-card__arrow" icon={arrowForwardOutline} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
};

export default AdminDashboardPage;
