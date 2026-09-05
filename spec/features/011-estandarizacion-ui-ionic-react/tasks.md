# 011 · Estandarización de UI/UX con componentes Ionic React — Tareas

_Checklist accionable derivada del `plan.md`. Implementación iniciada el 2026-09-04: Fase 0 completa, Fase 1 y 2 parciales (lo de mayor riesgo/repetición real), Fase 3 con los dos componentes compartidos creados y en uso. Fases 4-6 (aplicar `AppPageHeader`/reemplazo íntegro por módulo) y Fase 7 quedan pendientes — ver "Pendiente" al final de cada fase._

## Fase 0 — Fundaciones compartidas

- [x] Migrar paginación de `AppDataList.tsx` a `IonToolbar`/`IonButtons`/`IonLabel`.
- [x] Migrar `AppEmptyState.tsx` a `IonCard`/`IonCardContent`, conservando `role="status"`.
- [x] Migrar `AppErrorState.tsx` a `IonCard`/`IonCardContent`, conservando `role="alert"`.
- [x] Revisado: ningún test existente consulta estos componentes por clase/estructura DOM (`grep` de `role="status"`/`role="alert"` en `*.test.tsx` no encontró acoplamiento); no se requirió ajuste de tests.

## Fase 1 — Shell administrativo

- [x] Revisado espaciado interno de `AdminNavigation.tsx`: se conserva `nav`/`header`/`IonMenu`/`IonList` sin cambios (clasificación "S" del inventario, confirmada). El botón nativo de expandir/colapsar grupo (`admin-navigation__group-button`) no estaba en el inventario original y se deja fuera de esta entrega — ver "Pendiente".
- [x] Creado `components/layout/AppStateMessage.tsx` (icono + eyebrow + título + descripción) y migrados `AdminAccessDeniedPage.tsx`, `AdminModulePendingPage.tsx`, `AdminNotFoundPage.tsx` y los dos bloques de estado de `AdminDashboardPage.tsx` ("Verificando tu acceso", "Todo en orden") a ese componente — elimina la cuarta+quinta duplicación del patrón `admin-state`, reutilizando las clases CSS ya existentes (`admin-state`, `admin-state__icon`, `admin-state__eyebrow`) sin tocar `admin-layout.css`.
- [x] Verificado (`yarn test`) que `IonSplitPane`/`IonMenu` sigue colapsando correctamente: `AdminDashboardPage.test.tsx` (incluye `getByRole('status')` sobre el nuevo `AppStateMessage`) pasa sin cambios.

## Fase 2 — Autenticación

- [x] `AccountTypeStep.tsx`: reemplazado el `<button className="account-type-card">` nativo por `IonCard button`, conservando estructura interna (`span` de icono/copy) y clases CSS (`account-type-card*`), con ajuste mínimo en `register-page.css` (`margin:0; box-shadow:none` para neutralizar el estilo por defecto de `IonCard`).
- [ ] **Pendiente:** bloque de marca decorativo de `AuthShell.tsx` (sigue como `div`+`IonIcon`, no se migró a `IonText` — cambio de bajo impacto visual, se difiere para no gastar el presupuesto de esta sesión en un elemento puramente decorativo).
- [ ] **Pendiente:** revisión de contenedores de mensaje/legal en `LoginPage.tsx`/`RegisterPage.tsx` (ya usan `IonText`/`p`, no se tocaron en esta sesión).

## Fase 3 — Componentes compartidos nuevos

- [x] Creado `components/layout/AppStateMessage.tsx` (ver Fase 1).
- [x] Creado `components/layout/AppDetailActions.tsx` (envoltorio `IonButtons`, reutiliza el `className` ya estilizado de cada módulo) y aplicado en `UserDetailPage.tsx`, `RoleDetailPage.tsx`, `OrganizationDetailPage.tsx` (los 3 bloques `<div className="…__actions">` del inventario).
- [ ] **Pendiente:** `AppPageHeader` (patrón "eyebrow + título + acciones" de los encabezados de listado/detalle) — no se creó en esta sesión; los encabezados de `*ListPage`/`*DetailPage` de roles/organizations siguen con su `<header className="…-page-header">` original. Se difiere porque cada encabezado real tiene variaciones (badge de estado, conteo, distintas acciones) que requieren diseñar la API del componente con más cuidado del que permite esta sesión; forzarlo ahora arriesgaba una abstracción incorrecta que hubiera que deshacer.
- [ ] **Pendiente:** tests unitarios dedicados de `AppStateMessage`/`AppDetailActions` — se validaron indirectamente vía los tests ya existentes de las páginas que los consumen (`AdminDashboardPage.test.tsx`, etc.), no como test de componente aislado.

