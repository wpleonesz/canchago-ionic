# 009 · Perfil ampliado y autogestión

**Estado:** propuesta

## Qué hace

Permite a cada usuario autenticado abrir “Mi perfil” y completar opcionalmente celular, fotografía y enlaces de Facebook, Instagram, LinkedIn, X/Twitter, GitHub, TikTok y sitio personal/profesional. Todos los campos pueden permanecer vacíos, limpiarse y editarse sin modificar identidad, estado ni acceso.

La fotografía reemplaza las iniciales en `ProfileSummary` cuando existe; en ausencia o error se conserva el avatar actual de iniciales. El formulario se adapta a móvil y escritorio, muestra preview, progreso, validación y confirmación al eliminar.

## Por qué

Hoy solo existe edición administrativa de nombres. El usuario común no tiene una ruta de autogestión y el resumen de cuenta solo usa iniciales. Esta feature separa perfil personal de administración/RBAC.

## Contrato de API consumido

_Propuesto en `canchago/spec/features/017-perfil-ampliado-autogestion/`; debe implementarse y verificarse primero._

- `GET /api/profile` — autenticado — DTO textual propio, sin secretos.
- `PATCH /api/profile` — autenticado — celular/URLs opcionales + `expectedProfileUpdatedAt`.
- `GET /api/profile/avatar` — autenticado — WebP o 404/fallback.
- `PUT /api/profile/avatar` — autenticado — base64 JPEG/PNG/WebP, máximo 2 MiB antes de codificar.
- `DELETE /api/profile/avatar` — autenticado — 204 idempotente.

## Criterios de aceptación

- [ ] Todo usuario autenticado accede a “Mi perfil” sin requerir permisos administrativos.
- [ ] El formulario muestra los valores existentes y admite todos los campos opcionales vacíos.
- [ ] Celular usa teclado telefónico y valida E.164; URLs usan teclado URL y validación HTTPS/dominio.
- [ ] Seleccionar una imagen muestra preview; formatos/tamaño inválidos se rechazan antes de enviar y el backend sigue siendo autoridad.
- [ ] Guardar texto y subir/eliminar foto previenen doble envío y muestran éxito/error controlado.
- [ ] El avatar actualizado aparece en `ProfileSummary` sin recargar toda la app; sin foto o con fallo se muestran iniciales.
- [ ] Enlaces externos visibles se abren mediante Capacitor Browser o mecanismo existente seguro, nunca dentro de HTML inyectado; se aplica `noopener/noreferrer` en web.
- [ ] No existen inputs ni payloads para email, username, identificación, roles, permisos, estado o credenciales.
- [ ] 401 limpia sesión; 409 ofrece recargar; 413/415 explican tamaño/formato; red/500 preservan datos locales.
- [ ] La pantalla es accesible, responsive, dark-mode y usable con teclado/touch.
- [ ] Android sincroniza el bundle y valida selección/cámara/galería según el chooser nativo; no se solicita permiso amplio si `<input type=file>` basta.

### Contratos y tipos (obligatorio)

- [ ] Tipos en `src/types/api/users.ts` reflejan el backend sin `any`.
- [ ] `api-integration.md` documenta los cinco métodos, límites y errores.

## Fuera de alcance

- Perfil público, privacidad granular o múltiples enlaces por plataforma.
- Editar nombres desde “Mi perfil” en esta primera ampliación; siguen en el contrato administrativo actual hasta unificarlo explícitamente.
- Captura de cámara personalizada o plugin nuevo si el file chooser nativo cubre el requisito.
- Cropper/editor avanzado de imagen.
