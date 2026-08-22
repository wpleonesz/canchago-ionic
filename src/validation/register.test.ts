import { describe, expect, it } from 'vitest';
import { managerRegisterFormSchema, playerRegisterFormSchema } from './register';

const validAccount = {
  email: 'jugador@ejemplo.com',
  password: 'contraseñaSegura123',
  firstName: 'Ana',
  lastName: 'Torres',
};

describe('playerRegisterFormSchema', () => {
  it('accepts a valid account', () => {
    expect(playerRegisterFormSchema.safeParse(validAccount).success).toBe(true);
  });

  it('rejects a password shorter than 8 characters', () => {
    const result = playerRegisterFormSchema.safeParse({ ...validAccount, password: 'abc123' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = playerRegisterFormSchema.safeParse({ ...validAccount, email: 'no-es-un-correo' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty firstName', () => {
    const result = playerRegisterFormSchema.safeParse({ ...validAccount, firstName: '' });
    expect(result.success).toBe(false);
  });
});

describe('managerRegisterFormSchema', () => {
  const validManager = {
    ...validAccount,
    organization: { name: 'Mi Cancha' },
    venue: { name: 'Sede Principal' },
  };

  it('accepts a valid account with only the required organization/venue fields', () => {
    expect(managerRegisterFormSchema.safeParse(validManager).success).toBe(true);
  });

  it('rejects a missing organization name', () => {
    const result = managerRegisterFormSchema.safeParse({
      ...validManager,
      organization: { name: '' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a missing venue name', () => {
    const result = managerRegisterFormSchema.safeParse({
      ...validManager,
      venue: { name: '' },
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional organization fields left empty', () => {
    const result = managerRegisterFormSchema.safeParse({
      ...validAccount,
      organization: { name: 'Mi Cancha', legalName: '', taxIdentification: '', email: '', phone: '', domain: '' },
      venue: { name: 'Sede Principal', address: '', phone: '', email: '' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid organization email', () => {
    const result = managerRegisterFormSchema.safeParse({
      ...validManager,
      organization: { name: 'Mi Cancha', email: 'no-es-un-correo' },
    });
    expect(result.success).toBe(false);
  });
});