## Fase 4 — Módulo `users`

- [x] `UserDetailPage.tsx`: acciones migradas a `AppDetailActions`; el `<button>` nativo "×" de remover rol (no estaba en el inventario original, se encontró durante la implementación) se reemplazó por `AppButton fill="clear" size="small"` con `IonIcon` — evita el único botón HTML crudo real encontrado en todo el árbol de `features/`.
- [ ] **Pendiente:** `UsersListPage.tsx`, `UserFormPage.tsx`, `UserProfileEditPage.tsx`, `OwnProfilePage.tsx` sin cambios en esta sesión.
- [ ] **Pendiente:** `ProfileSummary.tsx` (home) sin migrar a `IonGrid`/`IonItem`.
- [ ] **Pendiente:** revisión de contenedor visual de `ProfilePhotoEditor.tsx` (el `input[type=file]` se conserva, correcto; el `div` envolvente no se tocó).

## Fase 5 — Módulo `roles`

- [x] `RoleDetailPage.tsx`: acciones migradas a `AppDetailActions`.
- [ ] **Pendiente:** `RolesListPage.tsx`, `RoleFormPage.tsx`, `RoleForm.tsx`, `RoleListItem.tsx` sin cambios en esta sesión.

## Fase 6 — Módulo `organizations`

- [x] `OrganizationDetailPage.tsx`: acciones migradas a `AppDetailActions`.
- [ ] **Pendiente:** `OrganizationsListPage.tsx`, `OrganizationFormPage.tsx`, `VenueFormPage.tsx`, `OrganizationForm.tsx`, `OrganizationListItem.tsx`, `VenueForm.tsx`, `VenueListItem.tsx` sin cambios en esta sesión.

## Fase 7 — `access-requests` y cierre visual

- [ ] **Pendiente:** bug de layout de `AccessRequestListItem.tsx` (badge + botones cortados en viewport angosto) no se tocó en esta sesión.
- [ ] **Pendiente:** auditoría de `theme/variables.css` y `*.css` de módulo para eliminar reglas huérfanas — no realizada; los ajustes de CSS hechos en esta sesión fueron mínimos y dirigidos (solo para los componentes migrados), no una auditoría completa.

## Contratos y tipos (obligatorio)

- [x] No aplica — verificado: ningún archivo de `src/types/api/*` ni `spec/constitution/api-integration.md` se tocó en esta sesión.

## Pruebas previstas

_Usando exclusivamente la infraestructura real ya presente en `package.json`._

- [x] `yarn lint && yarn typecheck` — limpios tras los cambios de esta sesión.
- [x] `yarn test` — 104 pruebas verdes, 1 fallo preexistente y ajeno (`UserForm.test.tsx`, ya documentado como fallo previo en la feature `010`, confirmado que no lo introdujo este cambio); un `Unhandled Error` de memoria del worker de Vitest ajeno a los cambios (no bloquea la ejecución, mismo comportamiento visto en sesiones anteriores con esta suite).
- [x] `yarn build` — limpio (advertencia preexistente de tamaño de chunk >500 kB, no relacionada con esta feature).
- [ ] **No realizado en esta sesión:** verificación manual en `yarn dev` (navegador) ni en viewport 390×844/900px — solo se validó con la suite automatizada y lectura de código; no hubo acceso a un navegador interactivo en esta sesión.
- [ ] **No realizado:** verificación de permisos con usuarios reales de distinto nivel.
- [ ] **No realizado:** verificación en `yarn android`/`yarn ios` (target real de la app).
- [ ] **No realizado:** ejecución de `yarn test:e2e` (Cypress) — no se tocó ninguna pantalla cubierta por `cypress/e2e/test.cy.ts` en esta sesión, pero no se ejecutó para confirmarlo.

## Cierre

