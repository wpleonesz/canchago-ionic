# 010 · Gestión de Organizaciones y Sedes (administración) — Plan

_Cómo se implementa lo descrito en `spec.md`. Debe respetar la `constitution/`._

## Enfoque

Extender el módulo `features/organizations/` ya existente (hoy solo `hooks/useOrganizations.ts`, mínimo, construido para el picker de la feature `005`) hasta convertirlo en un módulo administrativo completo, replicando exactamente el patrón ya validado por `features/roles/` (feature backend `018`, contraparte Ionic "en cierre"): `Module` con `<Switch>` de `AdminRoute`, `ListPage` con `AppDataList` + filtros server-side, `FormPage` único para crear/editar con React Hook Form + Zod + `Prompt` de cambios sin guardar, `DetailPage` de solo lectura. Las sedes no son un módulo aparte: viven como una sección dentro de `OrganizationDetailPage` y sus propias rutas de formulario anidadas bajo `/admin/organizations/{organizationId}/venues/...`, coherente con que el backend nunca permite gestionar una sede fuera del contexto de su organización.

La pieza distinta respecto a `roles` es de **enrutamiento**: `/admin/organizations` hoy es dueño exclusivo de `AccessRequestsModule` (`AdminLayout.tsx:73-75`). Este plan reestructura esa ruta para que `OrganizationsModule` la posea, y reubica `AccessRequestsModule` como una subruta interna (`/admin/organizations/access-requests`) — evita duplicar el ítem de navegación "Organizaciones" del menú vertical, tal como exige la spec.

## Implementación

1. **`src/types/api/organizaciones.ts`** — Reescribir/ampliar (hoy solo tiene `OrganizationSummary` para el picker):
   - `OrganizationDto` (`id, name, legalName, taxIdentification, email, phone, domain, status, createdAt, updatedAt` — todos los campos reales de `selectOrganizationFields` en `canchago/database/organizaciones-sedes/organizacion.db.ts:19-30`, `status: string` sin enum cerrado).
   - `OrganizationListQuery` (`page?, pageSize?, search?, orderBy?: 'name'|'createdAt', order?: 'asc'|'desc'`), `OrganizationListResponse` (`{ data: OrganizationDto[], meta }`), `OrganizationListRawResponse` (`{ organizations, meta }`, envelope real).
   - `CreateOrganizationRequest`/`UpdateOrganizationRequest` (`name, legalName?, taxIdentification?, email?, phone?, domain?` — nunca `status`).
   - `VenueDto` (`id, organizationId, name, address, phone, email, status, createdAt, updatedAt`, reflejo de `selectSedeFields` en `sede.db.ts:19-29`).
   - `VenueListQuery`/`VenueListResponse`/`VenueListRawResponse` (`{ venues, meta }`), `CreateVenueRequest`/`UpdateVenueRequest` (`name, address?, phone?, email?` — nunca `organizationId` ni `status`).
   - Mantener `OrganizationSummary` como alias reducido (`Pick<OrganizationDto, 'id' | 'name'>`) para no romper `OrganizationPicker`/`RolesListPage`, que solo usan `id`/`name`.
   - Corregir el comentario obsoleto que remite a "backlog 006" — esa feature es ahora esta (`010`).

2. **`src/services/api/endpoints/organizaciones.ts`** — Ampliar (hoy solo `getOrganizations(page, pageSize)`):
   - `getOrganizations(query: OrganizationListQuery)` — normaliza `{organizations,meta}` → `{data,meta}` en esta capa (mismo patrón ya usado), aceptando `search`/`orderBy`/`order` además de paginación.
   - `getOrganization(organizationId)`, `createOrganization(body)`, `updateOrganization(organizationId, body)` — `GET/POST/PATCH /organizaciones[...]`, envelope estándar `{data}`.
   - `getVenues(organizationId, query: VenueListQuery)` — normaliza `{venues,meta}` → `{data,meta}`.
   - `getVenue(organizationId, venueId)`, `createVenue(organizationId, body)`, `updateVenue(organizationId, venueId, body)` — mismas rutas anidadas reales.

