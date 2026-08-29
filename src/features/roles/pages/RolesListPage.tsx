import { IonIcon, IonLabel, IonSegment, IonSegmentButton } from '@ionic/react';
import { addOutline } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import AppButton from '../../../components/common/AppButton';
import AppDataList from '../../../components/common/AppDataList';
import AppSearchInput from '../../../components/forms/AppSearchInput';
import AppSelect from '../../../components/forms/AppSelect';
import { useOrganizations } from '../../organizations/hooks/useOrganizations';
import PermissionGuard from '../../auth/components/PermissionGuard';
import RoleListItem from '../components/RoleListItem';
import { useAdminRoles } from '../hooks/useRoles';
import '../roles.css';

type RoleTypeFilter = 'all' | 'system' | 'custom';

const RolesListPage: React.FC = () => {
  const history = useHistory();
  const organizationsQuery = useOrganizations(1, 100);
  const [organizationId, setOrganizationId] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<RoleTypeFilter>('all');
  const [orderBy, setOrderBy] = useState<'name' | 'createdAt' | 'updatedAt'>('updatedAt');

  useEffect(() => {
    if (!organizationId && organizationsQuery.data?.data[0]) {
      setOrganizationId(organizationsQuery.data.data[0].id);
    }
  }, [organizationId, organizationsQuery.data]);

  const rolesQuery = useAdminRoles({
    organizationId,
    page,
    pageSize: 20,
    search: search || undefined,
    isSystem: typeFilter === 'all' ? undefined : typeFilter === 'system',
    orderBy,
    order: orderBy === 'name' ? 'asc' : 'desc',
  });

  const resetPage = (): void => setPage(1);
  const organizationOptions = (organizationsQuery.data?.data ?? []).map(organization => ({
    value: organization.id,
    label: organization.name,
  }));

  return (
    <section className="roles-list-page" aria-labelledby="roles-list-title">
      <header className="roles-page-header">
        <div>
          <p className="roles-page-header__eyebrow">Usuarios y acceso</p>
          <h1 id="roles-list-title">Roles</h1>
          <p>Define capacidades por organización sin modificar roles internos del sistema.</p>
        </div>
        <PermissionGuard permission="roles.manage">
          <PermissionGuard permission="permisos.read">
            <AppButton
              disabled={!organizationId}
              onClick={() => history.push(`/admin/roles/new?organizationId=${organizationId}`)}
            >
              <IonIcon icon={addOutline} slot="start" />
              Nuevo rol
            </AppButton>
          </PermissionGuard>
        </PermissionGuard>
      </header>

      <div className="roles-list-page__toolbar">
        <AppSelect
          label="Organización"
          options={organizationOptions}
          value={organizationId}
          disabled={organizationsQuery.isLoading || organizationsQuery.isError}
          error={organizationsQuery.isError ? 'No se pudieron cargar las organizaciones.' : undefined}
          onIonChange={event => {
            setOrganizationId(event.detail.value as string);
            resetPage();
          }}
        />
        <AppSearchInput
          placeholder="Buscar por nombre, código o descripción"
          onSearch={value => {
            setSearch(value);
            resetPage();
          }}
        />
        <AppSelect
          label="Ordenar por"
          value={orderBy}
          options={[
            { value: 'updatedAt', label: 'Actualización reciente' },
            { value: 'createdAt', label: 'Creación reciente' },
            { value: 'name', label: 'Nombre' },
          ]}
          onIonChange={event => {
            setOrderBy(event.detail.value as typeof orderBy);
            resetPage();
          }}
        />
      </div>

      <IonSegment
        value={typeFilter}
        onIonChange={event => {
          setTypeFilter((event.detail.value as RoleTypeFilter) ?? 'all');
          resetPage();
        }}
      >
        <IonSegmentButton value="all">
          <IonLabel>Todos</IonLabel>
        </IonSegmentButton>
        <IonSegmentButton value="custom">
          <IonLabel>Personalizados</IonLabel>
        </IonSegmentButton>
        <IonSegmentButton value="system">
          <IonLabel>Sistema</IonLabel>
        </IonSegmentButton>
      </IonSegment>

      <AppDataList
        items={rolesQuery.data?.data ?? []}
        keyExtractor={role => role.id}
        renderItem={role => <RoleListItem role={role} organizationId={organizationId} />}
        isLoading={Boolean(organizationId) && rolesQuery.isLoading}
        isError={organizationsQuery.isError || rolesQuery.isError}
        errorMessage="No se pudo cargar el listado de roles."
        onRetry={() => void (organizationsQuery.isError ? organizationsQuery.refetch() : rolesQuery.refetch())}
        emptyTitle={organizationId ? 'No hay roles para mostrar' : 'Selecciona una organización'}
        emptyDescription={search ? 'Prueba con otra búsqueda.' : 'Crea el primer rol personalizado.'}
        meta={rolesQuery.data?.meta}
        onPageChange={setPage}
      />
    </section>
  );
};

export default RolesListPage;
