import { useState } from 'react';
import AppDataList from '../../../components/common/AppDataList';
import AppSearchInput from '../../../components/forms/AppSearchInput';
import PermissionListItem from '../components/PermissionListItem';
import { usePermissionsCatalog } from '../hooks/useRoles';
import '../roles.css';

const PermissionsListPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const permissionsQuery = usePermissionsCatalog({ page, pageSize: 50, search: search || undefined });

  return (
    <section className="permissions-list-page" aria-labelledby="permissions-list-title">
      <header className="roles-page-header">
        <div>
          <p className="roles-page-header__eyebrow">Usuarios y acceso</p>
          <h1 id="permissions-list-title">Permisos</h1>
          <p>Catálogo global de capacidades del sistema. Es de solo lectura: se administra desde el backend.</p>
        </div>
      </header>

      <div className="permissions-list-page__toolbar">
        <AppSearchInput
          placeholder="Buscar por código, módulo o descripción"
          onSearch={value => {
            setSearch(value);
            setPage(1);
          }}
        />
      </div>

      <AppDataList
        items={permissionsQuery.data?.data ?? []}
        keyExtractor={permission => permission.id}
        renderItem={permission => <PermissionListItem permission={permission} />}
        isLoading={permissionsQuery.isLoading}
        isError={permissionsQuery.isError}
        errorMessage="No se pudo cargar el catálogo de permisos."
        onRetry={() => void permissionsQuery.refetch()}
        emptyTitle="No hay permisos que coincidan con tu búsqueda"
        emptyDescription={search ? 'Prueba con otro término de búsqueda.' : 'Aún no hay permisos sembrados en el sistema.'}
        meta={permissionsQuery.data?.meta}
        onPageChange={setPage}
      />
    </section>
  );
};

export default PermissionsListPage;
