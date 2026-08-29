# 010 · Gestión de Organizaciones y Sedes (administración) — Tareas

_Checklist accionable derivada del `plan.md`. Tareas pequeñas y concretas; marca `[x]` al completarlas._

## Tipos y contrato

- [x] Reescrito `src/types/api/organizaciones.ts`: `OrganizationDto` (con `venuesCount?`), `OrganizationListQuery/Response/RawResponse`, `CreateOrganizationRequest`, `UpdateOrganizationRequest` (con `expectedUpdatedAt` requerido), `VenueDto`, `VenueListQuery/Response/RawResponse`, `CreateVenueRequest`, `UpdateVenueRequest`; `OrganizationSummary` se mantiene como alias reducido; comentario obsoleto corregido.
- [x] `api-integration.md` (§10) actualizado con el contrato completo, incluyendo `expectedUpdatedAt`/`venuesCount` y el estado real (resuelto) de los siete puntos de dependencia de backend — la feature `019` se implementó en el mismo ciclo de trabajo, así que la entrada documenta el contrato ya endurecido, no uno pendiente.

## Servicios (capa API)

- [x] `src/services/api/endpoints/organizaciones.ts` ampliado: `getOrganizations(query)`, `getOrganization`, `createOrganization`, `updateOrganization`, `getVenues`, `getVenue`, `createVenue`, `updateVenue` — todo en el mismo archivo (no creció lo suficiente para justificar `endpoints/venues.ts` aparte).
- [ ] **No se crearon tests unitarios dedicados a la normalización de envelope** (`{organizations,meta}`→`{data,meta}`, `{venues,meta}`→`{data,meta}`) — desviación del plan. La normalización se verificó indirectamente vía la verificación manual en navegador real (ver "Cierre") y contra el backend real con `curl`, pero no quedó como prueba automatizada. Pendiente si se quiere cobertura de regresión.

## Validación

- [x] `src/validation/organizaciones.ts`: `organizationFormSchema`/`venueFormSchema`, límites idénticos al backend, sin formatos inventados.
- [x] `src/validation/organizaciones.test.ts` (7 tests): normalización de espacios, nombre vacío rechazado, campos opcionales vacíos aceptados, email inválido rechazado (ambos schemas).

## Hooks

- [x] `useOrganizations.ts` reescrito con firma `useOrganizations(query: OrganizationListQuery = {})` — **cambio de firma, no sobrecarga**: los dos call-sites existentes (`RolesListPage.tsx`, `OrganizationPicker.tsx`) se actualizaron en el mismo cambio (`RolesListPage` a `{page:1,pageSize:100}`; `OrganizationPicker` sin cambios, ya llamaba sin argumentos). Se añadieron `useOrganization`, `useCreateOrganization`, `useUpdateOrganization`.
- [x] `useVenues.ts` creado: `useVenues`, `useVenue`, `useCreateVenue`, `useUpdateVenue` — invalidación siempre scoped por `organizationId`; `useCreateVenue` también invalida `organizationKeys.all` porque el listado de organizaciones muestra `venuesCount`.

## Componentes

- [x] `OrganizationForm.tsx` — sin campo `status`.
- [x] `VenueForm.tsx` — `address` con `IonTextarea`, sin campo de organización.
- [x] `OrganizationListItem.tsx` — nombre, badge de estado, identificación tributaria, contacto, **`venuesCount`** (ver "Decisiones" de `plan.md`: sí se muestra, a diferencia de lo previsto originalmente en `spec.md`, porque el backend `019` ya lo expone sin N+1).
- [x] `VenueListItem.tsx`.
- [x] `OrganizationListItem.test.tsx` (3 tests): muestra `venuesCount`, navega a detalle, navega a edición.
- [ ] **No se creó `VenueListItem.test.tsx`** — desviación del plan, por límite de tiempo de la sesión. El componente se verificó funcionalmente en la verificación manual de navegador (sección "Sedes" del detalle, ver "Cierre"), pero no tiene test unitario propio.

## Páginas y enrutamiento

- [x] `OrganizationsListPage.tsx`, `OrganizationDetailPage.tsx`, `OrganizationFormPage.tsx`, `VenueFormPage.tsx`, `OrganizationsModule.tsx` — creados según lo especificado en `plan.md`.
- [x] `AccessRequestsModule.tsx`: ruta interna movida a `/admin/organizations/access-requests`; `AccessRequestsModule.test.tsx` actualizado (`initialEntries`).
- [x] Botón "Volver a organizaciones" en `AccessRequestsPage.tsx` — requirió envolver `AccessRequestsPage.test.tsx` en `MemoryRouter` (no lo tenía, y el componente ahora usa `useHistory`); desviación menor no prevista en el plan.
- [x] `AdminLayout.tsx`: monta `OrganizationsModule` en `/admin/organizations`.
- [x] `admin-navigation.ts`: ítem `organizations` → label "Organizaciones", ícono `businessOutline` (cambiado de `checkmarkDoneOutline`, no estaba en el plan pero es más representativo del nuevo alcance), `requiredPermissions: ['organizaciones.read']`.
- [x] `admin-capabilities.test.ts` actualizado (permiso usado en el test de conteo de ítems visibles).
- [x] **`AdminDashboardPage.test.tsx` también requirió actualización** — no estaba en el plan: el test de "módulos autorizados como enlaces" usaba `organizaciones.manage` y el texto "solicitudes de acceso"; se actualizó a `organizaciones.read` y al nuevo label "Organizaciones".
- [x] `organizations.css` creado con el criterio visual de `roles.css`, incluyendo la sección `@media (max-width: 760px)` para móvil.

