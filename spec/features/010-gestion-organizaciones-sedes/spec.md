# 010 · Gestión de Organizaciones y Sedes (administración)

**Estado:** en curso

## Qué hace

Pantalla administrativa bajo `/admin/organizations` (reemplaza y extiende el placeholder actual, que hoy solo aprueba solicitudes de registro) que permite a un administrador autorizado:

- Listar organizaciones reales del backend, con búsqueda por nombre/correo, ordenamiento y paginación del lado servidor.
- Consultar el detalle de una organización.
- Crear una organización nueva mediante un formulario.
- Editar una organización existente con ese mismo formulario, precargado con sus datos actuales.
- Desde el detalle de una organización, ver una sección de **Sedes** que lista las sedes (`Venue`) de esa organización, con su propia búsqueda/orden/paginación.
- Crear una sede nueva y editar una sede existente mediante un formulario reutilizable, siempre asociada a la organización de la que partió la navegación — sin volver a seleccionarla manualmente.
- Acceder, desde la misma pantalla, a las **Solicitudes de acceso** (feature `008` de este repo, ya implementada) que hoy ocupan en solitario `/admin/organizations`, ahora reubicadas como sección secundaria del mismo módulo en vez de duplicar un punto de entrada del menú.

Sin frontend propio de canchas/reservas: ese dominio no existe todavía en el backend (ver "Fuera de alcance").

## Por qué

El backend (`canchago`, feature `004-gestion-organizaciones-sedes`, **hecho ✅**) ya expone un CRUD completo de organizaciones y sedes, pero `canchago-ionic` no tiene ninguna pantalla que lo consuma: `/admin/organizations` solo implementa la aprobación de solicitudes de registro público (feature `008`/backend `016`). Un administrador no puede hoy crear una organización manualmente, editarla, ni gestionar sus sedes desde la app — vacío operativo real del área administrativa, listado como backlog ("Gestión de organizaciones y sedes (móvil)") en `spec/constitution/roadmap.md`.

## Contrato de API consumido

_Verificado leyendo `canchago` directamente el 2026-08-29, **después** de implementar ahí la feature backend `019-endurecimiento-organizaciones-sedes` (código real de `pages/api/organizaciones/**`, `services/organizaciones-sedes/`, `database/organizaciones-sedes/`, `validations/organizaciones-sedes/`, `prisma/schema.prisma` — nunca `/api/docs`, que además hoy no compila del todo por la deuda Zod/OpenAPI de la feature backend `010`)._

Modelos reales: `Organization` (tabla `organizations`) y `Venue` (tabla `venues` — **el modelo Prisma se llama `Venue`, no `Sede`**; "sede" es solo el término en español usado en rutas/carpetas del backend). No existe ningún modelo `Court`/`Cancha` — confirmado por lectura completa de `prisma/schema.prisma`; "Gestor de Cancha" es únicamente el nombre de un rol RBAC creado por el flujo de registro público, no una entidad de negocio.

