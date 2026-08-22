import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AccessRequestsPage from './AccessRequestsPage';

const getAccessRequestsMock = vi.fn();
const approveAccessRequestMock = vi.fn();
const rejectAccessRequestMock = vi.fn();

vi.mock('../../../services/api/endpoints/access-requests', () => ({
  getAccessRequests: (...args: unknown[]) => getAccessRequestsMock(...args),
  approveAccessRequest: (...args: unknown[]) => approveAccessRequestMock(...args),
  rejectAccessRequest: (...args: unknown[]) => rejectAccessRequestMock(...args),
}));

// IonAlert (usado por AppConfirmDialog) depende de animaciones/overlay reales que no
// funcionan de forma confiable en jsdom — se reemplaza por un stub mínimo que expone botones
// reales de confirmar/cancelar, igual que UserListItem.test.tsx mockea PermissionGuard: lo que
// se prueba aquí es que AccessRequestsPage pide confirmación antes de mutar, no las internas de
// IonAlert (componente compartido, sin tests propios en el repo).
vi.mock('../../../components/feedback/AppConfirmDialog', () => ({
  default: ({
    isOpen,
    header,
    confirmText,
    onConfirm,
    onCancel,
  }: {
    isOpen: boolean;
    header: string;
    confirmText?: string;
    onConfirm: () => void;
    onCancel: () => void;
  }) =>
    isOpen ? (
      <div role="alertdialog" aria-label={header}>
        <button type="button" onClick={onConfirm}>
          {confirmText ?? 'Confirmar'}
        </button>
        <button type="button" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    ) : null,
}));

const PENDING_REQUEST = {
  id: 'request-1',
  status: 'PENDING' as const,
  createdAt: '2026-08-22T00:00:00.000Z',
  reviewedAt: null,
  rejectionReason: null,
  organization: {
    id: 'org-1',
    name: 'Mi Cancha',
    status: 'PENDING_APPROVAL',
    venues: [{ id: 'venue-1', name: 'Sede Principal', status: 'PENDING_APPROVAL' }],
  },
  requester: {
    id: 'user-1',
    email: 'gestor@example.com',
    profile: { firstName: 'Bruno', lastName: 'Diaz' },
  },
};

const wrapper = ({ children }: PropsWithChildren): React.ReactElement => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('AccessRequestsPage', () => {
  it('shows the empty state when there are no pending requests', async () => {
    getAccessRequestsMock.mockResolvedValue({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });

    render(<AccessRequestsPage />, { wrapper });

    expect(await screen.findByText('No hay solicitudes pendientes')).toBeInTheDocument();
  });

  it('asks for confirmation before approving, and calls the endpoint only after confirming', async () => {
    getAccessRequestsMock.mockResolvedValue({
      data: [PENDING_REQUEST],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    approveAccessRequestMock.mockResolvedValue({ organizationId: 'org-1', status: 'APPROVED' });

    render(<AccessRequestsPage />, { wrapper });

    fireEvent.click(await screen.findByText('Aprobar'));
    expect(approveAccessRequestMock).not.toHaveBeenCalled();

    const dialog = await screen.findByRole('alertdialog', { name: 'Aprobar solicitud' });
    fireEvent.click(within(dialog).getByText('Aprobar'));

    await waitFor(() => {
      expect(approveAccessRequestMock).toHaveBeenCalledWith('request-1');
    });
  });

  it('asks for confirmation before rejecting, and calls the endpoint only after confirming', async () => {
    getAccessRequestsMock.mockResolvedValue({
      data: [PENDING_REQUEST],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    rejectAccessRequestMock.mockResolvedValue({ requestId: 'request-1', status: 'REJECTED' });

    render(<AccessRequestsPage />, { wrapper });

    fireEvent.click(await screen.findByText('Rechazar'));
    expect(rejectAccessRequestMock).not.toHaveBeenCalled();

    const dialog = await screen.findByRole('alertdialog', { name: 'Rechazar solicitud' });
    fireEvent.click(within(dialog).getByText('Rechazar'));

    await waitFor(() => {
      expect(rejectAccessRequestMock).toHaveBeenCalledWith('request-1', undefined);
    });
  });
});
