import { z } from 'zod';

// Solo mejora UX (feedback inmediato) — el backend es quien realmente valida las credenciales.
export const loginFormSchema = z.object({
  username: z.string().min(1, 'El usuario es obligatorio'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
