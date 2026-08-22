import { describe, expect, it } from 'vitest';
import { adminUserProfileFormSchema } from './user-profile';

describe('adminUserProfileFormSchema', () => {
  it('normaliza nombres y conserva Unicode', () => {
    expect(adminUserProfileFormSchema.parse({ firstName: '  María José ', lastName: ' Núñez ' })).toEqual({
      firstName: 'María José',
      lastName: 'Núñez',
    });
  });

  it('rechaza nombres vacíos o mayores a 100 caracteres', () => {
    expect(adminUserProfileFormSchema.safeParse({ firstName: ' ', lastName: 'Lovelace' }).success).toBe(false);
    expect(adminUserProfileFormSchema.safeParse({ firstName: 'Ada', lastName: 'a'.repeat(101) }).success).toBe(false);
  });
});
