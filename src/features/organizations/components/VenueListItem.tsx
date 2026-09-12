import { IonBadge, IonIcon, IonItem, IonLabel } from '@ionic/react';
import { banOutline, checkmarkCircleOutline, createOutline } from 'ionicons/icons';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import AppButton from '../../../components/common/AppButton';
import AppConfirmDialog from '../../../components/feedback/AppConfirmDialog';
import AppInteractionAlert from '../../../components/feedback/AppInteractionAlert';
import { AppClientError } from '../../../services/api/errorMapper';
import type { VenueDto } from '../../../types/api/organizaciones';
import PermissionGuard from '../../auth/components/PermissionGuard';
import { useUpdateVenue } from '../hooks/useVenues';
import { getOrganizationStatusColor, getOrganizationStatusLabel } from '../organizationStatus';

interface VenueListItemProps {
  venue: VenueDto;
}

const VenueListItem: React.FC<VenueListItemProps> = ({ venue }) => {
  const history = useHistory();
  const [showDeactivateConfirmation, setShowDeactivateConfirmation] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const updateStatusMutation = useUpdateVenue(venue.organizationId, venue.id);
  const isActive = venue.status === 'ACTIVE';

  const changeStatus = async (nextStatus: 'ACTIVE' | 'INACTIVE'): Promise<void> => {
    setStatusError(null);
    try {
      await updateStatusMutation.mutateAsync({ status: nextStatus, expectedUpdatedAt: venue.updatedAt });
    } catch (error) {
      setStatusError(error instanceof AppClientError ? error.message : 'No se pudo cambiar el estado de la sede.');
    }
  };

  return (
    <IonItem className="venue-list-item" lines="full">
      <IonLabel>
        <div className="venue-list-item__title">
          <h2>{venue.name}</h2>
          <IonBadge color={getOrganizationStatusColor(venue.status)}>
            {getOrganizationStatusLabel(venue.status)}
          </IonBadge>
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
        <PermissionGuard permission="organizaciones.manage">
          <AppButton
            fill="clear"
            size="small"
            color={isActive ? 'danger' : 'success'}
            isLoading={updateStatusMutation.isPending}
            aria-label={isActive ? `Desactivar ${venue.name}` : `Activar ${venue.name}`}
            onClick={() => (isActive ? setShowDeactivateConfirmation(true) : void changeStatus('ACTIVE'))}
          >
            <IonIcon icon={isActive ? banOutline : checkmarkCircleOutline} slot="icon-only" />
          </AppButton>
        </PermissionGuard>
      </div>

      <AppConfirmDialog
        isOpen={showDeactivateConfirmation}
        header="Desactivar sede"
        message="La sede dejará de aparecer en nuevas búsquedas y no se podrán publicar canchas u horarios nuevos en ella. Las reservas ya confirmadas no se cancelan."
        confirmText="Desactivar"
        isDestructive
        onConfirm={() => {
          setShowDeactivateConfirmation(false);
          void changeStatus('INACTIVE');
        }}
        onCancel={() => setShowDeactivateConfirmation(false)}
      />
      <AppInteractionAlert
        isOpen={Boolean(statusError)}
        kind="error"
        header="No se pudo cambiar el estado"
        message={statusError ?? ''}
        onDismiss={() => setStatusError(null)}
      />
    </IonItem>
  );
};

export default VenueListItem;
