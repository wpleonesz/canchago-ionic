import { describe, expect, it } from 'vitest';
import { loginFormSchema } from './auth';

describe('loginFormSchema', () => {
  it('accepts a valid username/password pair', () => {
    const result = loginFormSchema.safeParse({ username: 'futbolista', password: 'canchago123' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty username', () => {
    const result = loginFormSchema.safeParse({ username: '', password: 'canchago123' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty password', () => {
    const result = loginFormSchema.safeParse({ username: 'futbolista', password: '' });
    expect(result.success).toBe(false);
  });
});
