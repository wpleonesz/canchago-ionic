# 006 · Experiencia de Administración y Navegación por Capacidades — Tareas

_Checklist accionable derivada del `plan.md`._

## Preparación y contratos

- [x] **T-01 (ADM-02/03/04/05/09/11/12)** Revalidar antes de implementar los endpoints, permisos, sesión, rutas, layouts y SPEC relacionadas de ambos repositorios; registrar cualquier deriva en `canchago-ionic/spec/constitution/api-integration.md`.
- [x] **T-02 (ADM-01/03/06/10/11)** Crear `canchago-ionic/src/features/admin/navigation/admin-navigation.ts` con la jerarquía, rutas, ionicons, patrones hijos y permisos reales definidos en `spec.md`; no incluir roles, secretos ni módulos futuros sin contrato.
- [x] **T-03 (ADM-03/05/06/10)** Crear y probar `admin-capabilities.ts` con filtrado seguro por defecto, política explícita de permisos y resolución de ruta activa/deep links.
- [x] **T-04 (ADM-03/10/12)** Refactorizar `PermissionGuard` para reutilizar la evaluación común sin cambiar su comportamiento cubierto por pruebas.

## Layout, menú y rutas

- [x] **T-05 (ADM-02/03/04/05)** Crear `AdminRoute.tsx`, compuesto después de `ProtectedRoute`, con estados loading/denied y sin render privilegiado previo.
- [x] **T-06 (ADM-01/03/06/07/08/10/11)** Crear `AdminNavigation.tsx`: grupos filtrados, labels/iconos, `aria-current`, expansión, grupo activo y cierre del drawer tras navegar.
- [x] **T-07 (ADM-01/06/07/08)** Crear `src/layouts/AdminLayout.tsx` con `IonSplitPane` en escritorio, `IonMenu` en móvil y una sola composición válida de `IonPage`/`IonContent`.
- [x] **T-08 (ADM-03/11)** Crear `AdminDashboardPage.tsx` con accesos autorizados y estados loading/empty/error/success, sin métricas ni solicitudes agregadas ficticias.
- [x] **T-09 (ADM-01/02/04/06/12)** Registrar `/admin` y rutas hijas aprobadas en `AppRoutes.tsx`; mantener `/login` y `/home`.
- [x] **T-10 (ADM-06/12)** Añadir redirects exactos desde URLs administrativas anteriores, solo si existen al implementar; no duplicar pantallas. No existían URLs administrativas previas que redirigir.
- [x] **T-11 (ADM-04/11)** Crear/reutilizar estados no sensibles de acceso denegado, módulo pendiente y ruta inexistente; el estado pendiente no llama APIs.
- [x] **T-12 (ADM-07/08/12)** Añadir estilos responsive/dark/reduced-motion con tokens actuales, safe areas, targets táctiles, foco visible y estado activo no basado solo en color.
- [ ] **T-13 (ADM-07/09/11)** Si se justifica el colapso de escritorio, persistir solo esa preferencia no sensible mediante `services/storage/preferences.ts`; omitir si no aporta valor.

## Integración administrativa

- [ ] **T-14 (ADM-03/04/05/10)** Integrar Usuarios bajo `/admin/users` únicamente con la feature Ionic `005`, usando `users.read` para la entrada y permisos de acción ya especificados en ella.
- [ ] **T-15 (ADM-03/04/05/10)** Integrar Roles bajo `/admin/roles` con su SPEC de dominio y permisos `roles.read`/`roles.manage`; conservar `organizationId` obligatorio.
- [ ] **T-16 (ADM-03/04/05/10)** Integrar Permisos bajo `/admin/permissions` como catálogo de solo lectura con `permisos.read`; no crear CRUD.
- [ ] **T-17 (ADM-03/04/05/10)** Integrar Organizaciones/Sedes bajo `/admin/organizations` con su SPEC de dominio y permisos `organizaciones.read`/`organizaciones.manage`; conservar envelopes reales.
- [x] **T-18 (ADM-01/10/12)** Sustituir las tarjetas administrativas dispersas de `Home` por un único acceso al primer destino administrativo autorizado, sin usar nombres de rol.
- [x] **T-19 (ADM-09/12)** Reutilizar logout/interceptor/query existentes y verificar que limpian menú, ruta, token nativo y caché administrativa.
- [ ] **T-20 (ADM-03/04/09)** Invalidar `SESSION_QUERY_KEY` tras cambios RBAC que afecten al usuario actual; retirar la vista activa si el permiso fue revocado.

