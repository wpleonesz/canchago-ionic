import { businessOutline, keyOutline, peopleOutline, shieldCheckmarkOutline } from 'ionicons/icons';

export interface AdminNavigationItem {
  id: string;
  label: string;
  description: string;
  icon: string;
  path: string;
  requiredPermissions: string[];
}

export interface AdminNavigationGroup {
  id: string;
  label: string;
  items: AdminNavigationItem[];
}

export const ADMIN_NAVIGATION: AdminNavigationGroup[] = [
  {
    id: 'users-access',
    label: 'Usuarios y acceso',
    items: [
      {
        id: 'users',
        label: 'Usuarios',
        description: 'Consulta y administra las cuentas autorizadas.',
        icon: peopleOutline,
        path: '/admin/users',
        requiredPermissions: ['users.read'],
      },
      {
        id: 'roles',
        label: 'Roles',
        description: 'Organiza el acceso mediante roles por organización.',
        icon: shieldCheckmarkOutline,
        path: '/admin/roles',
        requiredPermissions: ['roles.read'],
      },
      {
        id: 'permissions',
        label: 'Permisos',
        description: 'Consulta el catálogo global de capacidades.',
        icon: keyOutline,
        path: '/admin/permissions',
        requiredPermissions: ['permisos.read'],
      },
    ],
  },
  {
    id: 'structure',
    label: 'Estructura',
    items: [
      {
        id: 'organizations',
        label: 'Organizaciones y sedes',
        description: 'Gestiona la estructura multiempresa disponible.',
        icon: businessOutline,
        path: '/admin/organizations',
        requiredPermissions: ['organizaciones.read'],
      },
    ],
  },
];