3. **`src/validation/organizaciones.ts`** (nuevo, mismo patrón que `validation/roles.ts`):
   - `organizationFormSchema` — `name` (trim + colapsa espacios, 1–150), `legalName`/`taxIdentification`/`phone` opcionales con los mismos límites del backend (sin regex inventado), `email` opcional válido o vacío, `domain` opcional ≤255.
   - `venueFormSchema` — `name` (trim + colapsa espacios, 1–150), `address` opcional ≤500, `phone` opcional ≤20, `email` opcional válido o vacío.
   - Tipos `OrganizationFormValues`/`VenueFormValues` inferidos.

4. **`src/features/organizations/hooks/useOrganizations.ts`** — Ampliar sin romper la firma usada hoy por `OrganizationPicker`/`RolesListPage` (`useOrganizations(page?, pageSize?)` sigue funcionando; se añade una sobrecarga/objeto de query opcional para `search`/`orderBy`/`order`):
   - `useOrganizations(query)`, `useOrganization(organizationId)`, `useCreateOrganization()`, `useUpdateOrganization(organizationId)` — mismo patrón de `queryClient.setQueryData` + `invalidateQueries` que `useRoles.ts`.

5. **`src/features/organizations/hooks/useVenues.ts`** (nuevo) — `useVenues(organizationId, query)`, `useVenue(organizationId, venueId)`, `useCreateVenue(organizationId)`, `useUpdateVenue(organizationId, venueId)`. Las queries de sede se invalidan por `organizationId` (`['venues', organizationId, ...]`), nunca globalmente.

6. **`src/features/organizations/components/OrganizationForm.tsx`** (nuevo) — Mismo esqueleto que `RoleForm.tsx` (React Hook Form + `zodResolver` + `Controller` + `AppInput`/`IonTextarea` para `domain` no aplica, es `AppInput`; sin selector de permisos). Sin campo `status`: si `mode === 'edit'`, se muestra como texto informativo de solo lectura fuera del `<form>`, tomado de `defaultValues`, nunca como input controlado.

7. **`src/features/organizations/components/VenueForm.tsx`** (nuevo) — Igual patrón, campos `name`/`address` (`IonTextarea`)/`phone`/`email`. Sin campo de organización.

8. **`src/features/organizations/components/OrganizationListItem.tsx`** (nuevo) — Card estilo `RoleListItem.tsx`: nombre, badge de `status`, identificación tributaria si existe, contacto (email/teléfono) si existe; acciones "Consultar" (siempre) y "Editar" (`PermissionGuard permission="organizaciones.manage"`).

9. **`src/features/organizations/components/VenueListItem.tsx`** (nuevo) — Mismo patrón, campos de sede; acción "Editar" con el mismo permiso.

10. **`src/features/organizations/pages/OrganizationsListPage.tsx`** (nuevo) — Mismo esqueleto que `RolesListPage.tsx`: `AppSearchInput` (debounced) + `AppSelect` de orden + `AppDataList`. Sin selector de organización (esta lista _es_ la de organizaciones). Botón "Nueva organización" (`PermissionGuard organizaciones.manage`) y enlace a `/admin/organizations/access-requests` (`PermissionGuard organizaciones.manage`).

11. **`src/features/organizations/pages/OrganizationDetailPage.tsx`** (nuevo) — Bloque de datos generales (igual estructura `<dl>` que `RoleDetailPage.tsx`) + sección `<section aria-labelledby="organization-venues-title">` con su propio `AppSearchInput`/`AppSelect`/`AppDataList` de sedes, alimentada por `useVenues(organizationId, {...})`. Botón "Editar organización" y "Nueva sede", ambos con `PermissionGuard organizaciones.manage`.