## Pruebas derivadas de aceptación

- [x] **T-21 (ADM-03/05/06/10/11)** Unitarias: configuración sin duplicados, filtrado sin sesión, administrador parcial, permisos completos con rol de nombre arbitrario, grupos vacíos y matcher de rutas raíz/hijas.
- [x] **T-22 (ADM-01/03/06/07/08)** Componentes: layout único, sidebar de escritorio, drawer móvil, submenús, ruta activa, teclado, foco, labels accesibles y estados loading/empty/error/success.
- [ ] **T-23 (ADM-02/04/09/11)** Integración: sesión pending/error, 401, 403, logout, usuario cambiado y permisos revocados durante la sesión; comprobar que no hay flash de opciones privilegiadas.
- [ ] **T-24 (ADM-02/04/05/06/07/09/12)** Cypress: deep link autorizado, URL manual no autorizada, admin parcial, super admin por permisos, sesión expirada, ruta inexistente y viewports móvil/escritorio.
- [ ] **T-25 (ADM-07/08/12)** Prueba manual en Android o iOS real/emulador: drawer, botón de menú, cierre tras navegar, safe areas, rotación/viewport, foco cuando aplique y contenido utilizable.
- [ ] **T-26 (ADM-04/12)** Pruebas negativas directas contra backend: endpoints ocultos siguen devolviendo 401/403 sin sesión/permisos; ocultar el menú nunca cambia esa respuesta.
- [x] **T-27 (ADM-09/12)** Ejecutar regresión de `/login`, `/home`, autenticación web/nativa, `ProtectedRoute`, `PublicRoute`, `PermissionGuard`, `RoleGuard` y logout.

## Contratos y documentación (obligatorio)

- [x] Reutilizar `canchago-ionic/src/types/api/auth.ts`; no duplicar `SessionUser`, roles ni permisos y no introducir `any`.
- [ ] Actualizar `canchago-ionic/spec/constitution/api-integration.md` si el contrato real cambia o difiere de esta SPEC.
- [ ] Verificar manualmente `GET /api/auth/session` con sesión parcial y de super admin para confirmar que los permisos usados por el menú llegan en una única respuesta.
- [x] Confirmar que no se creó ningún endpoint backend. Si aparece esa necesidad, detener la implementación y crear/aprobar primero una SPEC backend separada con OpenAPI y pruebas.

## Cierre

- [ ] Validar cada requisito `ADM-01` a `ADM-12` y todos los criterios de aceptación de `spec.md` con evidencia de prueba.
- [ ] Ejecutar en `canchago-ionic`: `yarn lint && yarn typecheck && yarn test && yarn build` sin errores.
- [ ] Ejecutar `yarn cap:sync` si se tocó configuración o código nativo.
- [ ] Revisar que no se agregó ninguna dependencia UI/routing/estado y que `keycloak/realm-canchago.json`, ya modificado por el usuario, permanece intacto.
- [ ] Mover la feature a “Hecho” en los roadmaps aplicables únicamente después de completar implementación, pruebas y contratos; no marcarla terminada por la sola creación de esta guía.

## Mantenimiento (checklist recurrente)

- [ ] Al agregar un módulo administrativo, confirmar primero su ruta, pantalla, endpoints y permiso real; después añadir una sola entrada a la configuración central y sus pruebas.
- [ ] Cuando cambie RBAC o `SessionUser`, actualizar conjuntamente configuración, guards, pruebas y `canchago-ionic/spec/constitution/api-integration.md`.
- [ ] Si aparecen APIs de auditoría, sesiones/dispositivos, perfil, configuración o dashboard agregado, crear primero sus SPEC de dominio; no activarlas automáticamente en este menú.
