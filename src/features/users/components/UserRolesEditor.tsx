import { useRoles } from '../../roles/hooks/useRoles';
import AppSelect from '../../../components/forms/AppSelect';

interface UserRolesEditorProps {
  organizationId: string | undefined;
  value: string[];
  onChange: (roleIds: string[]) => void;
  excludeRoleIds?: string[];
  error?: string;
}

// El catálogo de roles viene exclusivamente de GET /api/roles?organizationId=... — nunca
// hardcodeado (criterio de aceptación de la feature 005). Los roles globales (Administrador,
// Futbolista) nunca aparecen aquí porque el backend no los expone por esta vía (ver spec 005,
// "Quiebres reales encontrados" — no es una limitación de este componente).
// excludeRoleIds filtra los roles que el usuario ya tiene asignados: mitiga que
// POST /api/users/:userId/roles no controle duplicados en el backend (ver spec 005 "Riesgos").
const UserRolesEditor: React.FC<UserRolesEditorProps> = ({
  organizationId,
  value,
  onChange,
  excludeRoleIds = [],
  error,
}) => {
  const { data, isLoading, isError } = useRoles(organizationId);

  const options = (data?.data ?? [])
    .filter(role => !excludeRoleIds.includes(role.id))
    .map(role => ({ value: role.id, label: role.name }));

  return (
    <AppSelect
      label="Roles"
      multiple
      placeholder={
        !organizationId
          ? 'Selecciona primero una organización'
          : isLoading
            ? 'Cargando roles…'
            : options.length === 0
              ? 'No hay roles disponibles para asignar'
              : 'Selecciona roles (opcional)'
      }
      options={options}
      value={value}
      disabled={!organizationId || isLoading || isError}
      error={error ?? (isError ? 'No se pudieron cargar los roles de esta organización.' : undefined)}
      onIonChange={event => onChange((event.detail.value as string[]) ?? [])}
    />
  );
};

export default UserRolesEditor;
