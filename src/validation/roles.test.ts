import { describe, expect, it } from 'vitest';
import { roleFormSchema } from './roles';

const PERMISSION_ID = '11111111-1111-4111-8111-111111111111';

describe('roleFormSchema', () => {
  it('normaliza el nombre y la descripción', () => {
    const result = roleFormSchema.parse({
      name: '  Gestión   de Canchas  ',
      description: '  Acceso operativo  ',
      permissionIds: [PERMISSION_ID],
    });

    expect(result).toEqual({
      name: 'Gestión de Canchas',
      description: 'Acceso operativo',
      permissionIds: [PERMISSION_ID],
    });
  });

  it('rechaza caracteres no permitidos en el nombre', () => {
    const result = roleFormSchema.safeParse({
      name: 'Gestor <script>',
      description: '',
      permissionIds: [],
    });

    expect(result.success).toBe(false);
  });

  it('rechaza permisos duplicados', () => {
    const result = roleFormSchema.safeParse({
      name: 'Gestor',
      description: '',
      permissionIds: [PERMISSION_ID, PERMISSION_ID],
    });

    expect(result.success).toBe(false);
  });
});
