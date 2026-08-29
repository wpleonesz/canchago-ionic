import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import AppButton from '../../../components/common/AppButton';
import AppConfirmDialog from '../../../components/feedback/AppConfirmDialog';
import AppDataList from '../../../components/common/AppDataList';
import AccessRequestListItem from '../components/AccessRequestListItem';
import { useAccessRequests, useApproveAccessRequest, useRejectAccessRequest } from '../hooks/useAccessRequests';
import type { AccessRequestDto } from '../../../types/api/access-requests';
import '../access-requests.css';

const AccessRequestsPage: React.FC = () => {
  const history = useHistory();
  const [page, setPage] = useState(1);
  const [requestToApprove, setRequestToApprove] = useState<AccessRequestDto | null>(null);
  const [requestToReject, setRequestToReject] = useState<AccessRequestDto | null>(null);

  const { data, isLoading, isError, refetch } = useAccessRequests({
    page,
    pageSize: 20,
    status: 'PENDING',
  });

  const approveMutation = useApproveAccessRequest();
  const rejectMutation = useRejectAccessRequest();

  const handleConfirmApprove = (): void => {
    if (!requestToApprove) return;
    approveMutation.mutate(requestToApprove.id, {
      onSettled: () => setRequestToApprove(null),
    });
  };

  const handleConfirmReject = (): void => {
    if (!requestToReject) return;
    rejectMutation.mutate(
      { requestId: requestToReject.id },
      { onSettled: () => setRequestToReject(null) },
    );
  };

  return (
    <section className="access-requests-page" aria-labelledby="access-requests-title">
      <header>
        <div>
          <h1 id="access-requests-title">Solicitudes de acceso</h1>
          <p>Organizaciones y sedes creadas por registro público, pendientes de tu aprobación.</p>
        </div>
        <AppButton fill="outline" onClick={() => history.push('/admin/organizations')}>
          Volver a organizaciones
        </AppButton>
      </header>

      <AppDataList
        items={data?.data ?? []}
        keyExtractor={request => request.id}
        renderItem={request => (
          <AccessRequestListItem
            request={request}
            onApprove={setRequestToApprove}
            onReject={setRequestToReject}
          />
        )}
        isLoading={isLoading}
        isError={isError}
        errorMessage="No se pudo cargar el listado de solicitudes."
        onRetry={() => void refetch()}
        emptyTitle="No hay solicitudes pendientes"
        emptyDescription="Las nuevas organizaciones creadas por registro público aparecerán aquí."
        meta={data?.meta}
        onPageChange={setPage}
      />

      <AppConfirmDialog
        isOpen={Boolean(requestToApprove)}
        header="Aprobar solicitud"
        message={
          requestToApprove
            ? `¿Aprobar el acceso de Gestor de Cancha para "${requestToApprove.organization.name}"? La organización y sus sedes quedarán activas de inmediato.`
            : ''
        }
        confirmText="Aprobar"
        onConfirm={handleConfirmApprove}
        onCancel={() => setRequestToApprove(null)}
      />

      <AppConfirmDialog
        isOpen={Boolean(requestToReject)}
        header="Rechazar solicitud"
        message={
          requestToReject
            ? `¿Rechazar la solicitud de "${requestToReject.organization.name}"? El solicitante no obtendrá acceso.`
            : ''
        }
        confirmText="Rechazar"
        isDestructive
        onConfirm={handleConfirmReject}
        onCancel={() => setRequestToReject(null)}
      />
    </section>
  );
};

export default AccessRequestsPage;
