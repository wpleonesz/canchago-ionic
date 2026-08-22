import { useOrganizations } from '../../organizations/hooks/useOrganizations';
import AppSelect from '../../../components/forms/AppSelect';

interface OrganizationPickerProps {
  value: string | undefined;
  onChange: (organizationId: string) => void;
  error?: string;
}

// Único catálogo real disponible para resolver organizationId (GET /api/organizaciones) — no
// hay endpoint "mis organizaciones", así que siempre se lista el catálogo completo sin
// preselección (ver spec 005 "Riesgos").
const OrganizationPicker: React.FC<OrganizationPickerProps> = ({ value, onChange, error }) => {
  const { data, isLoading, isError } = useOrganizations();

  const options = (data?.data ?? []).map(organization => ({
    value: organization.id,
    label: organization.name,
  }));

  return (
    <AppSelect
      label="Organización"
      placeholder={isLoading ? 'Cargando organizaciones…' : 'Selecciona una organización'}
      options={options}
      value={value}
      disabled={isLoading || isError}
      error={error ?? (isError ? 'No se pudieron cargar las organizaciones.' : undefined)}
      onIonChange={event => onChange(event.detail.value as string)}
    />
  );
};

export default OrganizationPicker;
