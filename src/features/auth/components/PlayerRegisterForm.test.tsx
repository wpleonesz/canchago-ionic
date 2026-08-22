import { fireEvent, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PlayerRegisterForm from './PlayerRegisterForm';

describe('PlayerRegisterForm', () => {
  it('shows validation errors and never calls onSubmit when submitted empty', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    const { container } = render(<PlayerRegisterForm onSubmit={onSubmit} />);

    const form = container.querySelector('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(container.querySelector('ion-input[label="Correo electrónico"]')).toHaveAttribute(
        'error-text',
        'Ingresa un correo electrónico válido',
      );
      expect(container.querySelector('ion-input[label="Contraseña"]')).toHaveAttribute(
        'error-text',
        'Mínimo 8 caracteres',
      );
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('disables the submit button while a submission is in progress (prevents double submit)', async () => {
    let resolveSubmit: () => void = () => {};
    const onSubmit = vi.fn(
      () =>
        new Promise<void>(resolve => {
          resolveSubmit = resolve;
        }),
    );

    const { container } = render(
      <PlayerRegisterForm
        onSubmit={onSubmit}
        defaultValues={{
          firstName: 'Ana',
          lastName: 'Torres',
          email: 'ana@example.com',
          password: 'contraseñaSegura123',
        }}
      />,
    );

    const form = container.querySelector('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(container.querySelector('ion-button[type="submit"]')).toHaveAttribute('disabled');
    });

    resolveSubmit();
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  it('shows the submitError banner when provided', () => {
    const { getByText } = render(
      <PlayerRegisterForm onSubmit={vi.fn()} submitError="Ya existe una cuenta con ese correo." />,
    );

    expect(getByText('Ya existe una cuenta con ese correo.')).toBeInTheDocument();
  });
});
