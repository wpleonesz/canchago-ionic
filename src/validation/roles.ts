import { z } from 'zod';

const normalizeRoleName = (value: string): string => value.trim().replace(/\s+/gu, ' ');

export const roleFormSchema = z.object({
  name: z
    .string()
    .transform(normalizeRoleName)
    .pipe(
      z
        .string()
        .min(1, 'El nombre del rol es obligatorio.')
        .max(150, 'El nombre no puede superar 150 caracteres.')
        .regex(/^[\p{L}\p{N}_ -]+$/u, 'Usa únicamente letras, números, espacios, guiones y guion bajo.'),
    ),
  description: z
    .string()
    .max(500, 'La descripción no puede superar 500 caracteres.')
    .transform(value => value.trim()),
  permissionIds: z.array(z.string().uuid()).refine(values => new Set(values).size === values.length, {
    message: 'No puede haber permisos duplicados.',
  }),
});

export type RoleFormValues = z.infer<typeof roleFormSchema>;