12. **`src/features/organizations/pages/OrganizationFormPage.tsx`** (nuevo) — Mismo esqueleto que `RoleFormPage.tsx`: `mode: 'create' | 'edit'`, `organizationId` desde `useParams` en modo edición, `Prompt` + `AppConfirmDialog` de cambios sin guardar, manejo de 409 con mensaje genérico (ver spec, no se asume que el 409 de nombre duplicado de organización ocurra hoy).

13. **`src/features/organizations/pages/VenueFormPage.tsx`** (nuevo) — Igual patrón; `organizationId` **siempre** desde `useParams` (nunca query string ni input), `venueId` desde `useParams` en modo edición. Maneja el 409 real de sede duplicada con el mensaje del backend.

14. **`src/features/organizations/pages/OrganizationsModule.tsx`** (nuevo) — Router interno, mismo patrón que `RolesModule.tsx`/`UsersModule.tsx`, con las rutas literales (`new`, `access-requests`) declaradas **antes** que la ruta paramétrica `:organizationId`, siguiendo la advertencia ya documentada en `UsersModule.tsx`:

```
/admin/organizations                                   → OrganizationsListPage        (organizaciones.read)
/admin/organizations/new                                → OrganizationFormPage create  (organizaciones.manage)
/admin/organizations/access-requests                    → AccessRequestsModule         (delegado, permiso propio interno)
/admin/organizations/:organizationId/edit                → OrganizationFormPage edit    (organizaciones.manage)
/admin/organizations/:organizationId/venues/new          → VenueFormPage create         (organizaciones.manage)
/admin/organizations/:organizationId/venues/:venueId/edit → VenueFormPage edit          (organizaciones.manage)
/admin/organizations/:organizationId                     → OrganizationDetailPage       (organizaciones.read)
```

15. **`src/features/access-requests/pages/AccessRequestsModule.tsx`** — Modificar la única ruta interna de `/admin/organizations` a `/admin/organizations/access-requests` (una línea). `AccessRequestsPage.tsx` no cambia; se le añade un botón "Volver a organizaciones" hacia `/admin/organizations`.

16. **`src/layouts/AdminLayout.tsx`** — Cambiar `<Route path="/admin/organizations"><AccessRequestsModule /></Route>` por `<Route path="/admin/organizations"><OrganizationsModule /></Route>` (línea 73-75).

17. **`src/features/admin/navigation/admin-navigation.ts`** — Ítem `organizations`: `label` pasa de "Solicitudes de acceso" a "Organizaciones", `description` a "Administra organizaciones y sus sedes.", `requiredPermissions` de `['organizaciones.manage']` a `['organizaciones.read']` (ver Decisiones). El test `admin-capabilities.test.ts` que cuenta ítems visibles con permisos específicos deberá revisarse junto con este cambio.

18. **`src/features/organizations/organizations.css`** (nuevo) — Estilos propios, mismo criterio visual que `roles.css` (tarjetas tipo Facebook: encabezado con eyebrow/título, `dl` de detalle, secciones separadas por espaciado, badges de estado).

19. **`spec/constitution/api-integration.md`** — Nueva entrada fechada en §10 con el contrato verificado de organizaciones/sedes y los 7 puntos de la dependencia de backend (mismo nivel de detalle que la entrada de la feature `018`).

20. **`spec/constitution/roadmap.md`** — Mover la línea de backlog "Gestión de organizaciones y sedes (móvil)" a "Siguiente 🔜" apuntando a esta feature `010`.

## Decisiones