- `GET /api/organizaciones?page&pageSize&search&orderBy=name|createdAt&order=asc|desc` — permiso `organizaciones.read`. Envelope real **`{ organizations: Organization[], meta }`, no `{ data, meta }`** (mismo bug de documentación ya anotado en `api-integration.md` §7). El backend filtra por alcance: un actor sin el rol global `Administrador` solo recibe organizaciones donde tiene un `UserRole` directo o vía rol de esa organización; un administrador global las recibe todas. Cada organización incluye **`venuesCount`** (entero, sedes activas, resuelto con `_count` en la misma consulta — sin petición adicional por fila).
- `POST /api/organizaciones` — permiso `organizaciones.manage`. Body: `{ name, legalName?, taxIdentification?, email?, phone?, domain? }`. `status` nunca se acepta en el body — el backend siempre crea con `status: 'ACTIVE'`. Nombre único a nivel de plataforma, comparación case-insensitive tras normalizar espacios (columna `normalizedName` dedicada) — nombre duplicado responde `409`. Responde `201 { data: Organization }`.
- `GET /api/organizaciones/{organizationId}` — permiso `organizaciones.read` **y alcance real sobre esa organización**: un actor no-administrador-global sin alcance recibe `404` opaco (no `403`, no revela que el recurso existe fuera de su alcance).
- `PATCH /api/organizaciones/{organizationId}` — permiso `organizaciones.manage` y mismo alcance que el `GET`. Mismo body que create más **`expectedUpdatedAt` obligatorio** (ISO datetime, el `updatedAt` recibido en el último `GET`) — concurrencia optimista real: si no coincide con el valor actual, responde `409` sin aplicar ningún cambio. Tampoco acepta `status`.
- `GET /api/organizaciones/{organizationId}/sedes?page&pageSize&search&orderBy=name|createdAt&order=asc|desc` — permiso `organizaciones.read` y alcance sobre `organizationId`. Envelope real **`{ venues: Venue[], meta }`**.
- `POST /api/organizaciones/{organizationId}/sedes` — permiso `organizaciones.manage` y alcance sobre `organizationId`. Body: `{ name, address?, phone?, email? }` — **nunca acepta `organizationId` en el body**, se toma exclusivamente del segmento de ruta. Si la organización no existe (o está borrada), responde `404` (ya no `500`). `status` siempre `'ACTIVE'`.
- `GET/PATCH/DELETE /api/organizaciones/{organizationId}/sedes/{sedeId}` — permisos `organizaciones.read`/`.manage` y alcance sobre `organizationId`. **La sede debe pertenecer exactamente a esa organización**: un `sedeId` real de otra organización responde `404` opaco, nunca los datos de esa sede (IDOR cerrado, ver "Estado de la dependencia de backend" abajo). `PATCH` exige `expectedUpdatedAt` con el mismo criterio de concurrencia optimista que organizaciones.
- Valores reales de `Organization.status`/`Venue.status` (campo de texto libre, sin `CHECK` ni enum): solo `'ACTIVE'` y `'PENDING_APPROVAL'` se escriben en todo el código actual. La UI debe tratarlo como texto, no como un enum cerrado.
- El catálogo de permisos sembrado (`prisma/seed.ts`) incluye `sedes.read`/`sedes.manage`, pero **ningún endpoint los verifica** — los tres endpoints de sedes usan exclusivamente `organizaciones.read`/`organizaciones.manage`. Esta feature gatea toda acción de sede con esos dos códigos, nunca con `sedes.*`.
- No existe endpoint "mis organizaciones" (no se necesita: el listado ya llega filtrado por alcance desde el servidor).
- Reutilizados sin cambio de contrato: `GET /api/organizaciones/access-requests`, `.../access-requests/{id}/approve`, `.../access-requests/{id}/reject` (feature `008`/backend `016`, ya documentados en `api-integration.md` §6.1).

### Estado de la dependencia de backend — resuelta por la feature `019` (2026-08-29)

La versión original de esta spec documentaba siete gaps reales de backend como bloqueantes. Se implementó `canchago/spec/features/019-endurecimiento-organizaciones-sedes/` (mismo ciclo de trabajo) aplicando el patrón ya probado por `018` (roles): guardia de alcance (`ensureOrganizationScope`), concurrencia optimista, transacciones con auditoría. Estado real, verificado leyendo el código y con 33 pruebas de servicio/base de datos verdes en `canchago`:

1. **IDOR de sede — cerrado.** `sedeDb.findVenue`/`getUnique` ahora exigen `{ id: sedeId, organizationId, deletedAt: null }` en el `where`, no solo `id`. Verificado con tests de `database/organizaciones-sedes/sede.db.test.ts` y `services/organizaciones-sedes/sede.service.test.ts` en `canchago`.
2. **Scope en operaciones por ID — cerrado.** `ensureOrganizationScope` se invoca antes de leer/editar/borrar organización o sede individual; sin alcance responde `404` opaco.
3. **Creación de sede bajo organización inexistente — cerrado.** `sedeDb` verifica la organización antes de crear; `404` en vez de `500`.
4. **Concurrencia optimista — cerrado.** `expectedUpdatedAt` obligatorio y verificado vía `updateMany` en ambos `PATCH`.
5. **Unicidad de nombre de organización — cerrado.** Columna `normalizedName` con `@unique` real (case-insensitive), no `@@unique([name])` directo.
6. **Auditoría — cerrado.** `AuditAction` ganó `ORGANIZATION_CREATED/UPDATED`, `VENUE_CREATED/UPDATED`, escritos dentro de la misma transacción que la mutación.
7. **`venuesCount` — cerrado.** Ver contrato de `GET /organizaciones` arriba.

**Limitación honesta que sí permanece:** la feature backend `019` no tiene todavía pruebas de integración con Postgres real y sesión real (documentado en su propio `tasks.md`) — la cobertura hoy es a nivel de servicio/base de datos con mocks, no del camino HTTP-a-Postgres completo. `019` tampoco pasó a "Hecho" en el roadmap de `canchago` porque comparte el mismo bloqueo preexistente de `yarn build` (deuda Zod/OpenAPI, ítem `010`) que ya afecta a `018`. Esta feature de frontend consume el contrato ya implementado y verificado a ese nivel; no se afirma una garantía de seguridad más fuerte que la que el propio backend documenta para sí mismo.

