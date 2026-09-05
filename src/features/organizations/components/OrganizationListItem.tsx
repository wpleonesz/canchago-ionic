import { IonBadge, IonIcon, IonItem, IonLabel } from '@ionic/react';
import { businessOutline, createOutline, eyeOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import AppButton from '../../../components/common/AppButton';
import type { OrganizationDto } from '../../../types/api/organizaciones';
import PermissionGuard from '../../auth/components/PermissionGuard';
import { getOrganizationStatusColor, getOrganizationStatusLabel } from '../organizationStatus';

interface OrganizationListItemProps {
  organization: OrganizationDto;
}

const OrganizationListItem: React.FC<OrganizationListItemProps> = ({ organization }) => {
  const history = useHistory();

  return (
    <IonItem className="organization-list-item" lines="full">
      <IonLabel>
        <div className="organization-list-item__title">
          <h2>{organization.name}</h2>
          <IonBadge color={getOrganizationStatusColor(organization.status)}>
            {getOrganizationStatusLabel(organization.status)}
          </IonBadge>
        </div>
        {organization.taxIdentification && <p>{organization.taxIdentification}</p>}
        <p className="organization-list-item__meta">
          {[organization.email, organization.phone].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
          {typeof organization.venuesCount === 'number' && (
            <>
              {' · '}
              <IonIcon icon={businessOutline} aria-hidden="true" /> {organization.venuesCount} sede
              {organization.venuesCount === 1 ? '' : 's'}
            </>
          )}
        </p>
      </IonLabel>

      <div slot="end" className="organization-list-item__actions">
        <AppButton
          fill="clear"
          size="small"
          aria-label={`Consultar ${organization.name}`}
          onClick={() => history.push(`/admin/organizations/${organization.id}`)}
        >
          <IonIcon icon={eyeOutline} slot="icon-only" />
        </AppButton>
        <PermissionGuard permission="organizaciones.manage">
          <AppButton
            fill="clear"
            size="small"
            aria-label={`Editar ${organization.name}`}
            onClick={() => history.push(`/admin/organizations/${organization.id}/edit`)}
          >
            <IonIcon icon={createOutline} slot="icon-only" />
          </AppButton>
        </PermissionGuard>
      </div>
    </IonItem>
  );
};

export default OrganizationListItem;
