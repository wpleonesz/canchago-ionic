import { IonIcon } from '@ionic/react';
import { arrowForwardOutline, checkmarkDoneOutline, hourglassOutline } from 'ionicons/icons';
import { Link } from 'react-router-dom';
import type { AdminNavigationGroup } from '../navigation/admin-navigation';
import AppButton from '../../../components/common/AppButton';
import AppStateMessage from '../../../components/layout/AppStateMessage';
import { useLogoutMutation } from '../../auth/hooks/useSession';
import ProfileSummary from '../../home/components/ProfileSummary';
import { useSessionStore } from '../../../store/sessionStore';

interface AdminDashboardPageProps {
  groups: AdminNavigationGroup[];
}

// Este panel es ahora la única "vista de inicio" de la app (fusión con la antigua /home): todo
// usuario autenticado aterriza aquí, tenga o no capacidades administrativas, así que el resumen
// de perfil y el cierre de sesión se muestran siempre — solo el listado de módulos varía según
// permisos.
const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ groups }) => {
  const user = useSessionStore(state => state.user);
  const logoutMutation = useLogoutMutation();
  const items = groups.flatMap(group => group.items);
  // La mayoría de las cuentas (Futbolista, Gestor de Cancha recién aprobado) nunca tienen
  // módulos administrativos — no es un estado transitorio "todavía no te dieron permiso", es su
  // condición normal y permanente. Encuadrarlo como "panel administrativo" / "sin capacidades
  // administrativas" (como si les faltara algo) confundía a cuentas públicas reales creadas por
  // el registro (feature 016/008) que nunca debieron ver lenguaje de administración.
  const hasAdminModules = items.length > 0;

  if (!user) {
    return (
      <AppStateMessage
        icon={hourglassOutline}
        eyebrow="Un momento"
        title="Verificando tu acceso"
        description="Estamos comprobando las capacidades de tu sesión."
      />
    );
  }

  return (
    <main className="admin-dashboard">
      <header className="admin-dashboard__hero">
        <p className="admin-state__eyebrow">{hasAdminModules ? 'Panel administrativo' : 'Tu cuenta'}</p>
        <h1>Hola, {user.name.split(' ')[0]}</h1>
        <p>
          {hasAdminModules
            ? 'Accede únicamente a las herramientas habilitadas para tu cuenta.'
            : 'Esta es la información de tu cuenta en CanchaGO.'}
        </p>
      </header>

      <ProfileSummary user={user} />

      {!hasAdminModules ? (
        <AppStateMessage
          icon={checkmarkDoneOutline}
          role="status"
          eyebrow="CanchaGO"
          title="Todo en orden"
          description="Por ahora no hay herramientas adicionales para tu cuenta. Vuelve pronto."
          titleId="admin-empty-title"
        />
      ) : (
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
      )}

      <footer className="admin-dashboard__footer">
        <AppButton
          fill="outline"
          color="medium"
          isLoading={logoutMutation.isPending}
          onClick={() => logoutMutation.mutate()}
        >
          Cerrar sesión
        </AppButton>
      </footer>
    </main>
  );
};

export default AdminDashboardPage;
