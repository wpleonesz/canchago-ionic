import { IonBadge, IonIcon, IonItem, IonLabel } from '@ionic/react';
import { createOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import AppButton from '../../../components/common/AppButton';
import type { VenueDto } from '../../../types/api/organizaciones';
import PermissionGuard from '../../auth/components/PermissionGuard';

interface VenueListItemProps {
  venue: VenueDto;
}

const VenueListItem: React.FC<VenueListItemProps> = ({ venue }) => {
  const history = useHistory();

  return (
    <IonItem className="venue-list-item" lines="full">
      <IonLabel>
        <div className="venue-list-item__title">
          <h2>{venue.name}</h2>
          <IonBadge color={venue.status === 'ACTIVE' ? 'success' : 'medium'}>{venue.status}</IonBadge>
        </div>
        {venue.address && <p>{venue.address}</p>}
        <p className="venue-list-item__meta">
          {[venue.email, venue.phone].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
        </p>
      </IonLabel>

      <div slot="end" className="venue-list-item__actions">
        <PermissionGuard permission="organizaciones.manage">
          <AppButton
            fill="clear"
            size="small"
            aria-label={`Editar ${venue.name}`}
            onClick={() => history.push(`/admin/organizations/${venue.organizationId}/venues/${venue.id}/edit`)}
          >
            <IonIcon icon={createOutline} slot="icon-only" />
          </AppButton>
        </PermissionGuard>
      </div>
    </IonItem>
  );
};

export default VenueListItem;
