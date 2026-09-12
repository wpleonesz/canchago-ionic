import { useMemo, useRef, useState } from 'react';
import { IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonInput, IonText } from '@ionic/react';
import AppButton from '../../../components/common/AppButton';
import AppEmptyState from '../../../components/feedback/AppEmptyState';
import AppErrorState from '../../../components/feedback/AppErrorState';
import AppInteractionAlert from '../../../components/feedback/AppInteractionAlert';
import AppSkeleton from '../../../components/feedback/AppSkeleton';
import AppSelect from '../../../components/forms/AppSelect';
import { BusinessRuleError } from '../../../services/api/errorMapper';
import { useLocation } from 'react-router-dom';
import { normalizeResourceId } from '../../../validation/resource-id';
import { useAvailability, useCreateBooking, useResources } from '../hooks/useBookings';
import { directionsUrl, formatUsd } from '../utils/maps';

const localDate = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const CourtsPage: React.FC = () => {
  const today = localDate();
  const location = useLocation();
  const initial = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const [resourceId, setResourceId] = useState(() => normalizeResourceId(initial.get('resourceId')));
  const [date, setDate] = useState(() => initial.get('date') ?? today);
  const [selectedSlot, setSelectedSlot] = useState(() => normalizeResourceId(initial.get('slotId')));
  const [message, setMessage] = useState<string | null>(null);
  const attemptKey = useRef(crypto.randomUUID());
  const resources = useResources();
  const selectedResource = resources.data?.data.find(resource => resource.id === resourceId);
  const range = useMemo(() => ({ from: new Date(`${date}T00:00:00`).toISOString(), to: new Date(`${date}T23:59:59`).toISOString() }), [date]);
  const availability = useAvailability(resourceId, range);
  const selectedSlotData = availability.data?.data.find(slot => slot.id === selectedSlot);
  const booking = useCreateBooking();

  const confirm = async (): Promise<void> => {
    if (!selectedSlot) return;
    try {
      await booking.mutateAsync({ availabilitySlotId: selectedSlot, idempotencyKey: attemptKey.current });
      setMessage('Reserva confirmada. Puedes verla en Mis reservas.');
      setSelectedSlot('');
      attemptKey.current = crypto.randomUUID();
    } catch (error) {
      setMessage(error instanceof BusinessRuleError ? 'Ese horario acaba de ocuparse. Ya actualizamos la lista.' : 'No se pudo confirmar. Conservamos tu selección para que intentes nuevamente.');
      if (error instanceof BusinessRuleError) {
        setSelectedSlot('');
        attemptKey.current = crypto.randomUUID();
      }
      await availability.refetch();
    }
  };

  const slotsContent = (): React.ReactNode => {
    if (availability.isLoading) return <AppSkeleton />;
    if (availability.isError) return <AppErrorState message="No pudimos consultar los horarios." onRetry={() => void availability.refetch()} />;
    if (!availability.data?.data.length) return <AppEmptyState title="No hay horarios para este día" description="Elige otro día o cancha." />;
    return <div className="booking-slot-grid">{availability.data.data.map(slot => (
      <AppButton key={slot.id} fill={selectedSlot === slot.id ? 'solid' : 'outline'} onClick={() => setSelectedSlot(slot.id)}>
        {new Date(slot.startsAt).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
      </AppButton>
    ))}</div>;
  };

  return (
    <section className="booking-page">
      <IonText className="booking-page__intro"><h1>Reserva una cancha</h1><p>Elige dónde, cuándo y a qué hora.</p></IonText>
      <IonCard className="booking-step">
        <IonCardHeader><IonCardSubtitle>Paso 1 de 3</IonCardSubtitle><IonCardTitle>¿Dónde quieres jugar?</IonCardTitle></IonCardHeader>
        <IonCardContent><AppSelect label="Cancha" value={resourceId} placeholder="Selecciona una cancha" options={(resources.data?.data ?? []).map(resource => ({ value: resource.id, label: `${resource.name} · ${resource.venue.name}` }))} onIonChange={event => { setResourceId(normalizeResourceId(event.detail.value)); setSelectedSlot(''); }} /></IonCardContent>
      </IonCard>

      {selectedResource && <IonCard className="booking-summary"><IonCardContent>
        <IonText><strong>{formatUsd(selectedResource.hourlyPrice)} por hora</strong><br />{selectedResource.address}</IonText>
        <AppButton fill="clear" size="small" href={directionsUrl(selectedResource)} target="_blank" rel="noreferrer">Cómo llegar</AppButton>
      </IonCardContent></IonCard>}

      {resourceId && <IonCard className="booking-step">
        <IonCardHeader><IonCardSubtitle>Paso 2 de 3</IonCardSubtitle><IonCardTitle>¿Qué día?</IonCardTitle></IonCardHeader>
        <IonCardContent><IonInput className="app-input" fill="outline" label="Fecha" labelPlacement="stacked" type="date" min={today} value={date} onIonInput={event => { setDate(String(event.detail.value ?? today)); setSelectedSlot(''); }} /></IonCardContent>
      </IonCard>}

      {resourceId && <IonCard className="booking-step">
        <IonCardHeader><IonCardSubtitle>Paso 3 de 3</IonCardSubtitle><IonCardTitle>Elige una hora</IonCardTitle></IonCardHeader>
        <IonCardContent>{slotsContent()}</IonCardContent>
      </IonCard>}

      {selectedSlotData && selectedResource && (() => {
        const hasDiscount = Number(selectedSlotData.effectiveHourlyPrice) < Number(selectedResource.hourlyPrice);
        const durationHours = (new Date(selectedSlotData.endsAt).getTime() - new Date(selectedSlotData.startsAt).getTime()) / 3_600_000;
        const total = Number(selectedSlotData.effectiveHourlyPrice) * durationHours;
        return (
          <IonCard className="booking-summary">
            <IonCardContent>
              <IonText>
                {hasDiscount && (
                  <p className="booking-summary__discounted-price">
                    <s>{formatUsd(selectedResource.hourlyPrice)} por hora</s> {formatUsd(selectedSlotData.effectiveHourlyPrice)} por hora · Descuento aplicado
                  </p>
                )}
                <strong>Total: {formatUsd(total)}</strong>
                <br />
                {new Date(`${date}T12:00:00`).toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' })}
              </IonText>
            </IonCardContent>
          </IonCard>
        );
      })()}
      <AppButton expand="block" disabled={!selectedSlot} isLoading={booking.isPending} onClick={() => void confirm()}>Confirmar reserva</AppButton>
      <AppInteractionAlert isOpen={Boolean(message)} kind={message?.startsWith('Reserva confirmada') ? 'success' : 'error'} message={message ?? ''} onDismiss={() => setMessage(null)} />
    </section>
  );
};

export default CourtsPage;