## Criterios de aceptación

_Condiciones verificables, redactadas para comprobarse con un sí/no. Marca `[x]` al cumplirse._

**Listado de organizaciones**

- [ ] Un administrador con `organizaciones.read` ve, en `/admin/organizations`, un listado real proveniente de `GET /api/organizaciones` — ningún dato hardcodeado.
- [ ] Las columnas mostradas son únicamente campos reales del modelo `Organization` visibles en el listado: nombre, identificación tributaria (si existe), estado, contacto (email/teléfono si existen) y número de sedes (`venuesCount`, ya expuesto por el backend en la misma consulta — sin petición adicional por fila).
- [ ] El listado soporta búsqueda por nombre/correo, ordenamiento (`name`/`createdAt`, asc/desc) y paginación, todo resuelto por el servidor vía los parámetros reales del endpoint — sin descargar todo el catálogo ni paginar en cliente.
- [ ] Estados `loading` (skeleton), `error` (con reintento) y `empty` (mensaje distinto si hay búsqueda activa) están cubiertos, reutilizando `AppDataList`.
- [ ] Un administrador no-global ve exactamente las organizaciones que el backend le filtra (las de su propio alcance); nunca todas — reflejo directo del filtro real del listado, sin lógica de alcance propia en el frontend.
- [ ] Existe una acción "Nueva organización" visible solo con `organizaciones.manage`, que navega a `/admin/organizations/new`.
- [ ] Cada fila tiene una acción "Consultar" (siempre, con `organizaciones.read`) y una acción "Editar" (solo con `organizaciones.manage`).
- [ ] Un botón/enlace visible con `organizaciones.manage` navega a `/admin/organizations/access-requests` (las solicitudes de acceso ya implementadas), sin duplicar entrada en el menú vertical.

**Detalle y sedes de una organización**

- [ ] `/admin/organizations/{organizationId}` muestra los datos reales de la organización (`GET /api/organizaciones/{organizationId}`) y, en una sección "Sedes" separada del bloque de datos generales, el listado de sus sedes (`GET /api/organizaciones/{organizationId}/sedes`) con su propia búsqueda/orden/paginación.
- [ ] Estados `loading`/`error`/`empty`/`success` cubiertos de forma independiente para el bloque de organización y para el bloque de sedes.
- [ ] Existe una acción "Nueva sede" (solo con `organizaciones.manage`) que navega a `/admin/organizations/{organizationId}/venues/new` — el `organizationId` viaja por la ruta, nunca se le pide al usuario que lo seleccione de nuevo.
- [ ] Organización inexistente o fuera de alcance visible (404 real del backend) produce un estado de error controlado, sin exponer detalles técnicos.

**Formulario de organización (crear/editar)**

- [ ] El mismo componente de formulario sirve para crear (`/admin/organizations/new`) y editar (`/admin/organizations/{organizationId}/edit`); en edición, precarga los datos reales vía `GET`.
- [ ] Campos editables: `name` (obligatorio, 1–150 caracteres, normalizado sin espacios repetidos), `legalName` (opcional, ≤200), `taxIdentification` (opcional, ≤30, sin formato inventado — el backend no valida ningún patrón), `email` (opcional, formato válido o vacío), `phone` (opcional, ≤20, sin formato inventado), `domain` (opcional, ≤255).
- [ ] `status`, `id`, `createdAt`, `updatedAt`, `deletedAt` nunca se envían ni se pueden editar desde este formulario — no existen como campos editables en la UI, y el schema de request no los incluye aunque alguien manipule el DOM/estado.
- [ ] Doble envío bloqueado mientras la mutación está en curso; botón "Guardar" deshabilitado sin cambios (`isDirty`) o con errores de validación.
- [ ] Cambios sin guardar muestran confirmación antes de salir (mismo patrón que `RoleFormPage`: `Prompt` + `AppConfirmDialog`).
- [ ] El formulario de edición envía `expectedUpdatedAt` (tomado del `updatedAt` recibido en el `GET` de detalle) en cada `PATCH`; un `409` real (nombre duplicado o conflicto de concurrencia) se muestra con un mensaje claro y una acción para recargar los datos actuales, mismo patrón que `RoleFormPage`.
- [ ] Nombre de organización duplicado (comparación case-insensitive) produce un `409` real del backend, mostrado junto al campo `name`.
- [ ] Tras crear o editar, se navega al detalle con los datos ya actualizados (`setQueryData` + invalidación selectiva), sin recargar toda la app ni refetch ciego de listados no relacionados.

**Formulario de sede (crear/editar)**

