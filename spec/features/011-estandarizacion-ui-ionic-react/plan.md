# 011 · Estandarización de UI/UX con componentes Ionic React — Plan

_Cómo se implementaría lo descrito en `spec.md`. Debe respetar la `constitution/`. Esta feature, en su alcance actual, solo produce la spec; este plan queda como guía de ejecución futura, no se ejecuta en esta entrega._

## Enfoque

Migración organizada por **áreas**, de menor a mayor riesgo de regresión, para poder validar cada fase de forma aislada con `yarn lint && yarn typecheck && yarn test && yarn build` antes de avanzar a la siguiente. Ninguna fase toca lógica de negocio, rutas, permisos, servicios ni validaciones — solo el árbol de componentes visual y el CSS asociado. Orden recomendado:

1. **Fase 0 — Fundaciones compartidas.** Migrar los componentes de `components/feedback/` y `components/common/AppDataList.tsx` primero, porque son reutilizados por todos los módulos de negocio (`AppEmptyState`, `AppErrorState`, paginación de `AppDataList`). Un cambio aquí se propaga automáticamente sin tocar cada página.
2. **Fase 1 — Shell administrativo.** `layouts/AdminLayout.tsx`, `features/admin/components/AdminNavigation.tsx`, `features/admin/pages/*` — es el contenedor de todo lo demás; conviene estabilizarlo antes de migrar los módulos que corren dentro.
3. **Fase 2 — Autenticación.** `features/auth/*` — superficie más pequeña y aislada (no depende del shell administrativo), buen segundo paso de bajo riesgo.
4. **Fase 3 — Encabezados y bloques de detalle compartidos.** Extraer el componente compartido de "encabezado de página" y "bloque de acciones de detalle" identificados en el inventario, antes de tocar los módulos que los usan (evita migrar `users`/`roles`/`organizations` cada uno a su propio patrón nuevo).
5. **Fase 4 — Módulo `users`.** Es el más antiguo y el que fijó el patrón que luego copiaron `roles`/`organizations`; migrarlo primero valida el componente compartido de la Fase 3 contra el caso más probado.
6. **Fase 5 — Módulo `roles`.** Reutiliza los componentes ya validados en la Fase 4.
7. **Fase 6 — Módulo `organizations` (incluye sedes).** Igual criterio; es el módulo más grande (listado + detalle + 2 formularios).
8. **Fase 7 — `access-requests` y `home`.** Menor superficie, se migran al final porque dependen de patrones ya estabilizados (tarjetas de lista, resumen de perfil).

## Implementación

_Pasos técnicos por fase, respetando las capas de `tech-stack.md` §2. Ningún paso toca `services/`, `validation/` ni `types/api/`._

**Feedback de interacción transversal**

1. Crear `components/feedback/AppInteractionAlert.tsx` como único wrapper de `IonAlert` para error, éxito, advertencia e información, con títulos coherentes, cierre controlado y estilos responsivos.
2. Hacer que `AppConfirmDialog` reutilice ese wrapper para mantener un solo mecanismo de overlays.
3. Migrar banners globales de autenticación, formularios, perfiles y permisos; conservar exclusivamente validaciones de campo y resúmenes de validación como mensajes inline.
4. Añadir feedback ausente a mutaciones de usuarios y solicitudes de acceso, cerrando primero cualquier confirmación para impedir alerts simultáneos.
5. Validar cierre manual, error, éxito y confirmación mediante las pruebas existentes de cada flujo y una prueba unitaria del wrapper.

**Fase 0 — Fundaciones compartidas**

1. **`src/components/common/AppDataList.tsx`** — Reconstruir el control de paginación con `IonToolbar`/`IonButtons`/`IonLabel` en vez de `nav`+`span`+`AppButton` suelto; evaluar si el `div className="app-data-list"` envolvente puede eliminarse (renderizar `IonList` directo) sin romper el CSS existente (`app-data-list` en los `*.css` de cada módulo).
2. **`src/components/feedback/AppEmptyState.tsx`** — Envolver en `IonCard`/`IonCardContent`, conservando `role="status"` y la prop pública `title`/`description` sin cambios.
3. **`src/components/feedback/AppErrorState.tsx`** — Mismo criterio, conservando `role="alert"` y la prop `onRetry`.
4. Ejecutar `yarn test` para los tests existentes de estos componentes (si existen) y ajustar únicamente selectores acoplados a la estructura DOM anterior, nunca el comportamiento.

**Fase 1 — Shell administrativo**

