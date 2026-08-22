import { describe, expect, it } from 'vitest';
import { adminUserProfileFormSchema, ownProfileFormSchema } from './user-profile';

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

describe('ownProfileFormSchema', () => {
  const emptyProfile = {
    phone: '', facebookUrl: '', instagramUrl: '', linkedinUrl: '', xUrl: '', githubUrl: '', tiktokUrl: '', websiteUrl: '',
  };

  it('mantiene todos los campos opcionales y acepta E.164 y HTTPS válidos', () => {
    expect(ownProfileFormSchema.safeParse(emptyProfile).success).toBe(true);
    expect(ownProfileFormSchema.safeParse({ ...emptyProfile, phone: '+593999999999', githubUrl: 'https://github.com/ada' }).success).toBe(true);
  });

  it('rechaza teléfono local, HTTP y dominios suplantados', () => {
    expect(ownProfileFormSchema.safeParse({ ...emptyProfile, phone: '0999999999' }).success).toBe(false);
    expect(ownProfileFormSchema.safeParse({ ...emptyProfile, facebookUrl: 'http://facebook.com/ada' }).success).toBe(false);
    expect(ownProfileFormSchema.safeParse({ ...emptyProfile, linkedinUrl: 'https://linkedin.com.evil.test/ada' }).success).toBe(false);
  });
});
