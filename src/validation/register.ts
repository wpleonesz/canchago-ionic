import { z } from 'zod';

// Espejo del registerSchema real del backend (canchago/validations/auth/register.validation.ts)
// — solo mejora UX, el backend es quien valida en última instancia. La política de contraseña
// replica keycloak/realm-canchago.json (`passwordPolicy: "length(8) and notUsername"`).
const organizationSchema = z.object({
  name: z.string().min(1, 'El nombre de la organización es obligatorio').max(150, 'Máximo 150 caracteres'),
  legalName: z.string().max(200, 'Máximo 200 caracteres').optional().or(z.literal('')),
  taxIdentification: z.string().max(30, 'Máximo 30 caracteres').optional().or(z.literal('')),
  email: z.string().email('Ingresa un correo electrónico válido').optional().or(z.literal('')),
  phone: z.string().max(20, 'Máximo 20 caracteres').optional().or(z.literal('')),
  domain: z.string().max(255, 'Máximo 255 caracteres').optional().or(z.literal('')),
});

const venueSchema = z.object({
  name: z.string().min(1, 'El nombre de la sede es obligatorio').max(150, 'Máximo 150 caracteres'),
  address: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  phone: z.string().max(20, 'Máximo 20 caracteres').optional().or(z.literal('')),
  email: z.string().email('Ingresa un correo electrónico válido').optional().or(z.literal('')),
});

const accountFieldsSchema = z.object({
  email: z.string().email('Ingresa un correo electrónico válido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  firstName: z.string().min(1, 'El nombre es obligatorio').max(100, 'Máximo 100 caracteres'),
  lastName: z.string().min(1, 'El apellido es obligatorio').max(100, 'Máximo 100 caracteres'),
});

export const playerRegisterFormSchema = accountFieldsSchema;

export const managerRegisterFormSchema = accountFieldsSchema.extend({
  organization: organizationSchema,
  venue: venueSchema,
});

export type PlayerRegisterFormValues = z.infer<typeof playerRegisterFormSchema>;
export type ManagerRegisterFormValues = z.infer<typeof managerRegisterFormSchema>;