5. **`src/features/admin/components/AdminNavigation.tsx`** — Revisar únicamente CSS/espaciado del `nav`/`header` interno (conservar las etiquetas, ver inventario "S"); no se cambia la estructura de `IonMenu`/`IonList`/`IonItem` ya usada.
6. **`src/features/admin/pages/{AdminDashboardPage,AdminAccessDeniedPage,AdminModulePendingPage,AdminNotFoundPage}.tsx`** — Sustituir el patrón "eyebrow + título + descripción" por el componente compartido creado en la Fase 3 (nota: si el orden de fases se ejecuta estrictamente en secuencia, este paso se pospone hasta tener ese componente disponible; se documenta aquí para mantener trazabilidad del archivo afectado).

**Fase 2 — Autenticación**

7. **`src/features/auth/components/AuthShell.tsx`** — Conservar `main`/`section` (landmarks); migrar el bloque de marca (ícono decorativo) a `IonIcon`+`IonText`.
8. **`src/features/auth/components/AccountTypeStep.tsx`** — Decidir entre `IonCard button` o `IonRadioGroup`/`IonRadio` con estilo de tarjeta (evaluar cuál conserva el comportamiento de selección única y el estilo visual actual con menor cambio estructural); documentar la elección en "Decisiones" antes de implementar.
9. **`src/features/auth/pages/{LoginPage,RegisterPage}.tsx`** — Ajustar solo el contenedor de mensajes de error (`IonText`, ya usado) y de textos legales (`p`, conservar — es texto plano, no interactivo).

**Fase 3 — Componentes compartidos nuevos**

10. **`src/components/layout/AppPageHeader.tsx`** (nuevo, nombre a confirmar contra convenciones de `components/layout/`) — Encabezado de página reutilizable ("eyebrow + título + acciones") construido con `IonGrid`/`IonRow`/`IonCol` o `IonButtons` según el caso (columna de texto + columna de acciones), reemplazando el patrón repetido de `header className="…-page-header"` en `UsersListPage`/`RolesListPage`/`OrganizationsListPage`/`*DetailPage`. Props: `eyebrow?`, `title`, `actions?: ReactNode`.
11. **`src/components/layout/AppDetailActions.tsx`** (nuevo, nombre a confirmar) — Bloque de acciones de detalle (`IonButtons`/`IonGrid`) reutilizado por los 3 `*DetailPage`, reemplazando el `div className="…__actions"` repetido.

**Fase 4 — Módulo `users`**

12. **`src/features/users/pages/{UsersListPage,UserDetailPage,UserFormPage,UserProfileEditPage,OwnProfilePage}.tsx`** — Sustituir encabezados/bloques de acciones por los componentes de la Fase 3; conservar `dl`/`dt`/`dd` en bloques de datos de solo lectura (inventario "S"); conservar `form`/`fieldset` en `UserForm.tsx`/`AdminUserProfileForm.tsx`/`OwnProfileForm.tsx`.
13. **`src/features/home/components/ProfileSummary.tsx`** — Migrar `div`s de identidad/contacto a `IonGrid`/`IonRow`/`IonCol` o `IonItem`/`IonLabel`, según cuál produzca menos cambio de CSS existente.
14. **`src/features/users/components/ProfilePhotoEditor.tsx`** — Sin cambios en el `input[type=file]` (inventario "S"); revisar solo el contenedor visual (`div`→posible `IonGrid`) alrededor del avatar y los botones de acción.

**Fase 5 — Módulo `roles`**

15. **`src/features/roles/pages/{RolesListPage,RoleDetailPage,RoleFormPage}.tsx`**, **`components/{RoleForm,RoleListItem}.tsx`** — Mismo criterio que la Fase 4, reutilizando los componentes de la Fase 3 ya validados.

**Fase 6 — Módulo `organizations`**

16. **`src/features/organizations/pages/{OrganizationsListPage,OrganizationDetailPage,OrganizationFormPage,VenueFormPage}.tsx`**, **`components/{OrganizationForm,OrganizationListItem,VenueForm,VenueListItem}.tsx`** — Mismo criterio; incluye la sección de sedes embebida en `OrganizationDetailPage`.

**Fase 7 — `access-requests` y cierre**