- **`/admin/organizations` pasa a ser el listado de organizaciones, no las solicitudes de acceso.** Alternativa descartada: crear una ruta nueva (`/admin/organizations-management`) para no tocar la existente — se descarta porque duplicaría el ítem del menú vertical y contradice explícitamente el requerimiento de no duplicar accesos administrativos relacionados. El costo es una migración de ruta de una feature ya "Hecha" (`008`), mitigado a un cambio de una línea en `AccessRequestsModule.tsx` y otra en `AdminLayout.tsx`.
- **El permiso del ítem de navegación baja de `organizaciones.manage` a `organizaciones.read`.** Antes solo tenía sentido para quien aprueba solicitudes (`.manage`); ahora la acción primaria es _ver_ el listado, igual que `users`/`roles` en el mismo menú, que usan `.read`. Un actor con solo `.read` ve el listado y el detalle, pero ningún botón de crear/editar ni el enlace a solicitudes de acceso (ese enlace sigue detrás de `PermissionGuard organizaciones.manage`).
- **Las sedes no tienen módulo ni rutas propias fuera de una organización.** El backend nunca permite crear/editar una sede sin su organización en el path, y no hay ningún caso de uso de "todas las sedes" hoy — una pantalla global sería una entidad de navegación sin contrato de API que la respalde.
- **No se muestra número de sedes por organización en el listado.** El backend no expone `_count`; pedirlo por fila sería N+1 explícito, prohibido por la constitución de este repo y la de `canchago`. Se documenta como mejora condicionada a que el backend lo agregue (punto 7 de la dependencia).
- **El formulario no incluye `status`.** El backend nunca lo acepta en `create`/`update` — incluir un campo que el servidor ignora en silencio induciría a un administrador a creer que cambió el estado cuando no fue así. Se muestra como dato informativo de solo lectura en edición.
- **No se implementa concurrencia optimista en frontend para organización/sede.** El backend no expone `expectedUpdatedAt` para estos recursos (a diferencia de `Role`); simularlo en cliente sin respaldo del servidor daría una falsa sensación de protección. Se documenta como riesgo aceptado (ver Riesgos) y se limita la mitigación real disponible: aviso de cambios sin guardar local (`Prompt` + `AppConfirmDialog`), igual que en `roles`.
- **No se prueba ni se afirma protección contra duplicados de nombre de organización.** El hallazgo de que `Organization.name` no tiene `@@unique` real es un hecho verificado en el schema — construir una prueba que espere un 409 fallaría siempre; documentarlo como gap es más honesto que fingir cobertura.
- **IDOR de sede no se cierra desde el frontend.** Es técnicamente imposible sin cambios en `canchago` (el backend nunca valida `sedeId` contra `organizationId`). La UI solo puede evitar _generar_ ese acceso cruzado desde su propia navegación (nunca ofrece un `venueId` fuera del listado ya scoped por organización); no puede impedir que alguien lo explote manipulando la URL directamente contra la API.

## Riesgos

- **Falsa sensación de seguridad multi-tenant.** Si esta pantalla se lanza sin dejar claro el gap de IDOR/scope de backend (spec, "Dependencia de backend"), un administrador podría asumir que la separación entre organizaciones es real a nivel de API. Mitigación: la spec lo documenta explícitamente como no resuelto, sin criterios de aceptación que lo den por cerrado; se recomienda registrar la feature de hardening de backend antes de dar por "segura" esta pantalla para administradores no-globales.
- **Migración de ruta rompe un deep link ya en uso.** `/admin/organizations` cambia de "solicitudes de acceso" a "listado de organizaciones"; cualquier enlace guardado (favorito, notificación) al comportamiento anterior ahora aterriza en otra pantalla. Mitigación: la nueva ruta de solicitudes (`/admin/organizations/access-requests`) queda enlazada visiblemente desde el listado nuevo, y es un cambio de una feature con bajo uso actual (recién "Hecha").
- **Edición concurrente silenciosa.** Sin `expectedUpdatedAt` de backend, dos administradores editando la misma organización/sede al mismo tiempo no reciben ningún aviso — el último `PATCH` sobrescribe al primero sin conflicto detectado. Mitigación real disponible: ninguna a nivel de datos; se documenta como riesgo aceptado y candidato al mismo hardening de backend que resolvería el punto 4 de la dependencia.
- **`admin-capabilities.test.ts` puede quedar desalineado.** Cambiar el permiso requerido del ítem `organizations` de `.manage` a `.read` afecta el test que cuenta ítems visibles por combinación de permisos (`admin-capabilities.test.ts:30-37`). Mitigación: actualizar ese test en el mismo cambio, no como ajuste posterior.
