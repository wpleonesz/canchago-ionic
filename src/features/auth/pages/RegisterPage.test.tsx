import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthenticationError, BusinessRuleError } from '../../../services/api/errorMapper';
import RegisterPage from './RegisterPage';

const registerMock = vi.fn();

vi.mock('../../../services/api/endpoints/register', () => ({
  register: (...args: unknown[]) => registerMock(...args),
}));

vi.mock('../../../services/api/endpoints/auth', () => ({
  redirectToLogin: vi.fn(),
}));

const wrapper = ({ children }: PropsWithChildren): React.ReactElement => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
};

afterEach(() => {
  vi.restoreAllMocks();
  registerMock.mockReset();
});

const fillPlayerForm = (container: HTMLElement): void => {
  const setValue = (label: string, value: string): void => {
    const input = container.querySelector(`ion-input[label="${label}"]`);
    input?.dispatchEvent(new CustomEvent('ionInput', { detail: { value } }));
  };

  setValue('Nombre', 'Ana');
  setValue('Apellido', 'Torres');
  setValue('Correo electrónico', 'ana@example.com');
  setValue('Contraseña', 'contraseñaSegura123');
};

describe('RegisterPage', () => {
  it('starts with the account type selector and shows both options', () => {
    render(<RegisterPage />, { wrapper });

    expect(screen.getByText('Jugar y reservar canchas')).toBeInTheDocument();
    expect(screen.getByText('Gestionar una cancha')).toBeInTheDocument();
  });

  it('registers a Futbolista and shows the immediate-access confirmation', async () => {
    registerMock.mockResolvedValue({
      accountType: 'futbolista',
      user: { id: 'user-1', email: 'ana@example.com', firstName: 'Ana', lastName: 'Torres' },
    });

    const { container } = render(<RegisterPage />, { wrapper });

    fireEvent.click(screen.getByText('Jugar y reservar canchas'));
    fillPlayerForm(container);

    const form = container.querySelector('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(registerMock.mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({ accountType: 'futbolista', email: 'ana@example.com' }),
      );
    });

    expect(await screen.findByText('¡Cuenta creada!')).toBeInTheDocument();
    expect(
      screen.getByText('Ya puedes iniciar sesión con tu correo y tu contraseña.'),
    ).toBeInTheDocument();
  });

  it('registers a Gestor de Cancha and shows the pending-approval confirmation, never immediate access', async () => {
    registerMock.mockResolvedValue({
      accountType: 'gestor-de-cancha',
      user: { id: 'user-2', email: 'gestor@example.com', firstName: 'Bruno', lastName: 'Diaz' },
      accessRequestId: 'request-1',
      organizationStatus: 'PENDING_APPROVAL',
    });

    const { container } = render(<RegisterPage />, { wrapper });

    fireEvent.click(screen.getByText('Gestionar una cancha'));

    const setValue = (label: string, value: string): void => {
      const input = container.querySelector(`ion-input[label="${label}"]`);
      input?.dispatchEvent(new CustomEvent('ionInput', { detail: { value } }));
    };
    setValue('Nombre', 'Bruno');
    setValue('Apellido', 'Diaz');
    setValue('Correo electrónico', 'gestor@example.com');
    setValue('Contraseña', 'contraseñaSegura123');
    setValue('Nombre de la organización', 'Mi Cancha');
    setValue('Nombre de la sede', 'Sede Principal');

    const form = container.querySelector('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(registerMock.mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({ accountType: 'gestor-de-cancha' }),
      );
    });

    expect(await screen.findByText('Solicitud enviada')).toBeInTheDocument();
    expect(screen.getByText(/pendiente de aprobación/i)).toBeInTheDocument();
  });

  it('shows a contextual error when the email is already registered (409)', async () => {
    registerMock.mockRejectedValue(new BusinessRuleError('Ya existe una cuenta con ese correo electrónico.'));

    const { container } = render(<RegisterPage />, { wrapper });

    fireEvent.click(screen.getByText('Jugar y reservar canchas'));
    fillPlayerForm(container);

    const form = container.querySelector('form');
    fireEvent.submit(form!);

    expect(await screen.findByText('Ya existe una cuenta con ese correo electrónico.')).toBeInTheDocument();
  });

  it('falls back to a generic message for an unmapped error', async () => {
    registerMock.mockRejectedValue(new AuthenticationError('no debería verse'));

    const { container } = render(<RegisterPage />, { wrapper });

    fireEvent.click(screen.getByText('Jugar y reservar canchas'));
    fillPlayerForm(container);

    const form = container.querySelector('form');
    fireEvent.submit(form!);

    expect(await screen.findByText('No se pudo completar el registro. Intenta de nuevo.')).toBeInTheDocument();
  });

  it('lets the user go back and pick a different account type', () => {
    render(<RegisterPage />, { wrapper });

    fireEvent.click(screen.getByText('Gestionar una cancha'));
    expect(screen.getByText('Tu organización')).toBeInTheDocument();

    fireEvent.click(screen.getByText('← Elegir otro tipo de cuenta'));

    expect(screen.getByText('Jugar y reservar canchas')).toBeInTheDocument();
  });
});
