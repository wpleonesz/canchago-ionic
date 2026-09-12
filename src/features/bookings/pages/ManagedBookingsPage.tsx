import { useState } from 'react';
import { IonBadge, IonItem, IonLabel, IonText } from '@ionic/react';
import AppDataList from '../../../components/common/AppDataList';
import AppSelect from '../../../components/forms/AppSelect';
import { normalizeResourceId } from '../../../validation/resource-id';
import { useManagedBookings, useResources } from '../hooks/useBookings';
import { formatUsd } from '../utils/maps';

const ManagedBookingsPage: React.FC = () => {
  const [resourceId, setResourceId] = useState('');
  const [page, setPage] = useState(1);
  const resources = useResources();
  const bookings = useManagedBookings(resourceId, page);

  return (
    <section className="booking-page">
      <IonText className="booking-page__intro"><h1>Reservas recibidas</h1><p>Consulta quién reservó y el valor de cada turno.</p></IonText>
      <AppSelect label="Cancha" value={resourceId} placeholder="Selecciona una cancha" options={(resources.data?.data ?? []).map(resource => ({ value: resource.id, label: `${resource.name} · ${resource.venue.name}` }))} onIonChange={event => { setResourceId(normalizeResourceId(event.detail.value)); setPage(1); }} />
      {resourceId && <AppDataList
        items={bookings.data?.data ?? []}
        keyExtractor={booking => booking.id}
        renderItem={booking => <IonItem className="booking-slot-row"><IonLabel><strong>{booking.user.profile ? `${booking.user.profile.firstName} ${booking.user.profile.lastName}`.trim() : booking.user.email}</strong><p>{booking.user.email}</p><p>{new Date(booking.availabilitySlot.startsAt).toLocaleString('es-EC')}</p><p>{booking.durationMinutes} min · {formatUsd(booking.totalPrice)}</p></IonLabel><IonBadge color={booking.status === 'CONFIRMED' ? 'success' : 'medium'}>{booking.status === 'CONFIRMED' ? 'Confirmada' : 'Cancelada'}</IonBadge></IonItem>}
        isLoading={bookings.isLoading}
        isError={bookings.isError}
        onRetry={() => void bookings.refetch()}
        emptyTitle="Esta cancha todavía no tiene reservas"
        meta={bookings.data?.meta}
        onPageChange={setPage}
      />}
    </section>
  );
};

export default ManagedBookingsPage;
