# 006 · Experiencia de Administración y Navegación por Capacidades — Plan

_Cómo se implementará lo descrito en `spec.md`. Debe respetar las constituciones de `canchago` y `canchago-ionic`._

## Enfoque

La implementación futura se concentra en `canchago-ionic`: un `AdminLayout` compuesto con Ionic, una configuración declarativa de navegación y una función pura de evaluación de permisos reutilizada por el menú y el guard administrativo. `ProtectedRoute` resuelve primero la autenticación; el guard administrativo resuelve después la capacidad de la ruta. El backend conserva sin cambios la autorización definitiva en cada endpoint.

Se integran primero los módulos ya implementados o especificados. La navegación no importa pantallas inexistentes: cada ruta se habilita junto con su SPEC de dominio o usa un estado explícito de “módulo pendiente” que no solicita datos. No se crea un API de menú porque `GET /api/auth/session` ya entrega todos los permisos necesarios en una sola respuesta.

## Implementación

1. **Discovery de cierre, antes de código** — Revalidar `canchago/pages/api/`, `middleware/access.ts`, `pages/api/auth/session.ts`, `canchago-ionic/spec/constitution/api-integration.md`, `src/routes/AppRoutes.tsx` y las SPEC de dominios administrativos. Registrar cualquier deriva antes de implementar.
2. **`canchago-ionic/src/features/admin/navigation/admin-navigation.ts`** (nuevo) — Definir la única configuración tipada de grupos/entradas: id interno, label, icono de ionicons, ruta canónica, patrón de rutas hijas y permisos de lectura requeridos. No incluir roles ni entradas futuras sin ruta aprobada.
3. **`canchago-ionic/src/features/admin/navigation/admin-capabilities.ts`** (nuevo) — Funciones puras para `hasAnyPermission`, filtrar grupos/entradas y resolver la entrada activa por segmentos de ruta. Reutilizar `PermissionSummary`; denegar ante sesión ausente o permisos no verificados.
4. **`canchago-ionic/src/features/auth/components/PermissionGuard.tsx`** — Delegar la comparación a la función común de capacidades para eliminar lógica duplicada, conservando su semántica actual de “alguno de los permisos”. Extenderla solo si las rutas requieren una política explícita `any`/`all`, tipada y probada.
5. **`canchago-ionic/src/routes/AdminRoute.tsx`** (nuevo) — Guard de ruta que recibe permisos requeridos y compone dentro de `ProtectedRoute`. Durante carga no renderiza UI privilegiada; sesión sin capacidades devuelve un estado de acceso denegado o redirige al primer destino administrativo autorizado, sin loops. No sustituye la respuesta 403 del backend.
6. **`canchago-ionic/src/features/admin/components/AdminNavigation.tsx`** (nuevo) — Renderizar navegación semántica, grupos y opciones ya filtradas, iconos, labels, `aria-current`, expansión accesible y activación correcta en deep links. No renderizar grupos vacíos ni nodos no autorizados ocultos con CSS.
7. **`canchago-ionic/src/layouts/AdminLayout.tsx`** (nuevo; hoy `src/layouts/` está vacío) — Componer `IonSplitPane` para escritorio, `IonMenu` para móvil, toolbar/título de sección y outlet/contenido. Reutilizar `AppPage` donde encaje o extraerle una composición compatible sin duplicar `IonPage`/`IonContent`.
8. **`canchago-ionic/src/features/admin/pages/AdminDashboardPage.tsx`** (nuevo) — Inicio administrativo sin métricas inventadas: contexto, identidad no sensible y accesos rápidos derivados de las mismas entradas autorizadas. Estados `loading`, `empty`, `error` y `success`.
9. **`canchago-ionic/src/features/admin/pages/AdminModulePendingPage.tsx`** (opcional y temporal) — Estado explícito para rutas de dominio aprobadas cuya pantalla todavía no se implementó. No llama endpoints ni simula funcionalidades; se elimina al integrar cada feature real.
10. **`canchago-ionic/src/routes/AppRoutes.tsx`** — Registrar `/admin` y rutas hijas dentro del layout/guards. Enlazar `/admin/users` solo con la implementación de la feature Ionic `005`; roles/permisos y organizaciones/sedes se integran con sus futuras SPEC. Mantener `/login` y `/home`; reemplazar accesos administrativos dispersos de `Home` por un único enlace al primer destino autorizado.
11. **Compatibilidad de URLs** — Si alguna feature administrativa se implementó antes con `/users` u otra ruta pública, añadir una redirección exacta a su ruta canónica `/admin/...`, preservando parámetros seguros. Evitar dos componentes montados para la misma pantalla.
12. **`canchago-ionic/src/features/admin/admin-layout.css` y `src/theme/variables.css`** — Estilos responsive usando tokens existentes. Sidebar persistente en breakpoint de escritorio; drawer en móvil; dark mode, safe areas, foco visible, estado activo con más de una señal y `prefers-reduced-motion`.
13. **Preferencia de colapso (solo si se valida su valor)** — Usar `services/storage/preferences.ts` con una clave no sensible para el estado colapsado de escritorio. No persistir expansión por usuario, rutas restringidas, sesión ni permisos. Omitir completamente esta tarea si el layout funciona mejor sin colapso.
14. **Sesión, revocación e invalidación** — Reutilizar `useSession`, `SESSION_QUERY_KEY`, `sessionStore`, el interceptor 401 y `useLogoutMutation`. Cuando una operación administrativa que modifica roles/permisos afecte al usuario actual, invalidar `SESSION_QUERY_KEY`; si pierde el permiso activo, el guard abandona esa vista. No introducir polling ni refetch en cada navegación.
15. **Manejo de 403 y rutas inexistentes** — Crear/reutilizar estados de feedback comunes para acceso denegado y ruta administrativa inexistente, sin listar opciones ocultas. Las respuestas 401 conservan el flujo global de login.
16. **Pruebas unitarias/componentes** — Vitest + Testing Library para configuración, filtrado, matcher de deep links, estados pending/error/empty/success, administrador parcial, conjunto completo de permisos, drawer/submenús, foco/labels y limpieza tras logout.
17. **Pruebas de integración** — MSW solo si ya está configurado por la implementación de las features de dominio: sesión → configuración filtrada → guard → vista; 401/403; permisos modificados e invalidación. No añadir otra herramienta.
18. **Pruebas E2E** — Cypress existente para deep links, URL manual no autorizada, navegación parcial/completa, logout, sesión expirada, ruta inexistente y viewports móvil/escritorio. Validar manualmente drawer/safe areas en Android o iOS mediante los scripts existentes.
19. **Contratos y documentación** — Reutilizar `src/types/api/auth.ts`. Actualizar `canchago-ionic/spec/constitution/api-integration.md` solo si el código real difiere. No tocar `documentation/schemas/` de `canchago`, pues este alcance no crea endpoints.
20. **Cierre** — Ejecutar en `canchago-ionic` `yarn lint && yarn typecheck && yarn test && yarn build`; si se toca configuración nativa, también `yarn cap:sync`. Validar cada `ADM-*` y criterios de `spec.md`, actualizar ambos roadmaps solo cuando la implementación total esté terminada.

