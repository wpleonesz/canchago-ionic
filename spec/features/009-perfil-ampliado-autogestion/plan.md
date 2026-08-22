# 009 · Perfil ampliado y autogestión — Plan

## Enfoque

Consumir primero el contrato backend 017. Reutilizar TanStack Query, React Hook Form, Zod, AppInput/AppButton, feedback y `ProfileSummary`. Crear una ruta propia `/admin/profile` accesible a toda sesión, aunque no tenga permisos administrativos; “administración” sigue siendo solo el shell actual de inicio.

## Implementación

1. **Backend primero** — Completar y verificar feature backend 017 y actualizar `api-integration.md`.
2. **`src/types/api/users.ts`** — `OwnUserProfileDto`, request textual y avatar metadata.
3. **`src/validation/user-profile.ts`** — Extender schemas opcionales de celular/URLs; transformar vacío a null en el mapper, no mezclar nombres administrativos.
4. **`src/services/api/endpoints/users.ts`** — Funciones GET/PATCH propio y GET/PUT/DELETE avatar; sin Axios en componentes.
5. **`src/features/users/hooks/useOwnProfile.ts`** — Query/mutaciones, concurrencia, cache bust de avatar e invalidación de sesión/resumen.
6. **`src/components/common/AppAvatar.tsx`** — Componente reutilizable con imagen segura y fallback de iniciales; reemplazar markup duplicado de `ProfileSummary`.
7. **`src/features/users/components/OwnProfileForm.tsx`** — Grupos Contacto/Redes, opcionales, labels accesibles y dirty state.
8. **`src/features/users/components/ProfilePhotoEditor.tsx`** — `<input type=file accept="image/jpeg,image/png,image/webp">`, validación previa 2 MiB, preview object URL revocado, subir/reemplazar/eliminar.
9. **`src/features/users/pages/OwnProfilePage.tsx`** — loading/error/success/409, guardar/cancelar y aviso de cambios pendientes.
10. **Rutas/navegación** — Añadir `/admin/profile` antes de not-found y acción “Completar perfil” en `ProfileSummary`; sin permission guard.
11. **Enlaces externos** — Renderizar solo URLs validadas; en web `target="_blank" rel="noopener noreferrer"`; en nativo evaluar API existente antes de añadir `@capacitor/browser`.
12. **Estilos/tests** — Responsive, dark mode, avatar, schema, API/hook, errores, archivo inválido, limpieza de object URL, ruta sin permisos y Android.

## Decisiones

- **Ruta propia accesible por sesión** — No reutiliza la pantalla administrativa con `users.update`.
- **File chooser nativo del WebView** — Evita plugin/permisos nuevos mientras cubra galería y cámara ofrecida por Android.
- **Fallback por iniciales** — Reutiliza el comportamiento real y evita depender de red para una imagen predeterminada.

## Riesgos

- **Base64 consume memoria** — Límite 2 MiB, preview liberado y una sola transformación por envío.
- **Cache de avatar** — Usar `avatarUpdatedAt` como versión en query/URL; no cachear indefinidamente.
- **Navegación externa nativa** — Verificar mecanismo disponible; añadir plugin solo si WebView no abre de forma segura.
