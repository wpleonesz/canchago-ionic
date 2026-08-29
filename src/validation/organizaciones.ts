import { z } from 'zod';

const normalizeName = (value: string): string => value.trim().replace(/\s+/gu, ' ');

// Límites idénticos a validations/organizaciones-sedes/organizacion.validation.ts del backend
// (canchago) — sin formatos inventados: el backend no valida ningún patrón para
// taxIdentification/phone más allá de la longitud máxima.
export const organizationFormSchema = z.object({
  name: z
    .string()
    .transform(normalizeName)
    .pipe(z.string().min(1, 'El nombre es obligatorio.').max(150, 'Máximo 150 caracteres.')),
  legalName: z.string().max(200, 'Máximo 200 caracteres.').optional().or(z.literal('')),
  taxIdentification: z.string().max(30, 'Máximo 30 caracteres.').optional().or(z.literal('')),
  email: z.string().email('Ingresa un correo electrónico válido.').optional().or(z.literal('')),
  phone: z.string().max(20, 'Máximo 20 caracteres.').optional().or(z.literal('')),
  domain: z.string().max(255, 'Máximo 255 caracteres.').optional().or(z.literal('')),
});

export type OrganizationFormValues = z.infer<typeof organizationFormSchema>;

// Límites idénticos a validations/organizaciones-sedes/sede.validation.ts del backend.
export const venueFormSchema = z.object({
  name: z
    .string()
    .transform(normalizeName)
    .pipe(z.string().min(1, 'El nombre es obligatorio.').max(150, 'Máximo 150 caracteres.')),
  address: z.string().max(500, 'Máximo 500 caracteres.').optional().or(z.literal('')),
  phone: z.string().max(20, 'Máximo 20 caracteres.').optional().or(z.literal('')),
  email: z.string().email('Ingresa un correo electrónico válido.').optional().or(z.literal('')),
});

export type VenueFormValues = z.infer<typeof venueFormSchema>;
