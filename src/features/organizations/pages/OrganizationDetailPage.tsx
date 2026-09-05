import { IonBadge, IonIcon } from '@ionic/react';
import { addOutline } from 'ionicons/icons';
import { useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import AppButton from '../../../components/common/AppButton';
import AppDataList from '../../../components/common/AppDataList';
import AppErrorState from '../../../components/feedback/AppErrorState';
import AppSkeleton from '../../../components/feedback/AppSkeleton';
import AppSearchInput from '../../../components/forms/AppSearchInput';
import AppSelect from '../../../components/forms/AppSelect';
import AppDetailActions from '../../../components/layout/AppDetailActions';
import { NotFoundError } from '../../../services/api/errorMapper';
import PermissionGuard from '../../auth/components/PermissionGuard';
import VenueListItem from '../components/VenueListItem';
import { useOrganization } from '../hooks/useOrganizations';
import { useVenues } from '../hooks/useVenues';
import { getOrganizationStatusColor, getOrganizationStatusLabel } from '../organizationStatus';
import '../organizations.css';

const OrganizationDetailPage: React.FC = () => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const history = useHistory();
  const organizationQuery = useOrganization(organizationId);

  const [venuePage, setVenuePage] = useState(1);
  const [venueSearch, setVenueSearch] = useState('');
  const [venueOrderBy, setVenueOrderBy] = useState<'name' | 'createdAt'>('createdAt');

  const venuesQuery = useVenues(organizationId, {
    page: venuePage,
    pageSize: 10,
    search: venueSearch || undefined,
    orderBy: venueOrderBy,
    order: venueOrderBy === 'name' ? 'asc' : 'desc',
  });

  if (organizationQuery.isLoading) return <AppSkeleton rows={5} />;
  if (organizationQuery.isError || !organizationQuery.data) {
    return (
      <AppErrorState
        message={
          organizationQuery.error instanceof NotFoundError
            ? 'La organización solicitada no existe.'
            : 'No se pudo cargar la organización.'
        }
        onRetry={() => void organizationQuery.refetch()}
      />
    );
  }

  const organization = organizationQuery.data;

  return (
    <section className="organization-detail-page" aria-labelledby="organization-detail-title">
      <header className="organizations-page-header">
        <div>
          <p className="organizations-page-header__eyebrow">Detalle de la organización</p>
          <h1 id="organization-detail-title">{organization.name}</h1>
          <p>{organization.legalName ?? 'Sin razón social registrada'}</p>
        </div>
        <AppDetailActions className="organizations-page-header__actions">
          <AppButton fill="outline" onClick={() => history.push('/admin/organizations')}>
            Volver
          </AppButton>
          <PermissionGuard permission="organizaciones.manage">
            <AppButton onClick={() => history.push(`/admin/organizations/${organization.id}/edit`)}>
              Editar organización
            </AppButton>
          </PermissionGuard>
        </AppDetailActions>
      </header>

      <article className="organization-detail-card">
        <dl>
          <div>
            <dt>Estado</dt>
            <dd>
              <IonBadge color={getOrganizationStatusColor(organization.status)}>
                {getOrganizationStatusLabel(organization.status)}
              </IonBadge>
            </dd>
          </div>
          <div>
            <dt>Identificación tributaria</dt>
            <dd>{organization.taxIdentification ?? 'Sin registrar'}</dd>
          </div>
          <div>
            <dt>Correo electrónico</dt>
            <dd>{organization.email ?? 'Sin registrar'}</dd>
          </div>
          <div>
            <dt>Teléfono</dt>
            <dd>{organization.phone ?? 'Sin registrar'}</dd>
          </div>
          <div>
            <dt>Dominio</dt>
            <dd>{organization.domain ?? 'Sin registrar'}</dd>
          </div>
          <div>
            <dt>Última actualización</dt>
            <dd>{new Date(organization.updatedAt).toLocaleString()}</dd>
          </div>
        </dl>
      </article>

      <section className="organization-venues" aria-labelledby="organization-venues-title">
        <header className="organization-venues__header">
          <h2 id="organization-venues-title">Sedes</h2>
          <PermissionGuard permission="organizaciones.manage">
            <AppButton size="small" onClick={() => history.push(`/admin/organizations/${organization.id}/venues/new`)}>
              <IonIcon icon={addOutline} slot="start" />
              Nueva sede
            </AppButton>
          </PermissionGuard>
        </header>

        <div className="organization-venues__toolbar">
          <AppSearchInput
            placeholder="Buscar sede por nombre o correo"
            onSearch={value => {
              setVenueSearch(value);
              setVenuePage(1);
            }}
          />
          <AppSelect
            label="Ordenar por"
            value={venueOrderBy}
            options={[
              { value: 'createdAt', label: 'Creación reciente' },
              { value: 'name', label: 'Nombre' },
            ]}
            onIonChange={event => {
              setVenueOrderBy(event.detail.value as typeof venueOrderBy);
              setVenuePage(1);
            }}
          />
        </div>

        <AppDataList
          items={venuesQuery.data?.data ?? []}
          keyExtractor={venue => venue.id}
          renderItem={venue => <VenueListItem venue={venue} />}
          isLoading={venuesQuery.isLoading}
          isError={venuesQuery.isError}
          errorMessage="No se pudo cargar el listado de sedes."
          onRetry={() => void venuesQuery.refetch()}
          emptyTitle="No hay sedes para mostrar"
          emptyDescription={venueSearch ? 'Prueba con otra búsqueda.' : 'Crea la primera sede de esta organización.'}
          meta={venuesQuery.data?.meta}
          onPageChange={setVenuePage}
        />
      </section>
    </section>
  );
};

export default OrganizationDetailPage;