17. **`src/features/access-requests/pages/AccessRequestsPage.tsx`**, **`components/AccessRequestListItem.tsx`** — Ya conforme en su mayoría (usa `IonItem`); solo revisar el bug de layout ya documentado en el roadmap (badge + botones cortados en viewport angosto) como parte de esta estandarización, sin cambiar su lógica de aprobación/rechazo.
18. **`src/theme/variables.css`** — Revisar si algún token nuevo (p. ej. tamaño de card estándar) debe agregarse aquí en vez de duplicarse por módulo; solo si el inventario de valores reales usados hoy en cada `*.css` de módulo revela una constante repetida ≥ 3 veces.
19. **`*.css` por módulo** (`users.css`, `roles.css`, `organizations.css`, `admin-layout.css`, `login-page.css`, `register-page.css`, `access-requests.css`) — Eliminar reglas que dejen de tener selector correspondiente tras migrar su estructura; no se crean archivos CSS nuevos salvo para los dos componentes compartidos de la Fase 3.

## Decisiones

- **Migración por fases con validación intermedia, no un solo cambio masivo.** Alternativa descartada: migrar todo el árbol en un único cambio — se descarta por el riesgo de regresión sobre 7+ módulos ya "Hecho" en producción/roadmap sin puntos de verificación intermedios.
- **`dl`/`dt`/`dd`, `form`/`fieldset`, `input[type=file]`, y los landmarks `main`/`section`/`header`/`nav` semánticos se conservan explícitamente.** No existe un componente Ionic equivalente para pares clave-valor semánticos, envío de formulario nativo, selección de archivo del sistema, ni landmarks de documento — reemplazarlos mecánicamente violaría el propio requisito de la spec de no tocar HTML semánticamente necesario.
- **Los estados vacío/error se envuelven en `IonCard` en vez de mantenerse como `div` simple.** Da consistencia visual con el resto de tarjetas de la app (`*ListItem`) sin cambiar su rol ARIA ni su lógica de reintento.
- **La paginación de `AppDataList` se reconstruye con `IonToolbar`/`IonButtons` en vez de `nav`+`span`.** Hereda automáticamente el espaciado/densidad táctil de Ionic sin CSS propio adicional.
- **`AccountTypeStep` se decide entre `IonCard button` o `IonRadioGroup`/`IonRadio` estilizado, no se fuerza a priori.** Ambos son componentes Ionic reales; la elección final depende de cuál conserve mejor el comportamiento de selección visual actual (se decide al ejecutar la Fase 2, con el código real delante, no en esta spec).
- **No se introduce `IonTabs`/`IonModal` salvo necesidad real verificada durante la ejecución.** Cambiar el paradigma de navegación o introducir overlays de pantalla completa sin una necesidad concreta sería sobreingeniería frente al alcance pedido (estandarización, no rediseño de arquitectura).
- **Los dos componentes compartidos nuevos (Fase 3) se crean solo tras confirmar la repetición real en 3+ módulos** (ya confirmado en el inventario de `spec.md`), evitando abstraer antes de tener el caso de uso probado dos veces.

## Riesgos

- **Regresión visual no detectada por tests automatizados.** El proyecto no tiene una suite de regresión visual (Cypress cubre flujos funcionales, no píxeles); la mitigación real es la verificación manual por viewport descrita en `tasks.md`, igual que hicieron las features `008`/`010`.
- **Tests unitarios acoplados a estructura DOM/`className` específica.** Migrar `AppEmptyState`/`AppErrorState`/`AppDataList` puede romper snapshots o queries de Testing Library que dependan de la jerarquía anterior; mitigación: preferir queries por rol/texto (`getByRole`, `getByText`) sobre selectores de clase al ajustar tests, y revisar cada test afectado en la misma fase que su componente, no al final.
- **`IonSplitPane`/`IonMenu` es sensible a IDs (`contentId`/`menuId`) y a la jerarquía exacta de `IonPage`.** Un cambio descuidado en `AdminLayout.tsx` podría romper el colapso responsive ya validado (`when="(min-width: 900px)"`); mitigación: no tocar esos IDs ni la relación `IonSplitPane`→`IonMenu`→`IonPage`, solo el contenido interno de `AdminNavigation`.
- **Componentes compartidos nuevos (Fase 3) mal diseñados obligan a re-tocar 3 módulos después.** Mitigación: diseñarlos primero contra el caso más completo (`users`, que ya tiene listado + detalle + 2 formularios) antes de aplicarlos a `roles`/`organizations`.
- **Alcance grande (7+ fases) puede quedar parcialmente completado, como ya ocurrió con la feature `010`.** Mitigación: cada fase es independientemente entregable y verificable (`lint`/`typecheck`/`test`/`build` + verificación manual), permitiendo pausar entre fases sin dejar la app en un estado roto.
