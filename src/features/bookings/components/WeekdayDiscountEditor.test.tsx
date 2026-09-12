import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthorizationError } from '../../../services/api/errorMapper';
import type { WeekdayDiscountDto } from '../../../types/api/reservas';
import WeekdayDiscountEditor from './WeekdayDiscountEditor';

const mocks = vi.hoisted(() => ({ updateWeekdayDiscounts: vi.fn() }));

vi.mock('../../../services/api/endpoints/reservas', () => ({
  updateWeekdayDiscounts: mocks.updateWeekdayDiscounts,
}));

// IonInput es un web component: emite un CustomEvent "ionInput" con { detail: { value } }, no el
// evento nativo "input" que fireEvent.change/input asumen.
const typeInto = (element: HTMLElement, value: string): void => {
  fireEvent(element, new CustomEvent('ionInput', { detail: { value } }));
};

const renderWithProviders = (discounts: WeekdayDiscountDto[]): void => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <WeekdayDiscountEditor resourceId="resource-1" discounts={discounts} />
    </QueryClientProvider>,
  );
};

describe('WeekdayDiscountEditor — descuentos por día de semana (feature 017)', () => {
  it('precarga los descuentos existentes en sus días correspondientes', () => {
    renderWithProviders([{ weekday: 1, discountPercent: '15' }]);

    expect(screen.getByLabelText('Descuento del Lun')).toHaveValue('15');
    expect(screen.getByLabelText('Descuento del Mar')).toHaveValue('');
  });

  it('guarda solo los días con valor, omitiendo los vacíos', async () => {
    mocks.updateWeekdayDiscounts.mockResolvedValue([{ weekday: 1, discountPercent: '20' }]);
    renderWithProviders([]);

    typeInto(screen.getByLabelText('Descuento del Lun'), '20');
    fireEvent.click(screen.getByText('Guardar descuentos'));

    await waitFor(() =>
      expect(mocks.updateWeekdayDiscounts).toHaveBeenCalledWith('resource-1', {
        discounts: [{ weekday: 1, discountPercent: 20 }],
      }),
    );
  });

  it('un valor fuera de rango deshabilita guardar', async () => {
    renderWithProviders([]);

    typeInto(screen.getByLabelText('Descuento del Lun'), '150');

    await waitFor(() => expect(screen.getByText('Guardar descuentos')).toBeDisabled());
  });

  it('muestra el error del backend si el guardado falla', async () => {
    mocks.updateWeekdayDiscounts.mockRejectedValue(
      new AuthorizationError('No tienes permiso para modificar esta cancha.'),
    );
    renderWithProviders([{ weekday: 1, discountPercent: '15' }]);

    fireEvent.click(screen.getByText('Guardar descuentos'));

    expect(await screen.findByText('No tienes permiso para modificar esta cancha.')).toBeInTheDocument();
  });
});