## Matriz requisito → diseño → tarea

| Requisito                      | Diseño/archivo                                           | Tareas de `tasks.md`           |
| ------------------------------ | -------------------------------------------------------- | ------------------------------ |
| ADM-01, ADM-06, ADM-10         | configuración, matcher, `AdminNavigation`, `AdminLayout` | T-02 a T-07, T-17              |
| ADM-02, ADM-03, ADM-04, ADM-05 | `ProtectedRoute`, `AdminRoute`, capacidades por permisos | T-03 a T-05, T-14, T-18 a T-20 |
| ADM-07, ADM-08                 | `IonSplitPane`, `IonMenu`, CSS/tokens y semántica        | T-06, T-07, T-12, T-21, T-22   |
| ADM-09                         | query/store/interceptor existentes e invalidación        | T-13, T-19, T-20               |
| ADM-11                         | filtrado previo, config no sensible, estados seguros     | T-02, T-06, T-11, T-23         |
| ADM-12                         | rutas compatibles y suite completa                       | T-09, T-10, T-18 a T-25        |

## Decisiones

- **Feature transversal documentada en el backend, implementada principalmente en Ionic** — La guía vive en la ruta solicitada de `canchago/spec/features/`, pero el backend es exclusivamente REST y prohíbe frontend. El código visual futuro se limita a `canchago-ionic`; `canchago` solo cambiaría mediante otra SPEC si aparece un contrato faltante.
- **Permisos efectivos, no roles nominales** — `GET /api/auth/session` ya entrega permisos consolidados. Se descarta `RoleGuard role="administrador"` para el menú y cualquier `if role === 'superadmin'`, porque excluiría administradores personalizados y dispersaría una excepción de privilegios.
- **Sin endpoint de menú** — Una configuración local tipada describe presentación/rutas, mientras la sesión decide capacidades. Se descarta una API nueva porque no hay labels de producto administrables en backend y la sesión actual evita peticiones N+1.
- **Permisos como catálogo de lectura** — `/api/permisos` solo implementa GET. Se descarta una pantalla CRUD ficticia; la opción, cuando se integre, consulta el catálogo y la asignación ocurre dentro de Roles mediante los endpoints existentes.
- **Shell primero, CRUD por sus propias SPEC** — El layout integra rutas aprobadas pero no absorbe la lógica de Usuarios/Roles/Organizaciones. Esto conserva modularidad y evita convertir la feature de navegación en una implementación administrativa completa.
- **Rutas canónicas bajo `/admin` con compatibilidad** — Aíslan el contexto administrativo y permiten resolver deep links de forma uniforme. Si ya existe una URL al implementar, se redirige en lugar de romper enlaces.
- **Dashboard sin agregaciones cliente** — Sin endpoint agregado, el inicio muestra accesos/contexto. Se descarta descargar listados para contar entidades por costo, filtrado multi-tenant y riesgo de datos sensibles.
- **Responsive con Ionic existente** — `IonSplitPane`/`IonMenu` satisfacen escritorio/móvil y accesibilidad base. Se descarta una dependencia de sidebar/dashboard.
- **Preferencia local opcional y no sensible** — Solo el colapso visual puede persistirse mediante el wrapper existente; permisos, rutas permitidas y sesión nunca se derivan de Preferences.

