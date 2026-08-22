import { fireEvent, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ManagerRegisterForm from './ManagerRegisterForm';

describe('ManagerRegisterForm', () => {
  it('shows validation errors for missing account, organization and venue fields', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    const { container } = render(<ManagerRegisterForm onSubmit={onSubmit} />);

    const form = container.querySelector('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(container.querySelector('ion-input[label="Correo electrónico"]')).toHaveAttribute(
        'error-text',
        'Ingresa un correo electrónico válido',
      );
      expect(container.querySelector('ion-input[label="Nombre de la organización"]')).toHaveAttribute(
        'error-text',
        'El nombre de la organización es obligatorio',
      );
      expect(container.querySelector('ion-input[label="Nombre de la sede"]')).toHaveAttribute(
        'error-text',
        'El nombre de la sede es obligatorio',
      );
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits with the organization and venue values when everything required is filled', async () => {
    let resolveSubmit: () => void = () => {};
    const onSubmit = vi.fn(
      () =>
        new Promise<void>(resolve => {
          resolveSubmit = resolve;
        }),
    );

    const { container } = render(
      <ManagerRegisterForm
        onSubmit={onSubmit}
        defaultValues={{
          firstName: 'Bruno',
          lastName: 'Diaz',
          email: 'bruno@example.com',
          password: 'contraseñaSegura123',
          organization: { name: 'Mi Cancha' },
          venue: { name: 'Sede Principal' },
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
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          organization: expect.objectContaining({ name: 'Mi Cancha' }),
          venue: expect.objectContaining({ name: 'Sede Principal' }),
        }),
      );
    });
  });
});
