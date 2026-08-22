import { z } from 'zod';

const profileNameSchema = z.string().trim().min(1, 'Este campo es obligatorio').max(100, 'Máximo 100 caracteres');

export const adminUserProfileFormSchema = z.object({
  firstName: profileNameSchema,
  lastName: profileNameSchema,
});

export type AdminUserProfileFormValues = z.infer<typeof adminUserProfileFormSchema>;
