import { useState } from 'react';
import { IonItem, IonLabel } from '@ionic/react';
import AppButton from '../../../components/common/AppButton';
import AppDataList from '../../../components/common/AppDataList';
import AppInteractionAlert from '../../../components/feedback/AppInteractionAlert';
import { useCancelBooking, useOwnBookings } from '../hooks/useBookings';

const MyBookingsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const query = useOwnBookings(page);
  const cancel = useCancelBooking();
  const onCancel = async (id: string): Promise<void> => {
    try {
      await cancel.mutateAsync(id);
      setMessage('Reserva cancelada. La franja vuelve a estar disponible.');
    } catch {
      setMessage('No se pudo cancelar la reserva.');
    }
  };
  return (
    <section className="booking-page">
      <h1>Mis reservas</h1>
      <AppDataList
        items={query.data?.data ?? []}
        keyExtractor={item => item.id}
        renderItem={item => (
          <IonItem>
            <IonLabel>
              <h2>{item.resource?.name ?? 'Cancha'}</h2>
              <p>{item.availabilitySlot ? new Date(item.availabilitySlot.startsAt).toLocaleString('es-EC') : ''}</p>
              <p>{item.status === 'CONFIRMED' ? 'Confirmada' : 'Cancelada'}</p>
            </IonLabel>
            {item.status === 'CONFIRMED' && (
              <AppButton slot="end" fill="outline" color="danger" onClick={() => void onCancel(item.id)}>
                Cancelar
              </AppButton>
            )}
          </IonItem>
        )}
        isLoading={query.isLoading}
        isError={query.isError}
        onRetry={() => void query.refetch()}
        emptyTitle="Aún no tienes reservas"
        meta={query.data?.meta}
        onPageChange={setPage}
      />
      <AppInteractionAlert
        isOpen={Boolean(message)}
        kind={message?.startsWith('Reserva cancelada') ? 'success' : 'error'}
        message={message ?? ''}
        onDismiss={() => setMessage(null)}
      />
    </section>
  );
};
export default MyBookingsPage;
