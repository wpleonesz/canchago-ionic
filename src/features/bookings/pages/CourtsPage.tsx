import { useMemo, useState } from 'react';
import { IonItem, IonLabel, IonList, IonSelect, IonSelectOption } from '@ionic/react';
import AppButton from '../../../components/common/AppButton';
import AppDataList from '../../../components/common/AppDataList';
import AppInteractionAlert from '../../../components/feedback/AppInteractionAlert';
import { BusinessRuleError } from '../../../services/api/errorMapper';
import { useAvailability, useCreateBooking, useResources } from '../hooks/useBookings';

const CourtsPage: React.FC = () => {
  const today = new Date().toISOString().slice(0, 10);
  const [resourceId, setResourceId] = useState('');
  const [date, setDate] = useState(today);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const resources = useResources();
  const range = useMemo(
    () => ({ from: new Date(`${date}T00:00:00`).toISOString(), to: new Date(`${date}T23:59:59`).toISOString() }),
    [date],
  );
  const availability = useAvailability(resourceId, range);
  const booking = useCreateBooking();
  const confirm = async (): Promise<void> => {
    if (!selectedSlot) return;
    try {
      await booking.mutateAsync({ availabilitySlotId: selectedSlot, idempotencyKey: crypto.randomUUID() });
      setMessage('Reserva confirmada correctamente.');
      setSelectedSlot('');
    } catch (error) {
      setMessage(
        error instanceof BusinessRuleError
          ? 'La franja fue tomada o dejó de estar disponible. Actualizamos los horarios.'
          : 'No se pudo confirmar. Revisa tu conexión e intenta nuevamente.',
      );
      await availability.refetch();
    }
  };
  return (
    <section className="booking-page">
      <h1>Canchas disponibles</h1>
      <p>Puedes reservar de lunes a domingo y tantas franjas libres como necesites.</p>
      <IonList>
        <IonItem>
          <IonSelect
            label="Cancha"
            value={resourceId}
            placeholder="Selecciona una cancha"
            onIonChange={event => {
              setResourceId(String(event.detail.value));
              setSelectedSlot('');
            }}
          >
            {resources.data?.data.map(resource => (
              <IonSelectOption key={resource.id} value={resource.id}>
                {resource.name} · {resource.venue.name}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>
        <IonItem>
          <IonLabel>Fecha</IonLabel>
          <input
            type="date"
            min={today}
            value={date}
            onChange={event => {
              setDate(event.target.value);
              setSelectedSlot('');
            }}
          />
        </IonItem>
      </IonList>
      {!resourceId ? (
        <p role="status">Selecciona una cancha para consultar horarios.</p>
      ) : (
        <AppDataList
          items={availability.data?.data ?? []}
          keyExtractor={slot => slot.id}
          renderItem={slot => (
            <IonItem
              button
              detail={false}
              color={selectedSlot === slot.id ? 'primary' : undefined}
              onClick={() => setSelectedSlot(slot.id)}
            >
              <IonLabel>
                {new Date(slot.startsAt).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })} –{' '}
                {new Date(slot.endsAt).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
              </IonLabel>
            </IonItem>
          )}
          isLoading={availability.isLoading}
          isError={availability.isError}
          onRetry={() => void availability.refetch()}
          emptyTitle="No hay horarios disponibles"
          emptyDescription="Prueba otra fecha o cancha."
        />
      )}
      <AppButton expand="block" disabled={!selectedSlot} isLoading={booking.isPending} onClick={() => void confirm()}>
        Confirmar reserva
      </AppButton>
      <AppInteractionAlert
        isOpen={Boolean(message)}
        kind={message?.startsWith('Reserva confirmada') ? 'success' : 'error'}
        message={message ?? ''}
        onDismiss={() => setMessage(null)}
      />
    </section>
  );
};
export default CourtsPage;
