import { useRef, useState } from 'react';
import { Prompt, useHistory, useParams } from 'react-router-dom';
import AppButton from '../../../components/common/AppButton';
import AppConfirmDialog from '../../../components/feedback/AppConfirmDialog';
import AppErrorState from '../../../components/feedback/AppErrorState';
import AppSkeleton from '../../../components/feedback/AppSkeleton';
import { AppClientError, BusinessRuleError } from '../../../services/api/errorMapper';
import type { VenueFormValues } from '../../../validation/organizaciones';
import VenueForm from '../components/VenueForm';
import { useCreateVenue, useUpdateVenue, useVenue } from '../hooks/useVenues';
import '../organizations.css';

interface VenueFormPageProps {
  mode: 'create' | 'edit';
}

// organizationId y venueId viajan siempre por la ruta (useParams) — nunca por query string ni
// como campo del formulario, coherente con que el backend tampoco acepta organizationId en el
// body de sede (ver spec 010).
const VenueFormPage: React.FC<VenueFormPageProps> = ({ mode }) => {
  const { organizationId, venueId = '' } = useParams<{ organizationId: string; venueId?: string }>();
  const history = useHistory();
  const venueQuery = useVenue(organizationId, mode === 'edit' ? venueId : '');
  const createMutation = useCreateVenue(organizationId);
  const updateMutation = useUpdateVenue(organizationId, venueId);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const allowNavigationRef = useRef(false);

  const goBack = (): void => {
    allowNavigationRef.current = true;
    history.push(`/admin/organizations/${organizationId}`);
  };

  const cancel = (): void => {
    if (hasUnsavedChanges) setShowCancelConfirmation(true);
    else goBack();
  };

  if (mode === 'edit' && venueQuery.isLoading) return <AppSkeleton rows={6} />;
  if (mode === 'edit' && (venueQuery.isError || !venueQuery.data)) {
    return <AppErrorState message="No se pudo cargar la sede." onRetry={() => void venueQuery.refetch()} />;
  }

  const defaultValues: VenueFormValues | undefined = venueQuery.data
    ? {
        name: venueQuery.data.name,
        address: venueQuery.data.address ?? '',
        phone: venueQuery.data.phone ?? '',
        email: venueQuery.data.email ?? '',
      }
    : undefined;

  const submit = async (values: VenueFormValues): Promise<boolean> => {
    setSubmitError(null);
    try {
      await (mode === 'create'
        ? createMutation.mutateAsync({
            name: values.name,
            address: values.address || undefined,
            phone: values.phone || undefined,
            email: values.email || undefined,
          })
        : updateMutation.mutateAsync({
            name: values.name,
            address: values.address || undefined,
            phone: values.phone || undefined,
            email: values.email || undefined,
            expectedUpdatedAt: venueQuery.data?.updatedAt ?? '',
          }));

      allowNavigationRef.current = true;
      history.replace(`/admin/organizations/${organizationId}`);
      return true;
    } catch (error) {
      if (error instanceof BusinessRuleError) {
        setSubmitError(
          'Ya existe una sede con ese nombre en esta organización, o la sede cambió. Recarga antes de guardar.',
        );
        return false;
      }
      setSubmitError(error instanceof AppClientError ? error.message : 'No se pudo guardar la sede.');
      return false;
    }
  };

  return (
    <section className="venue-form-page" aria-labelledby="venue-form-title">
      <header className="organizations-page-header">
        <div>
          <p className="organizations-page-header__eyebrow">Administración de sedes</p>
          <h1 id="venue-form-title">{mode === 'create' ? 'Nueva sede' : 'Editar sede'}</h1>
        </div>
        <AppButton fill="clear" onClick={cancel}>
          Volver
        </AppButton>
      </header>

      <VenueForm
        mode={mode}
        defaultValues={defaultValues}
        submitError={submitError}
        onSubmit={submit}
        onCancel={cancel}
        onDirtyChange={setHasUnsavedChanges}
      />

      {submitError && updateMutation.error instanceof BusinessRuleError && (
        <AppButton fill="outline" onClick={() => void venueQuery.refetch()}>
          Recargar datos actuales
        </AppButton>
      )}

      <Prompt
        when={hasUnsavedChanges}
        message={() => allowNavigationRef.current || 'Tienes cambios sin guardar. Si sales, se perderán.'}
      />
      <AppConfirmDialog
        isOpen={showCancelConfirmation}
        header="Descartar cambios"
        message="Tienes cambios sin guardar. ¿Quieres salir y descartarlos?"
        confirmText="Descartar"
        isDestructive
        onConfirm={() => {
          setShowCancelConfirmation(false);
          goBack();
        }}
        onCancel={() => setShowCancelConfirmation(false)}
      />
    </section>
  );
};

export default VenueFormPage;
