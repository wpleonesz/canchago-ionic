# 014 · Experiencia móvil de reservas para futbolistas

**Estado:** propuesta

## Qué hace

Adapta la aplicación por capacidades reales: el Futbolista descubre canchas habilitadas, consulta fechas y franjas disponibles, confirma una reserva y revisa sus agendamientos sin pertenecer administrativamente a ninguna cancha. El Gestor conserva exclusivamente navegación y operaciones administrativas dentro de su alcance.

## Por qué

Hoy la app ya registra al Futbolista sin organización, pero su experiencia autenticada solo muestra el perfil y los módulos administrativos existentes. No hay tipos, servicios, hooks, rutas ni componentes de recursos/reservas porque el backend aún no expone ese dominio. Además, el formulario administrativo `UserForm` exige siempre una organización por reflejar el contrato generalizado actual del backend.

## Contrato de API consumido

Depende del contrato propuesto y aún no implementado en `canchago/spec/features/022-reservas-futbolistas/`:

- `GET /api/resources` — catálogo paginado de recursos activos.
- `GET /api/resources/{resourceId}` — detalle visible.
- `GET /api/resources/{resourceId}/availability?from=&to=` — disponibilidad calculada por backend.
- `POST /api/bookings` — confirma para el usuario de sesión; no envía user ID.
- `GET /api/bookings` y `GET /api/bookings/{bookingId}` — reservas propias.
- `DELETE /api/bookings/{bookingId}` — cancelación propia según estado.
- Contratos administrativos anidados para Gestor, solo si la primera entrega móvil incluye esas pantallas.

No se implementará consumo hasta que los endpoints y envelopes finales estén aprobados y verificados en el código backend.

## Criterios de aceptación

- [ ] El registro de Futbolista solicita solo cuenta y perfil; no muestra organización, sede ni cancha.
- [ ] Crear o editar administrativamente un Futbolista no obliga a seleccionar organización; un rol tenant sí conserva esa exigencia.
- [ ] La navegación del Futbolista muestra descubrir canchas y mis reservas, sin módulos administrativos.
- [ ] Los guards usan roles/permisos devueltos por sesión y el backend respalda cada restricción.
- [ ] El catálogo muestra únicamente datos devueltos por el backend y contempla loading, vacío, error y retry.
- [ ] El detalle permite elegir fecha y una franja disponible, con estados loading, vacío y error.
- [ ] La confirmación muestra resumen, evita doble envío y usa alertas/componentes Ionic existentes.
- [ ] Un 409 por franja tomada o reserva solapada informa en español y refresca disponibilidad antes de permitir reintento.
- [ ] Los errores de red permiten reintentar sin crear reservas duplicadas desde la UI.
- [ ] “Mis reservas” lista únicamente las reservas propias devueltas por backend y contempla loading, vacío, error y success.
- [ ] Un 401 conduce al flujo de autenticación y un 403 muestra acceso denegado sin revelar controles administrativos.
- [ ] La interfaz es responsive, móvil, accesible, compatible con modo oscuro y evita tarjetas anidadas.
- [ ] No se duplica lógica de disponibilidad ni se considera libre una franja basándose solo en estado local.
- [ ] Tipos, Zod, servicios Axios, hooks TanStack Query y navegación respetan las capas actuales.
- [ ] Los flujos actuales de Gestor, Administrador, perfil, registro y autenticación no sufren regresiones.

### Contratos y tipos (obligatorio)

- [ ] `src/types/api/resources.ts` y `src/types/api/bookings.ts` reflejan exactamente el backend.
- [ ] `../../constitution/api-integration.md` documenta el nuevo contrato verificado.

## Fuera de alcance

- Inventar endpoints mientras la feature backend 022 permanezca sin aprobar/implementar.
- Pagos, mapas, reseñas, notificaciones push, torneos y reservas recurrentes.
- Reimplementar en el cliente las reglas o la protección de concurrencia del backend.
- Rediseñar globalmente la app o completar deuda UI ajena a este flujo.

