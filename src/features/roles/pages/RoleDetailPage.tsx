import { IonBadge } from '@ionic/react';
import { useLocation, useHistory, useParams } from 'react-router-dom';
import AppButton from '../../../components/common/AppButton';
import AppErrorState from '../../../components/feedback/AppErrorState';
import AppSkeleton from '../../../components/feedback/AppSkeleton';
import AppDetailActions from '../../../components/layout/AppDetailActions';
import { NotFoundError } from '../../../services/api/errorMapper';
import PermissionGuard from '../../auth/components/PermissionGuard';
import { useRole } from '../hooks/useRoles';
import '../roles.css';

const RoleDetailPage: React.FC = () => {
  const { roleId } = useParams<{ roleId: string }>();
  const location = useLocation();
  const history = useHistory();
  const organizationId = new URLSearchParams(location.search).get('organizationId') ?? '';
  const roleQuery = useRole(roleId, organizationId);

  if (!organizationId) return <AppErrorState message="Selecciona una organización para consultar el rol." />;
  if (roleQuery.isLoading) return <AppSkeleton rows={5} />;
  if (roleQuery.isError || !roleQuery.data) {
    return (
      <AppErrorState
        message={
          roleQuery.error instanceof NotFoundError ? 'El rol solicitado no existe.' : 'No se pudo cargar el rol.'
        }
        onRetry={() => void roleQuery.refetch()}
      />
    );
  }

  const role = roleQuery.data;
  const grouped = Object.entries(
    role.permissions.reduce<Record<string, typeof role.permissions>>((result, permission) => {
      (result[permission.module] ??= []).push(permission);
      return result;
    }, {}),
  );

  return (
    <section className="role-detail-page" aria-labelledby="role-detail-title">
      <header className="roles-page-header">
        <div>
          <p className="roles-page-header__eyebrow">Detalle del rol</p>
          <h1 id="role-detail-title">{role.name}</h1>
          <p>{role.description ?? 'Sin descripción'}</p>
        </div>
        <AppDetailActions className="roles-page-header__actions">
          <AppButton fill="outline" onClick={() => history.push('/admin/roles')}>
            Volver
          </AppButton>
          {!role.isSystem && (
            <PermissionGuard permission="roles.manage">
              <PermissionGuard permission="permisos.read">
                <AppButton
                  fill="outline"
                  onClick={() => history.push(`/admin/roles/${role.id}/permissions?organizationId=${organizationId}`)}
                >
                  Gestionar permisos
                </AppButton>
                <AppButton
                  onClick={() => history.push(`/admin/roles/${role.id}/edit?organizationId=${organizationId}`)}
                >
                  Editar rol
                </AppButton>
              </PermissionGuard>
            </PermissionGuard>
          )}
        </AppDetailActions>
      </header>

      <article className="role-detail-card">
        <dl>
          <div>
            <dt>Código técnico</dt>
            <dd>
              <code>{role.code}</code>
            </dd>
          </div>
          <div>
            <dt>Tipo</dt>
            <dd>
              <IonBadge color={role.isSystem ? 'medium' : 'primary'}>
                {role.isSystem ? 'Sistema protegido' : 'Personalizado'}
              </IonBadge>
            </dd>
          </div>
          <div>
            <dt>Última actualización</dt>
            <dd>{new Date(role.updatedAt).toLocaleString()}</dd>
          </div>
        </dl>
      </article>

      <section className="role-permission-summary" aria-labelledby="role-detail-permissions">
        <h2 id="role-detail-permissions">Permisos asociados</h2>
        {grouped.length === 0 && <p>Este rol no tiene permisos asociados.</p>}
        {grouped.map(([moduleName, permissions]) => (
          <div key={moduleName} className="role-permission-summary__group">
            <h3>{moduleName}</h3>
            <ul>
              {permissions.map(permission => (
                <li key={permission.id}>
                  <code>{permission.code}</code>
                  <span>{permission.description}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </section>
  );
};

export default RoleDetailPage;