- [ ] El mismo componente sirve para crear (`/admin/organizations/{organizationId}/venues/new`) y editar (`/admin/organizations/{organizationId}/venues/{venueId}/edit`); en edición, precarga los datos reales.
- [ ] Campos editables: `name` (obligatorio, 1–150), `address` (opcional, ≤500, textarea), `phone` (opcional, ≤20), `email` (opcional, formato válido o vacío) — únicamente los campos reales que el backend acepta.
- [ ] `organizationId` nunca es un campo del formulario: se deriva siempre del parámetro de ruta y nunca se le pide al usuario ni se envía como valor editable — coherente con que `createSedeSchema`/`updateSedeSchema` del backend tampoco lo aceptan en el body.
- [ ] `status`, `id`, `createdAt`, `updatedAt`, `deletedAt` no son editables, igual que en el formulario de organización.
- [ ] El formulario de edición envía `expectedUpdatedAt`; nombre de sede duplicado dentro de la misma organización, o conflicto de concurrencia, producen un `409` real del backend, mostrado junto al campo correspondiente (mensaje "Ya existe una sede con ese nombre en esta organización." para el duplicado).
- [ ] Doble envío bloqueado, cambios sin guardar con confirmación, igual que el formulario de organización.
- [ ] Tras crear/editar una sede, la sección de sedes del detalle de su organización se actualiza sin recargar toda la pantalla (invalidación selectiva de la query de sedes de esa organización).

**Permisos y seguridad**

- [ ] Un usuario sin `organizaciones.manage` no ve los botones de crear/editar (organización ni sede); si de todas formas navega directo a una URL de creación/edición, `AdminRoute` bloquea la vista con `AdminAccessDeniedPage` (mismo guard que roles/usuarios).
- [ ] Un usuario sin `organizaciones.manage` que fuerza `POST`/`PATCH` directamente contra la API (fuera de la UI) recibe `403` del backend real — la UI nunca es la única barrera.
- [ ] Payloads manipulados con campos protegidos (`id`, `status`, `organizationId` en sede, `deletedAt`) no alteran esos valores: el backend los ignora (schemas `.strict()` que los rechazan) y la capa de escritura los reconstruye campo por campo — verificado como comportamiento real, no asumido.
- [ ] Un `sedeId`/`organizationId` de un recurso fuera del alcance del actor (otra organización, o inexistente) responde `404` real del backend — el frontend nunca decide esto por su cuenta, solo refleja la respuesta real (feature backend `019`).

### Contratos y tipos (obligatorio)

- [ ] Los tipos TypeScript de request/response en `src/types/api/organizaciones.ts` reflejan exactamente el contrato real (`Organization`, `Venue`, envelopes `{organizations,meta}`/`{venues,meta}` normalizados en la capa `services/api/`, sin `any`).
- [ ] `spec/constitution/api-integration.md` tiene una entrada fechada nueva con el contrato completo de organizaciones/sedes usado por esta feature, incluyendo `expectedUpdatedAt` y `venuesCount`.

## Fuera de alcance

- **CRUD de canchas/recursos reservables.** No existe ningún modelo `Court`/`Cancha` en `canchago` (confirmado en `prisma/schema.prisma`); no se inventa. "Gestor de Cancha" es solo un nombre de rol RBAC.
- **Pruebas de integración de backend con Postgres real** para los gaps cerrados por la feature `019` (IDOR, concurrencia, atomicidad de auditoría) — quedaron pendientes en esa feature (ver su `tasks.md`); no son responsabilidad de este repositorio, que solo consume el contrato ya verificado a nivel de servicio/base de datos.
- **Eliminación/desactivación de organizaciones o sedes desde esta pantalla.** El backend sí soporta `DELETE` (soft delete transaccional, con cascada a sedes al eliminar una organización), pero el alcance pedido para esta feature es listar/consultar/crear/editar; no se agrega UI de borrado. Si se necesita, es una extensión futura sobre este mismo módulo.
- **Mover una sede de una organización a otra.** El backend nunca acepta `organizationId` en el body de sede — no es una operación soportada; no se construye UI para ella.
- **Pantalla global de "todas las sedes"** fuera del contexto de una organización. No existe ese caso de uso hoy; toda sede se gestiona desde el detalle de su organización.
- **Cambios al flujo de solicitudes de acceso** (feature `008`/backend `016`): se reubica su punto de entrada dentro de este módulo, pero su lógica, contrato y pantalla (`AccessRequestsPage`) no cambian.
- **Resolver que una organización rechazada quede permanentemente en `PENDING_APPROVAL`** (el backend nunca transiciona `Organization.status` al rechazar una solicitud) — comportamiento real documentado, no corregido por esta feature.
