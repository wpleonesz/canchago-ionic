import {
  businessOutline,
  calendarOutline,
  footballOutline,
  keyOutline,
  peopleOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';

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
    id: 'booking',
    label: 'Agendamiento',
    items: [
      {
        id: 'courts',
        label: 'Canchas',
        description: 'Consulta horarios y reserva una cancha.',
        icon: footballOutline,
        path: '/admin/courts',
        requiredPermissions: ['resources.read'],
      },
      {
        id: 'my-bookings',
        label: 'Mis reservas',
        description: 'Consulta y cancela tus agendamientos.',
        icon: calendarOutline,
        path: '/admin/bookings',
        requiredPermissions: ['bookings.read.own'],
      },
      {
        id: 'availability',
        label: 'Disponibilidad',
        description: 'Publica horarios de tus canchas.',
        icon: calendarOutline,
        path: '/admin/availability',
        requiredPermissions: ['availability.manage'],
      },
      {
        id: 'managed-bookings',
        label: 'Reservas recibidas',
        description: 'Consulta quién reservó tus canchas.',
        icon: peopleOutline,
        path: '/admin/managed-bookings',
        requiredPermissions: ['bookings.read.manage'],
      },
    ],
  },
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
        label: 'Organizaciones',
        // Feature 010: listado/detalle/CRUD de organizaciones y sedes. Las solicitudes de
        // acceso (feature 008/016) se mantienen accesibles como sección secundaria en
        // /admin/organizations/access-requests, sin duplicar este ítem del menú.
        description: 'Administra organizaciones y sus sedes.',
        icon: businessOutline,
        path: '/admin/organizations',
        requiredPermissions: ['organizaciones.read'],
      },
    ],
  },
];
