import { IonBadge, IonItem, IonLabel } from '@ionic/react';
import AppButton from '../../../components/common/AppButton';
import type { AccessRequestDto } from '../../../types/api/access-requests';

interface AccessRequestListItemProps {
  request: AccessRequestDto;
  onApprove: (request: AccessRequestDto) => void;
  onReject: (request: AccessRequestDto) => void;
}

const AccessRequestListItem: React.FC<AccessRequestListItemProps> = ({ request, onApprove, onReject }) => {
  const venueNames = request.organization.venues.map(venue => venue.name).join(', ');

  return (
    <IonItem lines="full" className="access-request-list-item">
      {/* Todo dentro del slot por defecto de IonLabel (no slot="end"): con dos elementos en
          slot="end" (badge + botones) el contenido no ajusta en viewports angostos y se corta
          fuera de pantalla — bug real encontrado probando esta pantalla en un viewport móvil. */}
      <IonLabel>
        <div className="access-request-list-item__header">
          <h2>{request.organization.name}</h2>
          <IonBadge color="warning">Pendiente</IonBadge>
        </div>
        <p>{venueNames || 'Sin sedes registradas'}</p>
        <p>
          Solicitado por {request.requester.profile.firstName} {request.requester.profile.lastName} (
          {request.requester.email})
        </p>
        <div className="access-request-list-item__actions">
          <AppButton fill="clear" size="small" onClick={() => onApprove(request)}>
            Aprobar
          </AppButton>
          <AppButton fill="clear" color="danger" size="small" onClick={() => onReject(request)}>
            Rechazar
          </AppButton>
        </div>
      </IonLabel>
    </IonItem>
  );
};

export default AccessRequestListItem;
