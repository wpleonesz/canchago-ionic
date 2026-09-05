import { z } from 'zod';

// Espejo del schema real del backend (canchago/validations/users/index.ts) — solo mejora UX,
// el backend es quien valida en última instancia (ver spec 005).
export const createUserFormSchema = z.object({
  email: z.string().email('Ingresa un correo electrónico válido'),
  firstName: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .max(100, 'Máximo 100 caracteres'),
  lastName: z
    .string()
    .min(1, 'El apellido es obligatorio')
    .max(100, 'Máximo 100 caracteres'),
  organizationId: z.string().uuid('Selecciona una organización válida'),
  roleIds: z.array(z.string().uuid('Selecciona únicamente roles válidos')).optional(),
});

export const updateUserFormSchema = createUserFormSchema.partial();

export type CreateUserFormValues = z.infer<typeof createUserFormSchema>;
export type UpdateUserFormValues = z.infer<typeof updateUserFormSchema>;
