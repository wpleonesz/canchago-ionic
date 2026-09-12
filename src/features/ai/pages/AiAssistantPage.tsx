import { useState } from 'react';
import { IonItem, IonLabel, IonList, IonSegment, IonSegmentButton, IonText } from '@ionic/react';
import { useHistory } from 'react-router-dom';

import AppButton from '../../../components/common/AppButton';
import AppEmptyState from '../../../components/feedback/AppEmptyState';
import AppErrorState from '../../../components/feedback/AppErrorState';
import AppSkeleton from '../../../components/feedback/AppSkeleton';
import AppInput from '../../../components/forms/AppInput';
import AppSelect from '../../../components/forms/AppSelect';
import { useSessionStore } from '../../../store/sessionStore';
import type { SlotRecommendationsRequest } from '../../../types/api/ai';
import { aiRecommendationFormSchema } from '../../../validation/ai';
import { useAiSlotRecommendations, useAiUpcomingBookingsSummary } from '../hooks/useAiAssistant';
import '../ai-assistant.css';

type Mode = 'recommendations' | 'summary';

const localDate = (offsetDays: number): string => {
  const value = new Date();
  value.setDate(value.getDate() + offsetDays);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
};

const AiAssistantPage: React.FC = () => {
  const history = useHistory();
  const permissions = useSessionStore(state => state.user?.permissions ?? []);
  const permissionCodes = new Set(permissions.map(permission => permission.code));
  const canRecommend = permissionCodes.has('resources.read') && permissionCodes.has('availability.read');
  const canSummarize = permissionCodes.has('bookings.read.own');
  const [mode, setMode] = useState<Mode>(canRecommend ? 'recommendations' : 'summary');
  const [fromDate, setFromDate] = useState(localDate(1));
  const [toDate, setToDate] = useState(localDate(1));
  const [preferredTimeOfDay, setPreferredTimeOfDay] = useState('');
  const [maxHourlyPrice, setMaxHourlyPrice] = useState('');
  const [formError, setFormError] = useState('');
  const recommendations = useAiSlotRecommendations();
  const summary = useAiUpcomingBookingsSummary();

  const submitRecommendations = async (): Promise<void> => {
    if (recommendations.isPending) return;
    const parsed = aiRecommendationFormSchema.safeParse({ fromDate, toDate, preferredTimeOfDay, maxHourlyPrice });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Revisa tus preferencias.');
      return;
    }
    setFormError('');
    const body: SlotRecommendationsRequest = {
      from: new Date(`${fromDate}T00:00:00`).toISOString(),
      to: new Date(`${toDate}T23:59:59`).toISOString(),
      ...(preferredTimeOfDay ? { preferredTimeOfDay: preferredTimeOfDay as 'MORNING' | 'AFTERNOON' | 'EVENING' } : {}),
      ...(maxHourlyPrice ? { maxHourlyPrice: Number(maxHourlyPrice) } : {}),
    };
    await recommendations.mutateAsync(body).catch(() => undefined);
  };

  const showRecommendation = (resourceId: string, slotId: string, startsAt: string): void => {
    const date = new Date(startsAt).toLocaleDateString('en-CA');
    history.push(`/admin/courts?resourceId=${encodeURIComponent(resourceId)}&slotId=${encodeURIComponent(slotId)}&date=${date}`);
  };

  const recommendationResult = (): React.ReactNode => {
    if (recommendations.isPending) return <AppSkeleton />;
    if (recommendations.isError)
      return <AppErrorState message="El asistente no está disponible. El resto de CanchaGO sigue funcionando." onRetry={() => void submitRecommendations()} />;
    if (!recommendations.data) return null;
    if (!recommendations.data.recommendations.length)
      return <AppEmptyState title="No encontramos opciones" description="Prueba otro rango, horario o precio." />;
    return (
      <section className="ai-result" aria-live="polite">
        <p className="ai-result__label">Respuesta generada por IA</p>
        <p>{recommendations.data.explanation}</p>
        <IonList>
          {recommendations.data.recommendations.map(item => (
            <IonItem key={item.availabilitySlotId} lines="full">
              <IonLabel className="ion-text-wrap">
                <h2>{item.resourceName} · {item.venueName}</h2>
                <p>{new Date(item.startsAt).toLocaleString('es-EC')} · ${item.hourlyPrice}/hora</p>
                <p>{item.address}</p>
                <p>{item.reason}</p>
                <AppButton fill="outline" size="small" onClick={() => showRecommendation(item.resourceId, item.availabilitySlotId, item.startsAt)}>
                  Ver y reservar
                </AppButton>
              </IonLabel>
            </IonItem>
          ))}
        </IonList>
        <small>Verifica la disponibilidad al confirmar. La IA no realiza reservas.</small>
      </section>
    );
  };

  const summaryResult = (): React.ReactNode => {
    if (summary.isPending) return <AppSkeleton />;
    if (summary.isError)
      return <AppErrorState message="No pudimos generar el resumen. Tus reservas siguen disponibles en Mis reservas." onRetry={() => summary.mutate({ horizonDays: 7 })} />;
    if (!summary.data) return null;
    if (!summary.data.bookingsCount)
      return <AppEmptyState title="No tienes reservas próximas" description="No hay nada que resumir durante los próximos 7 días." />;
    return (
      <section className="ai-result" aria-live="polite">
        <p className="ai-result__label">Respuesta generada por IA</p>
        <p>{summary.data.summary}</p>
        <small>{summary.data.bookingsCount} reservas consideradas. Consulta Mis reservas como fuente de verdad.</small>
      </section>
    );
  };

  return (
    <section className="booking-page ai-assistant">
      <IonText className="booking-page__intro">
        <h1>Asistente IA</h1>
        <p>Explora opciones reales de CanchaGO con ayuda de un modelo de lenguaje.</p>
      </IonText>
      <IonSegment value={mode} onIonChange={event => setMode(event.detail.value as Mode)}>
        {canRecommend && <IonSegmentButton value="recommendations"><IonLabel>Recomendar horario</IonLabel></IonSegmentButton>}
        {canSummarize && <IonSegmentButton value="summary"><IonLabel>Mis reservas</IonLabel></IonSegmentButton>}
      </IonSegment>

      {mode === 'recommendations' && canRecommend && (
        <section className="ai-form" aria-label="Preferencias de recomendación">
          <AppInput label="Desde" type="date" min={localDate(1)} value={fromDate} onIonInput={event => setFromDate(String(event.detail.value ?? ''))} />
          <AppInput label="Hasta" type="date" min={fromDate} value={toDate} onIonInput={event => setToDate(String(event.detail.value ?? ''))} />
          <AppSelect label="Momento del día (opcional)" value={preferredTimeOfDay} options={[
            { value: '', label: 'Cualquier horario' },
            { value: 'MORNING', label: 'Mañana' },
            { value: 'AFTERNOON', label: 'Tarde' },
            { value: 'EVENING', label: 'Noche' },
          ]} onIonChange={event => setPreferredTimeOfDay(String(event.detail.value ?? ''))} />
          <AppInput label="Precio máximo por hora (opcional)" type="number" min="0" value={maxHourlyPrice} onIonInput={event => setMaxHourlyPrice(String(event.detail.value ?? ''))} />
          {formError && <p role="alert" className="ai-form__error">{formError}</p>}
          <AppButton expand="block" isLoading={recommendations.isPending} disabled={recommendations.isPending} onClick={() => void submitRecommendations()}>
            Buscar recomendaciones
          </AppButton>
          {recommendationResult()}
        </section>
      )}

      {mode === 'summary' && canSummarize && (
        <section className="ai-form" aria-label="Resumen de reservas">
          <p>Genera una explicación breve de tus reservas confirmadas durante los próximos 7 días.</p>
          <AppButton expand="block" isLoading={summary.isPending} disabled={summary.isPending} onClick={() => summary.mutate({ horizonDays: 7 })}>
            Resumir mis reservas
          </AppButton>
          {summaryResult()}
        </section>
      )}
    </section>
  );
};

export default AiAssistantPage;
