# Misión

_Proveer la experiencia móvil oficial de Canchago: una aplicación Ionic + React + TypeScript, profesional y segura, que consuma exclusivamente los contratos reales del backend `canchago` para que administradores, personal de sede y deportistas gestionen y reserven espacios deportivos desde el teléfono._

## Qué construimos

Construimos el cliente móvil (y web embebible) de la plataforma SaaS multi-tenant `canchago`. No reimplementamos reglas de negocio: las consumimos.

1. **Cliente fiel al contrato** — Una capa de tipos TypeScript y servicios de API que reflejan exactamente lo que el backend expone hoy (no lo que "debería" exponer). Ningún endpoint se inventa; si falta, se documenta como propuesta en `api-integration.md` y se espera confirmación.
2. **Experiencia multi-rol** — La misma app sirve a administradores (gestión de organizaciones, sedes, usuarios, roles) y a deportistas (búsqueda y reserva de espacios), mostrando solo lo que el permiso del usuario autoriza — el backend es siempre la autoridad final, el frontend solo oculta/muestra UI.
3. **Base extensible y segura** — Arquitectura modular por feature, lista para crecer hacia el motor de reservas cuando el backend lo exponga, sin convertirse en un monolito de pantallas acopladas.

## Para quién

- **Administradores y personal de sede:** necesitan gestionar organizaciones, sedes, usuarios y roles desde el móvil con la misma seguridad que la web.
- **Deportistas y clientes finales:** necesitan una experiencia rápida y sin fricción para descubrir disponibilidad y reservar (cuando el backend exponga ese dominio).
- **El propio equipo de desarrollo:** se beneficia de una capa de API centralizada, tipada y trazable que evita que la lógica de contrato se disperse entre pantallas.

## Principios

- **El backend es la fuente de verdad** — Ningún modelo, endpoint o regla de negocio se inventa en el frontend. Se lee el código real de `canchago` antes de integrar cualquier pantalla.
- **El Contrato es la Ley (heredado de `canchago`)** — Igual que el backend no programa un endpoint sin spec aprobada, el frontend no consume un endpoint sin haber verificado su contrato real y documentado su tipo.
- **Modularidad por feature** — Cada dominio (auth, usuarios, organizaciones, roles, reservas futuras) vive en su propio directorio bajo `src/features/`, desacoplado de los demás.
- **Seguridad por diseño, no por parche** — Sesión, tokens y datos sensibles se tratan con el mismo rigor que exige OWASP Mobile/API, desde el primer commit, no como revisión posterior.
- **Trazabilidad extremo a extremo** — Toda operación relevante debe poder rastrearse desde el usuario y la pantalla hasta el request HTTP y su resultado, correlacionando con los identificadores que exponga el backend.

## Qué NO es

- NO es un lugar para reimplementar validaciones de negocio que ya vive en el backend — solo mejora UX; el backend valida siempre.
- NO es un proyecto con frontend web separado: es una sola base Ionic React que se empaqueta como app nativa (Capacitor) y, si conviene, como PWA.
- NO es un cliente que confía en sí mismo para autorización: los permisos que muestra son un reflejo de lo que el backend concede, nunca una fuente independiente.