## Riesgos

- **Deriva de códigos de permiso** — Las SPEC históricas y el código han diferido. Mitigación: revalidar `access('...')` y catálogo real al iniciar implementación; mantener los códigos en una sola configuración y actualizar `api-integration.md`.
- **Alcance multi-tenant no visible en sesión** — `SessionUser.roles` no incluye `organizationId`/`venueId`; un permiso efectivo no indica por sí solo qué tenant seleccionar. Mitigación: el menú solo decide visibilidad de módulo; cada pantalla conserva sus filtros/contratos y el backend debe validar alcance. No inferirlo desde el nombre del rol.
- **`PermissionGuard` solo oculta contenido** — Una ruta podría montar una página sin autorización si solo se envuelve el botón. Mitigación: `AdminRoute` a nivel de ruta más controles de acción, manteniendo el 403 backend como autoridad.
- **Permisos revocados durante el `staleTime`** — La UI puede permanecer visible unos minutos. Mitigación: backend rechaza inmediatamente; 401 limpia sesión, 403 muestra acceso denegado; mutaciones que cambian RBAC invalidan sesión cuando afectan al usuario actual.
- **React Router 5 + Ionic routing** — Layouts anidados y `IonRouterOutlet` tienen restricciones de montaje/transición. Mitigación: seguir las APIs instaladas, probar deep links/transiciones y evitar asumir patrones de React Router 6.
- **Doble header o contenido Ionic anidado** — Combinar `AppPage`, `IonMenu` e `IonSplitPane` incorrectamente puede producir toolbars duplicados o scroll roto. Mitigación: definir una sola propiedad de `IonPage`/`IonContent` por vista y probar escritorio, móvil y safe areas.
- **Rutas futuras visibles antes de estar listas** — Una entrada configurada sin pantalla sería navegación rota. Mitigación: registrar la entrada junto con su ruta aprobada y usar el estado pendiente solo si producto acepta explícitamente esa transición.
- **Cambio accidental del archivo sucio del usuario** — `keycloak/realm-canchago.json` ya está modificado y no pertenece a esta feature. Mitigación: no tocarlo ni incluirlo en el cierre.
