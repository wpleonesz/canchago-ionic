import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthorizationError } from '../../../services/api/errorMapper';
import type { VenueDto } from '../../../types/api/organizaciones';
import VenueListItem from './VenueListItem';

vi.mock('../../auth/components/PermissionGuard', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

const mocks = vi.hoisted(() => ({ updateVenue: vi.fn() }));

vi.mock('../../../services/api/endpoints/organizaciones', () => ({
  updateVenue: mocks.updateVenue,
}));

const VENUE: VenueDto = {
  id: 'venue-1',
  organizationId: 'org-1',
  name: 'Sede Norte',
  address: 'Av. Siempre Viva 123',
  phone: null,
  email: null,
  status: 'ACTIVE',
  createdAt: '2026-08-29T10:00:00.000Z',
  updatedAt: '2026-08-29T10:00:00.000Z',
};

const renderWithProviders = (venue: VenueDto): void => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <VenueListItem venue={venue} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('VenueListItem — estado de la sede (feature 015)', () => {
  it('una sede activa muestra el botón para desactivar', () => {
    renderWithProviders(VENUE);
    expect(screen.getByLabelText('Desactivar Sede Norte')).toBeInTheDocument();
  });

  it('una sede inactiva muestra el botón para activar', () => {
    renderWithProviders({ ...VENUE, status: 'INACTIVE' });
    expect(screen.getByLabelText('Activar Sede Norte')).toBeInTheDocument();
  });

  it('pide confirmación antes de desactivar y solo llama a la API al confirmar', async () => {
    mocks.updateVenue.mockResolvedValue({ ...VENUE, status: 'INACTIVE' });
    renderWithProviders(VENUE);

    fireEvent.click(screen.getByLabelText('Desactivar Sede Norte'));
    expect(mocks.updateVenue).not.toHaveBeenCalled();

    fireEvent.click(await screen.findByText('Desactivar'));

    await waitFor(() =>
      expect(mocks.updateVenue).toHaveBeenCalledWith(
        'org-1',
        'venue-1',
        expect.objectContaining({ status: 'INACTIVE', expectedUpdatedAt: VENUE.updatedAt }),
      ),
    );
  });

  it('activar no pide confirmación', async () => {
    mocks.updateVenue.mockResolvedValue({ ...VENUE, status: 'ACTIVE' });
    renderWithProviders({ ...VENUE, status: 'INACTIVE' });

    fireEvent.click(screen.getByLabelText('Activar Sede Norte'));

    await waitFor(() =>
      expect(mocks.updateVenue).toHaveBeenCalledWith(
        'org-1',
        'venue-1',
        expect.objectContaining({ status: 'ACTIVE' }),
      ),
    );
  });

  it('muestra el mensaje de error si el backend rechaza el cambio', async () => {
    mocks.updateVenue.mockRejectedValue(new AuthorizationError('Solo un administrador puede cambiar el estado de la sede.'));
    renderWithProviders({ ...VENUE, status: 'INACTIVE' });

    fireEvent.click(screen.getByLabelText('Activar Sede Norte'));

    expect(
      await screen.findByText('Solo un administrador puede cambiar el estado de la sede.'),
    ).toBeInTheDocument();
  });
});