- [ ] Fases 0-3 validadas con `lint`/`typecheck`/`test`/`build`; Fases 4-6 solo parcialmente aplicadas (ver arriba) y Fase 7 sin iniciar — **no se completó la migración íntegra especificada en `plan.md`** en esta sesión.
- [x] `yarn lint && yarn typecheck && yarn test && yarn build` — ejecutados, ver "Pruebas previstas" para el detalle de resultados.
- [x] `yarn cap:sync` no aplica — ningún cambio tocó configuración nativa.
- [ ] **No se mueve a "Hecho" en `roadmap.md`** — la migración está incompleta (Fases 4-7 mayormente pendientes); permanece en "Backlog/ideas" hasta terminar al menos una pasada completa por módulo.

## Mantenimiento (checklist recurrente)

- [ ] Revisar en cada feature nueva que las pantallas agregadas usen los componentes compartidos ya migrados (`AppStateMessage`, `AppDetailActions`, `AppEmptyState`, `AppErrorState`, `AppDataList`) en vez de reintroducir HTML directo equivalente.
- [ ] Completar `AppPageHeader` y aplicar las Fases 4-7 pendientes en una sesión futura, siguiendo el mismo criterio de validación (`lint`/`typecheck`/`test`/`build` por fase) usado aquí.

## Iteración responsiva de formularios — 2026-09-04

- [x] Inventariados los formularios reales: login, registro de futbolista/gestor, organización, sede, rol, usuario, perfil administrado, perfil propio y fotografía.
- [x] Centralizados tamaños táctiles, `min-width`, estados inválidos, mensajes extensos y ajuste de texto de `AppInput`, `AppSelect`, `IonTextarea` y `AppButton` en `theme/forms.css`.
- [x] Organizados organización, sede, rol, usuario y enlaces de perfil en grids de una o dos columnas según el ancho disponible.
- [x] Apiladas acciones en móvil y protegidos cards, fieldsets, selects, checkboxes, valores readonly y contenido largo contra desbordamiento.
- [x] Corregido el breakpoint horizontal del login y el selector de tipo de cuenta para 320 px.
- [x] Sustituido el botón HTML de regreso del registro por `IonButton`; el `input[type=file]` nativo se conserva por ser el control real requerido para seleccionar archivos.
- [x] Corregidos mensajes de validación obligatoria de nombre/apellido y alineados con su prueba existente.
- [x] Agregada prueba E2E de ausencia de overflow en 320×568, 667×375, 768×1024 y 1280×800.
- [x] `yarn lint`, `yarn typecheck`, 29 pruebas focalizadas y `yarn build` pasan.
- [ ] `yarn test` completo: las aserciones ejecutadas pasan salvo el fallo corregido; el worker termina por límite de heap al cargar `ManagerRegisterForm.test.tsx`, incluso aislado.
- [ ] `yarn test:e2e`: Cypress 13.17.0 no inicia en el entorno macOS actual (`bad option: --no-sandbox`), antes de ejecutar las pruebas de viewport.

## Iteración de alertas Ionic — 2026-09-04

- [x] Inventariados mensajes inline, estados de página, errores de backend, éxitos y confirmaciones reales.
- [x] Creado `AppInteractionAlert` sobre `IonAlert` 8.5.0 con variantes, títulos por defecto, cierre manual y reapertura por operación.
- [x] `AppConfirmDialog` reutiliza el mismo núcleo; no se introdujo un segundo sistema de overlays.
- [x] Migrados errores globales de login, registro, usuario, organización, sede, rol, perfiles, permisos y fotografía.
- [x] Migrados éxitos de perfiles y permisos; añadidos éxitos/errores ausentes en solicitudes de acceso y mutaciones de usuarios/roles.
- [x] Añadida confirmación destructiva antes de eliminar la fotografía de perfil.
- [x] Conservados inline solo errores por campo y resúmenes de validación.
- [x] Protegido el ancho, ajuste de texto y tamaño táctil de alerts en móvil estrecho.
- [x] `yarn lint`, `yarn typecheck`, 17 pruebas focalizadas y `yarn build` pasan después de la migración.
- [x] `yarn test` completo ejecutó 114 pruebas correctamente y no presentó fallos de aserción; un worker agotó el heap antes de ejecutar el caso restante, limitación reproducible ya observada antes de esta iteración.
