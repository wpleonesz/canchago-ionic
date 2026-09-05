import { useRef, useState } from 'react';
import { Prompt, useHistory, useParams } from 'react-router-dom';
import AppButton from '../../../components/common/AppButton';
import AppConfirmDialog from '../../../components/feedback/AppConfirmDialog';
import AppErrorState from '../../../components/feedback/AppErrorState';
import AppSkeleton from '../../../components/feedback/AppSkeleton';
import { AppClientError, BusinessRuleError } from '../../../services/api/errorMapper';
import type { OrganizationFormValues } from '../../../validation/organizaciones';
import OrganizationForm from '../components/OrganizationForm';
import { useCreateOrganization, useOrganization, useUpdateOrganization } from '../hooks/useOrganizations';
import { getOrganizationStatusLabel } from '../organizationStatus';
import '../organizations.css';

interface OrganizationFormPageProps {
  mode: 'create' | 'edit';
}

const OrganizationFormPage: React.FC<OrganizationFormPageProps> = ({ mode }) => {
  const { organizationId = '' } = useParams<{ organizationId?: string }>();
  const history = useHistory();
  const organizationQuery = useOrganization(mode === 'edit' ? organizationId : '');
  const createMutation = useCreateOrganization();
  const updateMutation = useUpdateOrganization(organizationId);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const allowNavigationRef = useRef(false);

  const goBack = (): void => {
    allowNavigationRef.current = true;
    if (mode === 'edit' && organizationId) {
      history.push(`/admin/organizations/${organizationId}`);
      return;
    }
    history.push('/admin/organizations');
  };

  const cancel = (): void => {
    if (hasUnsavedChanges) setShowCancelConfirmation(true);
    else goBack();
  };

  if (mode === 'edit' && organizationQuery.isLoading) return <AppSkeleton rows={6} />;
  if (mode === 'edit' && (organizationQuery.isError || !organizationQuery.data)) {
    return (
      <AppErrorState message="No se pudo cargar la organización." onRetry={() => void organizationQuery.refetch()} />
    );
  }

  const defaultValues: OrganizationFormValues | undefined = organizationQuery.data
    ? {
        name: organizationQuery.data.name,
        legalName: organizationQuery.data.legalName ?? '',
        taxIdentification: organizationQuery.data.taxIdentification ?? '',
        email: organizationQuery.data.email ?? '',
        phone: organizationQuery.data.phone ?? '',
        domain: organizationQuery.data.domain ?? '',
      }
    : undefined;

  const submit = async (values: OrganizationFormValues): Promise<boolean> => {
    setSubmitError(null);
    try {
      const organization =
        mode === 'create'
          ? await createMutation.mutateAsync({
              name: values.name,
              legalName: values.legalName || undefined,
              taxIdentification: values.taxIdentification || undefined,
              email: values.email || undefined,
              phone: values.phone || undefined,
              domain: values.domain || undefined,
            })
          : await updateMutation.mutateAsync({
              name: values.name,
              legalName: values.legalName || undefined,
              taxIdentification: values.taxIdentification || undefined,
              email: values.email || undefined,
              phone: values.phone || undefined,
              domain: values.domain || undefined,
              expectedUpdatedAt: organizationQuery.data?.updatedAt ?? '',
            });

      allowNavigationRef.current = true;
      history.replace(`/admin/organizations/${organization.id}`);
      return true;
    } catch (error) {
      if (error instanceof BusinessRuleError) {
        setSubmitError('El nombre ya existe o la organización cambió. Recarga los datos antes de guardar.');
        return false;
      }
      setSubmitError(error instanceof AppClientError ? error.message : 'No se pudo guardar la organización.');
      return false;
    }
  };

  return (
    <section className="organization-form-page" aria-labelledby="organization-form-title">
      <header className="organizations-page-header">
        <div>
          <p className="organizations-page-header__eyebrow">Administración de organizaciones</p>
          <h1 id="organization-form-title">{mode === 'create' ? 'Nueva organización' : 'Editar organización'}</h1>
          {mode === 'edit' && organizationQuery.data && (
            <p>
              Estado actual: <strong>{getOrganizationStatusLabel(organizationQuery.data.status)}</strong> (no editable
              desde este formulario).
            </p>
          )}
        </div>
        <AppButton fill="clear" onClick={cancel}>
          Volver
        </AppButton>
      </header>

      <OrganizationForm
        mode={mode}
        defaultValues={defaultValues}
        submitError={submitError}
        onSubmit={submit}
        onCancel={cancel}
        onDirtyChange={setHasUnsavedChanges}
      />

      {submitError && updateMutation.error instanceof BusinessRuleError && (
        <AppButton fill="outline" onClick={() => void organizationQuery.refetch()}>
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

export default OrganizationFormPage;
