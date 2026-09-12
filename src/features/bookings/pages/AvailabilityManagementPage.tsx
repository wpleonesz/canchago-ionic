import { useEffect, useMemo, useState } from 'react';
import {
  IonAccordion,
  IonAccordionGroup,
  IonBadge,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonChip,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonNote,
  IonText,
  IonToggle,
} from '@ionic/react';
import { addOutline, calendarOutline, closeOutline, mapOutline, timeOutline } from 'ionicons/icons';
import AppButton from '../../../components/common/AppButton';
import AppDataList from '../../../components/common/AppDataList';
import AppInteractionAlert from '../../../components/feedback/AppInteractionAlert';
import AppSelect from '../../../components/forms/AppSelect';
import LocationPickerModal from '../../../components/maps/LocationPickerModal';
import { normalizeResourceId } from '../../../validation/resource-id';
import { useOrganizations } from '../../organizations/hooks/useOrganizations';
import { useVenues } from '../../organizations/hooks/useVenues';
import WeekdayDiscountEditor from '../components/WeekdayDiscountEditor';
import {
  useAvailability,
  useCreateMonthlySchedule,
  useCreateResource,
  useResources,
  useUpdateResource,
  useUpdateScheduleDay,
} from '../hooks/useBookings';
import { blocksOverlap, buildMonthlySlots, WEEKDAYS, type TimeBlock } from '../utils/monthly-schedule';

const currentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const AvailabilityManagementPage: React.FC = () => {
  const resources = useResources(1, true);
  const [resourceId, setResourceId] = useState('');
  const [month, setMonth] = useState(currentMonth());
  const [weekdays, setWeekdays] = useState([1, 2, 3, 4, 5]);
  const [blocks, setBlocks] = useState<TimeBlock[]>([{ id: crypto.randomUUID(), startsAt: '08:00', endsAt: '09:00' }]);
  const [publish, setPublish] = useState(true);
  const [organizationId, setOrganizationId] = useState('');
  const [venueId, setVenueId] = useState('');
  const [resourceName, setResourceName] = useState('');
  const [resourceAddress, setResourceAddress] = useState('');
  const [resourcePrice, setResourcePrice] = useState('');
  const [resourceLatitude, setResourceLatitude] = useState('');
  const [resourceLongitude, setResourceLongitude] = useState('');
  const [resourceStatus, setResourceStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [schedulePage, setSchedulePage] = useState(1);
  const organizations = useOrganizations({ page: 1, pageSize: 100, status: 'ACTIVE', hasActiveVenues: 'true' });
  const venues = useVenues(organizationId, { page: 1, pageSize: 100, status: 'ACTIVE' });
  const resourceMutation = useCreateResource(organizationId, venueId);
  const updateResourceMutation = useUpdateResource(resourceId);
  const scheduleMutation = useCreateMonthlySchedule(resourceId);
  const updateDayMutation = useUpdateScheduleDay(resourceId);
  const selectedResource = resources.data?.data.find(resource => resource.id === resourceId);
  const concreteSlots = useMemo(() => buildMonthlySlots(month, weekdays, blocks), [month, weekdays, blocks]);
  const invalidBlocks =
    blocks.some(block => !block.startsAt || !block.endsAt || block.startsAt >= block.endsAt) || blocksOverlap(blocks);
  const monthStart = month ? new Date(`${month}-01T00:00:00`) : new Date();
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
  const slots = useAvailability(resourceId, {
    from: monthStart.toISOString(),
    to: monthEnd.toISOString(),
    page: schedulePage,
    pageSize: 50,
    includeAll: 'true',
  });
  const groupedSlots = (() => {
    const groups = new Map<string, NonNullable<typeof slots.data>['data']>();
    for (const slot of slots.data?.data ?? []) {
      const key = new Date(slot.startsAt).toLocaleDateString('en-CA');
      groups.set(key, [...(groups.get(key) ?? []), slot]);
    }
    return [...groups.entries()].map(([date, daySlots]) => ({ date, slots: daySlots }));
  })();

  useEffect(() => {
    if (!selectedResource) return;
    setResourceAddress(selectedResource.address);
    setResourcePrice(selectedResource.hourlyPrice);
    setResourceLatitude(selectedResource.latitude ?? '');
    setResourceLongitude(selectedResource.longitude ?? '');
    setResourceStatus(selectedResource.status);
  }, [selectedResource]);

  const applyPickedLocation = (coordinates: { latitude: number; longitude: number }): void => {
    setResourceLatitude(String(coordinates.latitude));
    setResourceLongitude(String(coordinates.longitude));
    setShowLocationPicker(false);
  };

  const toggleDay = (day: number): void =>
    setWeekdays(current => (current.includes(day) ? current.filter(item => item !== day) : [...current, day]));
  const updateBlock = (id: string, field: 'startsAt' | 'endsAt', value: string): void =>
    setBlocks(current => current.map(block => (block.id === id ? { ...block, [field]: value } : block)));

  const saveMonth = async (): Promise<void> => {
    try {
      const created = await scheduleMutation.mutateAsync({ slots: concreteSlots, publish });
      setMessage(`${created} horarios guardados para el mes.`);
    } catch {
      setMessage('No se guardó el mes. Revisa que los horarios no se crucen con otros existentes.');
    }
  };

  const saveResource = async (): Promise<void> => {
    try {
      const resource = await resourceMutation.mutateAsync({
        name: resourceName.trim(),
        address: resourceAddress.trim(),
        hourlyPrice: Number(resourcePrice),
        latitude: resourceLatitude ? Number(resourceLatitude) : undefined,
        longitude: resourceLongitude ? Number(resourceLongitude) : undefined,
      });
      setResourceId(resource.id);
      setResourceName('');
      setMessage('Cancha creada. Ya puedes programar su mes.');
    } catch {
      setMessage('No se pudo crear la cancha. Revisa la organización y la sede.');
    }
  };

  const saveResourceDetails = async (): Promise<void> => {
    if (!selectedResource) return;
    try {
      await updateResourceMutation.mutateAsync({
        address: resourceAddress.trim(),
        hourlyPrice: Number(resourcePrice),
        latitude: resourceLatitude ? Number(resourceLatitude) : undefined,
        longitude: resourceLongitude ? Number(resourceLongitude) : undefined,
        status: resourceStatus,
        expectedUpdatedAt: selectedResource.updatedAt,
      });
      setMessage('Datos y estado de la cancha actualizados.');
    } catch {
      setMessage('No se pudo actualizar la cancha. Recarga e intenta nuevamente.');
    }
  };

  const changeDayStatus = async (
    daySlots: NonNullable<typeof slots.data>['data'],
    status: 'PUBLISHED' | 'WITHDRAWN',
  ): Promise<void> => {
    try {
      await updateDayMutation.mutateAsync({
        status,
        slots: daySlots.map(slot => ({ id: slot.id, expectedUpdatedAt: slot.updatedAt })),
      });
      setMessage(status === 'WITHDRAWN' ? 'Jornada cerrada.' : 'Jornada abierta nuevamente.');
    } catch {
      setMessage('No se pudo cambiar el horario. Si está reservado, debe mantenerse abierto.');
    }
  };

  return (
    <section className="booking-page booking-schedule">
      <IonText className="booking-page__intro">
        <h1>Programa tu mes</h1>
        <p>Elige los días y horas en que atiendes. Puedes cambiar cada horario después.</p>
      </IonText>

      <IonCard className="booking-step">
        <IonCardHeader>
          <IonCardSubtitle>Paso 1 de 3</IonCardSubtitle>
          <IonCardTitle>Cancha y mes</IonCardTitle>
        </IonCardHeader>
        <IonCardContent className="booking-stack">
          <AppSelect
            label="Cancha"
            value={resourceId}
            placeholder="Selecciona una cancha"
            options={(resources.data?.data ?? []).map(resource => ({
              value: resource.id,
              label: `${resource.name} · ${resource.venue.name}${resource.status === 'INACTIVE' ? ' (Dada de baja)' : ''}`,
            }))}
            onIonChange={event => {
              setResourceId(normalizeResourceId(event.detail.value));
              setSchedulePage(1);
            }}
          />
          <IonInput
            className="app-input"
            fill="outline"
            label="Mes"
            labelPlacement="stacked"
            type="month"
            min={currentMonth()}
            value={month}
            onIonInput={event => {
              setMonth(String(event.detail.value ?? ''));
              setSchedulePage(1);
            }}
          />
        </IonCardContent>
      </IonCard>

      <IonCard className="booking-step">
        <IonCardHeader>
          <IonCardSubtitle>Paso 2 de 3</IonCardSubtitle>
          <IonCardTitle>Días que atiendes</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div className="booking-day-picker" role="group" aria-label="Días de atención">
            {WEEKDAYS.map(day => (
              <IonChip
                key={day.value}
                color={weekdays.includes(day.value) ? 'primary' : 'medium'}
                outline={!weekdays.includes(day.value)}
                onClick={() => toggleDay(day.value)}
              >
                <IonLabel>{day.short}</IonLabel>
              </IonChip>
            ))}
          </div>
          <IonNote>
            {weekdays.length ? `${weekdays.length} días seleccionados por semana` : 'Selecciona al menos un día'}
          </IonNote>
        </IonCardContent>
      </IonCard>

      <IonCard className="booking-step">
        <IonCardHeader>
          <IonCardSubtitle>Paso 3 de 3</IonCardSubtitle>
          <IonCardTitle>Horarios</IonCardTitle>
        </IonCardHeader>
        <IonCardContent className="booking-stack">
          {blocks.map((block, index) => (
            <IonItem key={block.id} className="booking-time-block" lines="none">
              <IonIcon icon={timeOutline} slot="start" />
              <IonInput
                aria-label={`Inicio del bloque ${index + 1}`}
                type="time"
                value={block.startsAt}
                onIonInput={event => updateBlock(block.id, 'startsAt', String(event.detail.value ?? ''))}
              />
              <IonText>hasta</IonText>
              <IonInput
                aria-label={`Fin del bloque ${index + 1}`}
                type="time"
                value={block.endsAt}
                onIonInput={event => updateBlock(block.id, 'endsAt', String(event.detail.value ?? ''))}
              />
              {blocks.length > 1 && (
                <AppButton
                  aria-label={`Eliminar bloque ${index + 1}`}
                  fill="clear"
                  color="danger"
                  slot="end"
                  onClick={() => setBlocks(current => current.filter(item => item.id !== block.id))}
                >
                  <IonIcon icon={closeOutline} slot="icon-only" />
                </AppButton>
              )}
            </IonItem>
          ))}
          <AppButton
            fill="outline"
            onClick={() =>
              setBlocks(current => [...current, { id: crypto.randomUUID(), startsAt: '09:00', endsAt: '10:00' }])
            }
          >
            <IonIcon icon={addOutline} slot="start" />
            Añadir otro horario
          </AppButton>
          {invalidBlocks && (
            <IonNote color="danger">
              La hora inicial debe ser menor a la final y los horarios no pueden cruzarse.
            </IonNote>
          )}
          <IonItem lines="none">
            <IonToggle checked={publish} onIonChange={event => setPublish(event.detail.checked)}>
              Publicar al guardar
            </IonToggle>
          </IonItem>
        </IonCardContent>
      </IonCard>

      <IonCard className="booking-summary">
        <IonCardContent>
          <IonIcon icon={calendarOutline} />
          <IonText>
            <strong>{concreteSlots.length}</strong> horarios se crearán en {month || 'el mes elegido'}.
          </IonText>
        </IonCardContent>
      </IonCard>
      <AppButton
        expand="block"
        disabled={!resourceId || !month || weekdays.length === 0 || invalidBlocks || concreteSlots.length === 0}
        isLoading={scheduleMutation.isPending}
        onClick={() => void saveMonth()}
      >
        Guardar programación del mes
      </AppButton>

      {selectedResource && (
        <IonAccordionGroup className="booking-secondary">
          <IonAccordion value="court-details">
            <IonItem slot="header">
              <IonLabel>Ubicación, precio y estado de la cancha</IonLabel>
            </IonItem>
            <div slot="content" className="booking-stack booking-accordion-content">
              <IonInput
                className="app-input"
                fill="outline"
                label="Dirección"
                labelPlacement="stacked"
                value={resourceAddress}
                onIonInput={event => setResourceAddress(String(event.detail.value ?? ''))}
              />
              <IonInput
                className="app-input"
                fill="outline"
                label="Precio por hora (USD)"
                labelPlacement="stacked"
                type="number"
                min="0"
                step="0.01"
                value={resourcePrice}
                onIonInput={event => setResourcePrice(String(event.detail.value ?? ''))}
              />
              <IonInput
                className="app-input"
                fill="outline"
                label="Latitud (opcional)"
                labelPlacement="stacked"
                type="number"
                value={resourceLatitude}
                onIonInput={event => setResourceLatitude(String(event.detail.value ?? ''))}
              />
              <IonInput
                className="app-input"
                fill="outline"
                label="Longitud (opcional)"
                labelPlacement="stacked"
                type="number"
                value={resourceLongitude}
                onIonInput={event => setResourceLongitude(String(event.detail.value ?? ''))}
              />
              <AppButton fill="outline" onClick={() => setShowLocationPicker(true)}>
                <IonIcon icon={mapOutline} slot="start" />
                Elegir en el mapa
              </AppButton>
              <AppSelect
                label="Estado de la cancha"
                value={resourceStatus}
                options={[
                  { value: 'ACTIVE', label: 'Activa' },
                  { value: 'INACTIVE', label: 'Dada de baja (Inactiva)' },
                ]}
                onIonChange={event => setResourceStatus(event.detail.value as 'ACTIVE' | 'INACTIVE')}
              />
              <IonNote>Las canchas dadas de baja no aparecen en la búsqueda de reservas de los usuarios.</IonNote>
              <AppButton
                disabled={
                  !resourceAddress.trim() || !resourcePrice || Boolean(resourceLatitude) !== Boolean(resourceLongitude)
                }
                isLoading={updateResourceMutation.isPending}
                onClick={() => void saveResourceDetails()}
              >
                Guardar datos de la cancha
              </AppButton>
              <IonText>
                <h3>Descuentos por día de la semana</h3>
              </IonText>
              <WeekdayDiscountEditor resourceId={selectedResource.id} discounts={selectedResource.weekdayDiscounts} />
            </div>
          </IonAccordion>
        </IonAccordionGroup>
      )}

      <IonAccordionGroup className="booking-secondary">
        <IonAccordion value="new-court">
          <IonItem slot="header">
            <IonLabel>¿Aún no tienes una cancha?</IonLabel>
          </IonItem>
          <div slot="content" className="booking-stack booking-accordion-content">
            <AppSelect
              label="Organización"
              value={organizationId}
              options={(organizations.data?.data ?? [])
                .filter(item => item.status === 'ACTIVE' && (item.venuesCount === undefined || item.venuesCount > 0))
                .map(item => ({ value: item.id, label: item.name }))}
              onIonChange={event => {
                setOrganizationId(normalizeResourceId(event.detail.value));
                setVenueId('');
              }}
            />
            <AppSelect
              label="Sede"
              value={venueId}
              disabled={!organizationId}
              options={(venues.data?.data ?? [])
                .filter(item => item.status === 'ACTIVE')
                .map(item => ({ value: item.id, label: item.name }))}
              onIonChange={event => setVenueId(normalizeResourceId(event.detail.value))}
            />
            <IonInput
              className="app-input"
              fill="outline"
              label="Nombre de la cancha"
              labelPlacement="stacked"
              value={resourceName}
              onIonInput={event => setResourceName(String(event.detail.value ?? ''))}
            />
            <IonInput
              className="app-input"
              fill="outline"
              label="Dirección"
              labelPlacement="stacked"
              value={resourceAddress}
              onIonInput={event => setResourceAddress(String(event.detail.value ?? ''))}
            />
            <IonInput
              className="app-input"
              fill="outline"
              label="Precio por hora (USD)"
              labelPlacement="stacked"
              type="number"
              min="0"
              step="0.01"
              value={resourcePrice}
              onIonInput={event => setResourcePrice(String(event.detail.value ?? ''))}
            />
            <IonInput
              className="app-input"
              fill="outline"
              label="Latitud (opcional)"
              labelPlacement="stacked"
              type="number"
              value={resourceLatitude}
              onIonInput={event => setResourceLatitude(String(event.detail.value ?? ''))}
            />
            <IonInput
              className="app-input"
              fill="outline"
              label="Longitud (opcional)"
              labelPlacement="stacked"
              type="number"
              value={resourceLongitude}
              onIonInput={event => setResourceLongitude(String(event.detail.value ?? ''))}
            />
            <AppButton fill="outline" onClick={() => setShowLocationPicker(true)}>
              <IonIcon icon={mapOutline} slot="start" />
              Elegir en el mapa
            </AppButton>
            <AppButton
              disabled={
                !venueId ||
                !resourceName.trim() ||
                !resourceAddress.trim() ||
                !resourcePrice ||
                Boolean(resourceLatitude) !== Boolean(resourceLongitude)
              }
              isLoading={resourceMutation.isPending}
              onClick={() => void saveResource()}
            >
              Crear cancha
            </AppButton>
          </div>
        </IonAccordion>
      </IonAccordionGroup>

      {resourceId && (
        <section className="booking-existing">
          <IonText>
            <h2>Jornadas de {month}</h2>
            <p>Cierra o vuelve a abrir un día completo.</p>
          </IonText>
          <AppDataList
            items={groupedSlots}
            keyExtractor={group => group.date}
            renderItem={group => {
              const hasBooking = group.slots.some(slot => slot.isBooked);
              const isOpen = group.slots.some(slot => slot.status === 'PUBLISHED');
              return (
                <IonItem className="booking-slot-row">
                  <IonLabel>
                    <strong>
                      {new Date(`${group.date}T12:00:00`).toLocaleDateString('es-EC', {
                        weekday: 'long',
                        day: 'numeric',
                      })}
                    </strong>
                    <p>
                      {group.slots
                        .map(slot =>
                          new Date(slot.startsAt).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
                        )
                        .join(' · ')}
                    </p>
                  </IonLabel>
                  <IonBadge color={hasBooking ? 'warning' : isOpen ? 'success' : 'medium'}>
                    {hasBooking ? 'Con reservas' : isOpen ? 'Abierto' : 'Cerrado'}
                  </IonBadge>
                  <AppButton
                    fill="clear"
                    size="small"
                    disabled={hasBooking && isOpen}
                    isLoading={updateDayMutation.isPending}
                    onClick={() => void changeDayStatus(group.slots, isOpen ? 'WITHDRAWN' : 'PUBLISHED')}
                  >
                    {isOpen ? 'Cerrar día' : 'Abrir día'}
                  </AppButton>
                </IonItem>
              );
            }}
            isLoading={slots.isLoading}
            isError={slots.isError}
            onRetry={() => void slots.refetch()}
            emptyTitle="Este mes aún no tiene horarios"
            meta={slots.data?.meta}
            onPageChange={setSchedulePage}
          />
        </section>
      )}
      <AppInteractionAlert
        isOpen={Boolean(message)}
        kind={
          message?.includes('guardados') ||
          message?.includes('creada') ||
          message?.includes('abierto') ||
          message?.includes('cerrado')
            ? 'success'
            : 'error'
        }
        message={message ?? ''}
        onDismiss={() => setMessage(null)}
      />
      <LocationPickerModal
        isOpen={showLocationPicker}
        initialLatitude={resourceLatitude ? Number(resourceLatitude) : undefined}
        initialLongitude={resourceLongitude ? Number(resourceLongitude) : undefined}
        onConfirm={applyPickedLocation}
        onCancel={() => setShowLocationPicker(false)}
      />
    </section>
  );
};

export default AvailabilityManagementPage;
