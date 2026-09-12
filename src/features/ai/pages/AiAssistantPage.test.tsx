import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import { useSessionStore } from '../../../store/sessionStore';
import AiAssistantPage from './AiAssistantPage';

const mutateAsync = vi.fn();
let recommendationState: Record<string, unknown> = {};

vi.mock('../hooks/useAiAssistant', () => ({
  useAiSlotRecommendations: () => ({
    mutateAsync,
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    ...recommendationState,
  }),
  useAiUpcomingBookingsSummary: () => ({ mutate: vi.fn(), isPending: false, isError: false }),
}));

const renderPage = () => {
  useSessionStore.getState().setSession({
    id: 'user-1',
    email: 'player@example.com',
    name: 'Player',
    roles: [],
    permissions: [
      { id: 'p1', code: 'resources.read' },
      { id: 'p2', code: 'availability.read' },
      { id: 'p3', code: 'bookings.read.own' },
    ],
  });
  return render(
    <MemoryRouter>
      <AiAssistantPage />
    </MemoryRouter>,
  );
};

afterEach(() => {
  recommendationState = {};
  mutateAsync.mockReset();
  useSessionStore.getState().clearSession();
});

describe('AiAssistantPage', () => {
  it('starts idle and offers only structured controls', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Asistente IA' })).toBeInTheDocument();
    expect(screen.getByText('Buscar recomendaciones')).toBeInTheDocument();
    expect(screen.queryByLabelText(/prompt/i)).not.toBeInTheDocument();
  });

  it('shows loading and prevents another submission', () => {
    recommendationState = { isPending: true };
    renderPage();
    expect(screen.getByLabelText('Procesando')).toBeInTheDocument();
    expect(screen.queryByText('Buscar recomendaciones')).not.toBeInTheDocument();
  });

  it('shows an empty result and a recoverable error', () => {
    recommendationState = { data: { generated: false, explanation: '', recommendations: [] } };
    const view = renderPage();
    expect(screen.getByText('No encontramos opciones')).toBeInTheDocument();
    view.unmount();

    recommendationState = { isError: true };
    renderPage();
    expect(screen.getByRole('alert')).toHaveTextContent('El asistente no está disponible');
    expect(screen.getByText('Reintentar')).toBeInTheDocument();
  });

  it('renders generated text safely and navigates without booking automatically', () => {
    recommendationState = {
      data: {
        generated: true,
        explanation: '<script>alert(1)</script>',
        recommendations: [
          {
            availabilitySlotId: 'slot-1',
            resourceId: 'resource-1',
            resourceName: 'Cancha Norte',
            venueName: 'Sede Uno',
            address: 'Av. Principal',
            hourlyPrice: '25',
            currency: 'USD',
            startsAt: '2030-01-02T18:00:00.000Z',
            endsAt: '2030-01-02T19:00:00.000Z',
            reason: 'Coincide con tu preferencia.',
          },
        ],
      },
    };
    const { container } = renderPage();
    expect(screen.getByText('<script>alert(1)</script>')).toBeInTheDocument();
    expect(container.querySelector('script')).toBeNull();
    fireEvent.click(screen.getByText('Ver y reservar'));
    expect(mutateAsync).not.toHaveBeenCalled();
  });
});
