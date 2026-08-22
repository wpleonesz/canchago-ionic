import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { describe, expect, it, vi } from 'vitest';
import UserForm from './UserForm';

vi.mock('../../../services/api/endpoints/organizaciones', () => ({
  getOrganizations: vi.fn().mockResolvedValue({
    data: [{ id: 'org-1', name: 'Cancha 2' }],
    meta: { page: 1, pageSize: 50, total: 1, totalPages: 1 },
  }),
}));

vi.mock('../../../services/api/endpoints/roles', () => ({
  getRoles: vi.fn().mockResolvedValue({
    data: [],
    meta: { page: 1, pageSize: 50, total: 0, totalPages: 1 },
  }),
}));

const wrapper = ({ children }: PropsWithChildren): React.ReactElement => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('UserForm', () => {
  it('shows validation errors and never calls onSubmit when submitted empty', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    const { container } = render(
      <UserForm mode="create" onSubmit={onSubmit} submitLabel="Crear usuario" />,
      { wrapper },
    );

    const form = container.querySelector('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(container.querySelector('ion-input[label="Correo electrónico"]')).toHaveAttribute(
        'error-text',
        'Ingresa un correo electrónico válido',
      );
      expect(container.querySelector('ion-input[label="Nombre"]')).toHaveAttribute(
        'error-text',
        'El nombre es obligatorio',
      );
      expect(container.querySelector('ion-input[label="Apellido"]')).toHaveAttribute(
        'error-text',
        'El apellido es obligatorio',
      );
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('disables the submit button while a submission is in progress', async () => {
    let resolveSubmit: () => void = () => {};
    const onSubmit = vi.fn(
      () =>
        new Promise<void>(resolve => {
          resolveSubmit = resolve;
        }),
    );

    const { container } = render(
      <UserForm
        mode="create"
        defaultValues={{
          email: 'juan.perez@ejemplo.com',
          firstName: 'Juan',
          lastName: 'Pérez',
          organizationId: 'org-1',
        }}
        onSubmit={onSubmit}
        submitLabel="Crear usuario"
      />,
      { wrapper },
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
});
