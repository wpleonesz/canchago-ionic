import { IonIcon } from '@ionic/react';
import { addOutline, checkmarkDoneOutline } from 'ionicons/icons';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import AppButton from '../../../components/common/AppButton';
import AppDataList from '../../../components/common/AppDataList';
import AppSearchInput from '../../../components/forms/AppSearchInput';
import AppSelect from '../../../components/forms/AppSelect';
import PermissionGuard from '../../auth/components/PermissionGuard';
import OrganizationListItem from '../components/OrganizationListItem';
import { useOrganizations } from '../hooks/useOrganizations';
import '../organizations.css';

const OrganizationsListPage: React.FC = () => {
  const history = useHistory();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [orderBy, setOrderBy] = useState<'name' | 'createdAt'>('createdAt');

  const resetPage = (): void => setPage(1);

  const organizationsQuery = useOrganizations({
    page,
    pageSize: 20,
    search: search || undefined,
    orderBy,
    order: orderBy === 'name' ? 'asc' : 'desc',
  });

  return (
    <section className="organizations-list-page" aria-labelledby="organizations-list-title">
      <header className="organizations-page-header">
        <div>
          <p className="organizations-page-header__eyebrow">Estructura</p>
          <h1 id="organizations-list-title">Organizaciones</h1>
          <p>Administra las organizaciones del sistema y sus sedes.</p>
        </div>
        <div className="organizations-page-header__actions">
          <PermissionGuard permission="organizaciones.manage">
            <AppButton fill="outline" onClick={() => history.push('/admin/organizations/access-requests')}>
              <IonIcon icon={checkmarkDoneOutline} slot="start" />
              Solicitudes de acceso
            </AppButton>
            <AppButton onClick={() => history.push('/admin/organizations/new')}>
              <IonIcon icon={addOutline} slot="start" />
              Nueva organización
            </AppButton>
          </PermissionGuard>
        </div>
      </header>

      <div className="organizations-list-page__toolbar">
        <AppSearchInput
          placeholder="Buscar por nombre o correo"
          onSearch={value => {
            setSearch(value);
            resetPage();
          }}
        />
        <AppSelect
          label="Ordenar por"
          value={orderBy}
          options={[
            { value: 'createdAt', label: 'Creación reciente' },
            { value: 'name', label: 'Nombre' },
          ]}
          onIonChange={event => {
            setOrderBy(event.detail.value as typeof orderBy);
            resetPage();
          }}
        />
      </div>

      <AppDataList
        items={organizationsQuery.data?.data ?? []}
        keyExtractor={organization => organization.id}
        renderItem={organization => <OrganizationListItem organization={organization} />}
        isLoading={organizationsQuery.isLoading}
        isError={organizationsQuery.isError}
        errorMessage="No se pudo cargar el listado de organizaciones."
        onRetry={() => void organizationsQuery.refetch()}
        emptyTitle="No hay organizaciones para mostrar"
        emptyDescription={search ? 'Prueba con otra búsqueda.' : 'Crea la primera organización.'}
        meta={organizationsQuery.data?.meta}
        onPageChange={setPage}
      />
    </section>
  );
};

export default OrganizationsListPage;
