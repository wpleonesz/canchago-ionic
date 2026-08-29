import { z } from 'zod';

// Espejo del schema real del backend (canchago/validations/users/index.ts) — solo mejora UX,
// el backend es quien valida en última instancia (ver spec 005).
export const createUserFormSchema = z.object({
  email: z.string().email('Ingresa un correo electrónico válido'),
  firstName: z.string().min(2, 'El nombre debe tener más de 2 caracteres').max(100, 'Máximo 100 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener más de 2 caracteres').max(100, 'Máximo 100 caracteres'),
  organizationId: z.string().min(1, 'Selecciona una organización'),
  roleIds: z.array(z.string()).optional(),
});

export const updateUserFormSchema = createUserFormSchema.partial();

export type CreateUserFormValues = z.infer<typeof createUserFormSchema>;
export type UpdateUserFormValues = z.infer<typeof updateUserFormSchema>;
