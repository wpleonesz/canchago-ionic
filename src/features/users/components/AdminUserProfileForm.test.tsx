import { fireEvent, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AdminUserProfileForm from './AdminUserProfileForm';

const PROFILE = {
  id: 'user-1',
  email: 'ada@example.com',
  firstName: 'Ada',
  lastName: 'Lovelace',
  active: true,
  profileUpdatedAt: '2026-08-21T12:00:00.000Z',
};

describe('AdminUserProfileForm', () => {
  it('muestra identidad como solo lectura y no renderiza campos protegidos', () => {
    const { container, getByText } = render(
      <AdminUserProfileForm profile={PROFILE} onSubmit={vi.fn().mockResolvedValue(true)} onCancel={vi.fn()} />,
    );

    expect(getByText(PROFILE.email)).toBeInTheDocument();
    expect(container.querySelector('ion-input[label="Correo electrónico"]')).toBeNull();
    expect(container.querySelector('ion-input[label="Nombre"]')).toHaveAttribute('value', 'Ada');
    expect(container.querySelector('ion-input[label="Apellido"]')).toHaveAttribute('value', 'Lovelace');
    expect(container.textContent).not.toContain('Contraseña');
    expect(container.textContent).not.toContain('Permisos');
  });

  it('mantiene Guardar deshabilitado mientras no existen cambios', () => {
    const { container } = render(
      <AdminUserProfileForm profile={PROFILE} onSubmit={vi.fn().mockResolvedValue(true)} onCancel={vi.fn()} />,
    );

    expect(container.querySelector('ion-button[type="submit"]')).toHaveProperty('disabled', true);
  });

  it('ejecuta cancelar sin enviar el formulario', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    const onCancel = vi.fn();
    const { getByText } = render(<AdminUserProfileForm profile={PROFILE} onSubmit={onSubmit} onCancel={onCancel} />);

    fireEvent.click(getByText('Cancelar'));

    await waitFor(() => expect(onCancel).toHaveBeenCalledOnce());
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
