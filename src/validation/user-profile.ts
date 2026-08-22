import { z } from 'zod';

const profileNameSchema = z.string().trim().min(1, 'Este campo es obligatorio').max(100, 'Máximo 100 caracteres');

export const adminUserProfileFormSchema = z.object({
  firstName: profileNameSchema,
  lastName: profileNameSchema,
});

export type AdminUserProfileFormValues = z.infer<typeof adminUserProfileFormSchema>;

const optionalPhone = z
  .string()
  .trim()
  .max(16, 'Máximo 16 caracteres')
  .refine(value => value === '' || /^\+[1-9]\d{7,14}$/u.test(value), 'Usa formato internacional, por ejemplo +593999999999');

const optionalHttpsUrl = (domains?: string[]) =>
  z.string().trim().max(500, 'Máximo 500 caracteres').refine(value => {
    if (value === '') return true;
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' || url.username || url.password) return false;
      if (!domains) return true;
      const host = url.hostname.toLowerCase();
      return domains.some(domain => host === domain || host.endsWith(`.${domain}`));
    } catch {
      return false;
    }
  }, 'Ingresa una URL HTTPS válida para esta plataforma');

export const ownProfileFormSchema = z.object({
  phone: optionalPhone,
  facebookUrl: optionalHttpsUrl(['facebook.com']),
  instagramUrl: optionalHttpsUrl(['instagram.com']),
  linkedinUrl: optionalHttpsUrl(['linkedin.com']),
  xUrl: optionalHttpsUrl(['x.com', 'twitter.com']),
  githubUrl: optionalHttpsUrl(['github.com']),
  tiktokUrl: optionalHttpsUrl(['tiktok.com']),
  websiteUrl: optionalHttpsUrl(),
});

export type OwnProfileFormValues = z.infer<typeof ownProfileFormSchema>;
