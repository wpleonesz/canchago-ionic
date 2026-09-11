import { useState } from 'react';
import { IonBadge, IonItem, IonLabel, IonList, IonSelect, IonSelectOption, IonToggle } from '@ionic/react';
import AppButton from '../../../components/common/AppButton';
import AppDataList from '../../../components/common/AppDataList';
import AppInteractionAlert from '../../../components/feedback/AppInteractionAlert';
import { useOrganizations } from '../../organizations/hooks/useOrganizations';
import { useVenues } from '../../organizations/hooks/useVenues';
import { useAvailability, useCreateResource, useCreateSlot, useResources, useUpdateSlot } from '../hooks/useBookings';

const AvailabilityManagementPage: React.FC = () => {
  const resources = useResources();
  const [resourceId, setResourceId] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [venueId, setVenueId] = useState('');
  const [resourceName, setResourceName] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [publish, setPublish] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const mutation = useCreateSlot(resourceId);
  const organizations = useOrganizations({ page: 1, pageSize: 100 });
  const venues = useVenues(organizationId, { page: 1, pageSize: 100 });
  const resourceMutation = useCreateResource(organizationId, venueId);
  const updateMutation = useUpdateSlot(resourceId);
  const from = new Date();
  const to = new Date(from);
  to.setDate(to.getDate() + 31);
  const slots = useAvailability(resourceId, { from: from.toISOString(), to: to.toISOString(), includeAll: 'true' });
  const submit = async (): Promise<void> => {
    try {
      await mutation.mutateAsync({
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        publish,
      });
      setMessage('Horario guardado correctamente.');
    } catch {
      setMessage('No se pudo guardar. Verifica el horario, los solapamientos y tu alcance.');
    }
  };
  const saveResource = async (): Promise<void> => {
    try {
      const resource = await resourceMutation.mutateAsync({ name: resourceName });
      setResourceId(resource.id);
      setResourceName('');
      setMessage('Cancha creada correctamente.');
    } catch {
      setMessage('No se pudo crear la cancha. Verifica tu organización, sede y alcance.');
    }
  };
  const changeStatus = async (
    slotId: string,
    expectedUpdatedAt: string,
    status: 'PUBLISHED' | 'WITHDRAWN',
  ): Promise<void> => {
    try {
      await updateMutation.mutateAsync({ slotId, body: { status, expectedUpdatedAt } });
      setMessage(status === 'PUBLISHED' ? 'Horario publicado correctamente.' : 'Horario retirado correctamente.');
    } catch {
      setMessage('No se pudo cambiar el horario. Actualiza la lista y verifica que no esté reservado.');
    }
  };
  return (
    <section className="booking-page">
      <h1>Administrar disponibilidad</h1>
      <h2>Crear cancha</h2>
      <IonList>
        <IonItem>
          <IonSelect label="Organización" value={organizationId} onIonChange={event => { setOrganizationId(String(event.detail.value)); setVenueId(''); }}>
            {organizations.data?.data.map(organization => <IonSelectOption key={organization.id} value={organization.id}>{organization.name}</IonSelectOption>)}
          </IonSelect>
        </IonItem>
        <IonItem>
          <IonSelect label="Sede" value={venueId} disabled={!organizationId} onIonChange={event => setVenueId(String(event.detail.value))}>
            {venues.data?.data.map(venue => <IonSelectOption key={venue.id} value={venue.id}>{venue.name}</IonSelectOption>)}
          </IonSelect>
        </IonItem>
        <IonItem><label>Nombre <input value={resourceName} onChange={event => setResourceName(event.target.value)} /></label></IonItem>
      </IonList>
      <AppButton expand="block" disabled={!venueId || !resourceName.trim()} isLoading={resourceMutation.isPending} onClick={() => void saveResource()}>
        Crear cancha
      </AppButton>
      <h2>Crear horario</h2>
      <IonList>
        <IonItem>
          <IonSelect label="Cancha" value={resourceId} onIonChange={event => setResourceId(String(event.detail.value))}>
            {resources.data?.data.map(resource => (
              <IonSelectOption key={resource.id} value={resource.id}>
                {resource.name}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>
        <IonItem>
          <label>
            Inicio <input type="datetime-local" value={startsAt} onChange={event => setStartsAt(event.target.value)} />
          </label>
        </IonItem>
        <IonItem>
          <label>
            Fin <input type="datetime-local" value={endsAt} onChange={event => setEndsAt(event.target.value)} />
          </label>
        </IonItem>
        <IonItem>
          <IonToggle checked={publish} onIonChange={event => setPublish(event.detail.checked)}>
            Publicar inmediatamente
          </IonToggle>
        </IonItem>
      </IonList>
      <AppButton
        expand="block"
        disabled={!resourceId || !startsAt || !endsAt}
        isLoading={mutation.isPending}
        onClick={() => void submit()}
      >
        Guardar horario
      </AppButton>
      {resourceId && (
        <>
          <h2>Próximos horarios</h2>
          <AppDataList
            items={slots.data?.data ?? []}
            keyExtractor={slot => slot.id}
            renderItem={slot => (
              <IonItem>
                <IonLabel>
                  {new Date(slot.startsAt).toLocaleString('es-EC')} –{' '}
                  {new Date(slot.endsAt).toLocaleTimeString('es-EC')}
                </IonLabel>
                <IonBadge
                  slot="end"
                  color={slot.isBooked ? 'warning' : slot.status === 'PUBLISHED' ? 'success' : 'medium'}
                >
                  {slot.isBooked
                    ? 'Ocupada'
                    : slot.status === 'PUBLISHED'
                      ? 'Libre'
                      : slot.status === 'DRAFT'
                        ? 'Borrador'
                        : 'Retirada'}
                </IonBadge>
                {!slot.isBooked && slot.status === 'DRAFT' && (
                  <AppButton slot="end" fill="clear" onClick={() => void changeStatus(slot.id, slot.updatedAt, 'PUBLISHED')}>
                    Publicar
                  </AppButton>
                )}
                {!slot.isBooked && slot.status !== 'WITHDRAWN' && (
                  <AppButton slot="end" fill="clear" color="danger" onClick={() => void changeStatus(slot.id, slot.updatedAt, 'WITHDRAWN')}>
                    Retirar
                  </AppButton>
                )}
              </IonItem>
            )}
            isLoading={slots.isLoading}
            isError={slots.isError}
            onRetry={() => void slots.refetch()}
            emptyTitle="No hay horarios creados"
          />
        </>
      )}
      <AppInteractionAlert
        isOpen={Boolean(message)}
        kind={message?.startsWith('Horario guardado') ? 'success' : 'error'}
        message={message ?? ''}
        onDismiss={() => setMessage(null)}
      />
    </section>
  );
};
export default AvailabilityManagementPage;