## Contratos y tipos (obligatorio)

- [x] Verificado contra el backend real corriendo (`yarn dev` local, Postgres/Keycloak reales) con `curl` autenticado (usuario `administrador@canchago.local`, rol `Administrador` asignado vía `yarn asignar-rol` para esta verificación): `GET /organizaciones` (envelope `{organizations,meta}` + `venuesCount`), `POST/PATCH /organizaciones`, `POST /organizaciones/{id}/sedes`, `PATCH /organizaciones/{id}/sedes/{id}` — todos coinciden exactamente con lo tipado.
- [x] Confirmado que `status` sigue sin ser aceptado en `create`/`update` (leyendo `validations/organizaciones-sedes/*.validation.ts` de `canchago` directamente).

## Pruebas previstas

- [x] Listado de organizaciones: verificado en navegador real con datos reales (6 organizaciones, distintos estados, `venuesCount` correcto). **No automatizado** como test de componente (mock de `getOrganizations`) — desviación del plan por límite de tiempo.
- [x] Detalle de organización: verificado en navegador real (`Cancha 2`, con 2 sedes reales, todos los campos). **No automatizado.**
- [x] Crear organización: verificado en navegador real — validación de email en vivo (botón deshabilitado con email inválido, habilitado al corregirlo), creación real vía `POST`, navegación al detalle con los datos ya persistidos.
- [x] Editar organización: verificado en navegador real — formulario precargado, botón "Guardar cambios" deshabilitado sin cambios (`isDirty`).
- [x] Nueva sede desde el detalle: verificado en navegador real — el botón navega a `/admin/organizations/{organizationId}/venues/new` con el `organizationId` correcto ya en la ruta, sin pedirlo de nuevo.
- [x] Solicitudes de acceso reubicadas: verificado en navegador real — el botón en el listado navega a `/admin/organizations/access-requests` y la pantalla original sigue funcionando ahí.
- [x] Responsive: verificado en navegador real con viewport móvil (390×844) — listado y detalle en una columna, botones apilados de ancho completo, toolbar de búsqueda/orden en columna.
- [ ] **No automatizado como tests de componente/página** (`OrganizationsListPage`, `OrganizationDetailPage`, `OrganizationFormPage`, `VenueFormPage`): estados loading/error/empty con mocks, doble envío bloqueado, `Prompt` de cambios sin guardar, 409 de nombre duplicado de sede. Verificados manualmente en su mayoría (ver arriba) pero no como suite automatizada — mayor desviación del plan original, pendiente de completarse.
- [ ] **IDOR de sede — ya NO es un gap conocido, se verificó cerrado de verdad**: contra el backend real, `GET /organizaciones/{orgB}/sedes/{sedeId-de-orgA}` respondió `404` real (no `200` con los datos). El punto correspondiente de `spec.md` ("gap conocido") queda obsoleto tras implementar `019`; no se dejó un test automatizado de este caso en este repositorio (la verificación fue manual con `curl` contra Postgres real, documentada en `canchago/spec/features/019-.../tasks.md`).
- [x] Payload con campos protegidos: verificado indirectamente — el formulario nunca renderiza ni envía `status`/`id`/`organizationId` (sede), y el backend real los descarta (`.strict()` los rechazaría si vinieran; el frontend simplemente no los incluye en el payload).
- [ ] Usuario con permisos limitados (`organizaciones.read` sin `.manage`) y usuario sin ningún permiso — **no verificado** en esta sesión (requeriría un segundo usuario de prueba con permisos distintos); la lógica de `PermissionGuard`/`AdminRoute` es la misma ya validada por `roles`/`users`, pero no se repitió la prueba manual para este módulo específico.

## Cierre

- [x] `yarn lint && yarn typecheck && yarn test` — limpios (solo 1 fallo preexistente en `UserForm.test.tsx`, confirmado con `git stash` que ya fallaba antes de esta feature, ajeno por completo).
- [x] `yarn build` — **pasa limpio** (a diferencia del backend, este repo no tiene el bloqueo de `zod-to-openapi`).
- [x] No se tocó código nativo/plugins — `yarn cap:sync` no aplica.
- [x] **Verificación manual real en navegador** (Playwright contra `yarn dev`/Vite local + backend/Postgres/Keycloak reales, no mocks): login real, listado, detalle con sedes reales, crear organización real, editar, navegación de sedes, solicitudes de acceso reubicadas, responsive móvil — todo capturado y revisado visualmente en esta sesión. Los datos de prueba creados se eliminaron (soft delete) al terminar.
- [ ] **Verificación en `yarn android`/`yarn ios` (target real de la app) — NO realizada.** Esta sesión no tiene acceso a un emulador/dispositivo Android o iOS; solo se verificó en navegador (Vite dev), que `tech-stack.md` documenta explícitamente como "solo un atajo de desarrollo", no el target real. Mismo estado que dejó pendiente la feature `008`. **No se mueve a "Hecho" por este motivo**, además de los tests automatizados pendientes de arriba.
- [ ] No se mueve a "Hecho" en `roadmap.md` — queda en "Siguiente 🔜", donde ya se registró al crear la spec.

## Mantenimiento (checklist recurrente)

- [x] La feature `019` de backend ya se implementó en este mismo ciclo de trabajo — no queda pendiente como mantenimiento futuro; el frontend ya consume `expectedUpdatedAt` y `venuesCount` desde el primer commit de esta feature, no como una revisión posterior.
- [ ] Completar la suite automatizada de tests de página/componente pendiente (ver "Pruebas previstas").
- [ ] Verificar en `yarn android`/`yarn ios` antes de declarar la feature "Hecho".
