import { describe, expect, it } from 'vitest';
import { createUserFormSchema, updateUserFormSchema } from './users';

const validUser = {
  email: 'juan.perez@ejemplo.com',
  firstName: 'Juan',
  lastName: 'Pérez',
  organizationId: '11111111-1111-4111-8111-111111111111',
};

describe('createUserFormSchema', () => {
  it('accepts a valid user without roles', () => {
    expect(createUserFormSchema.safeParse(validUser).success).toBe(true);
  });

  it('accepts a valid user with roleIds', () => {
    const result = createUserFormSchema.safeParse({
      ...validUser,
      roleIds: ['22222222-2222-4222-8222-222222222222'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = createUserFormSchema.safeParse({ ...validUser, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty firstName', () => {
    const result = createUserFormSchema.safeParse({ ...validUser, firstName: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a firstName longer than 100 characters', () => {
    const result = createUserFormSchema.safeParse({ ...validUser, firstName: 'a'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('rejects a missing organizationId', () => {
    const result = createUserFormSchema.safeParse({ ...validUser, organizationId: '' });
    expect(result.success).toBe(false);
  });
});

describe('updateUserFormSchema', () => {
  it('accepts a partial payload with only one field', () => {
    const result = updateUserFormSchema.safeParse({ firstName: 'Carlos' });
    expect(result.success).toBe(true);
  });

  it('accepts an empty object (no changes)', () => {
    expect(updateUserFormSchema.safeParse({}).success).toBe(true);
  });

  it('still rejects an invalid email when provided', () => {
    const result = updateUserFormSchema.safeParse({ email: 'not-an-email' });
    expect(result.success).toBe(false);
  });
});
