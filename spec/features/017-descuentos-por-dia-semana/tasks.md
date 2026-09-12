# 017 · Descuentos por día de la semana — Tareas

_Checklist accionable derivada del `plan.md`. Tareas pequeñas y concretas; marca `[x]` al completarlas._

- [x] Agregar `WeekdayDiscountDto`, `weekdayDiscounts` en `ResourceDto`, `effectiveHourlyPrice` en `AvailabilitySlotDto`, y `UpdateWeekdayDiscountsRequest` en `src/types/api/reservas.ts`.
- [x] Agregar `updateWeekdayDiscounts` en `src/services/api/endpoints/reservas.ts`.
- [x] Agregar `useUpdateWeekdayDiscounts` en `src/features/bookings/hooks/useBookings.ts`.
- [x] Crear `src/features/bookings/components/WeekdayDiscountEditor.tsx`.
- [x] Integrar el editor en `AvailabilityManagementPage.tsx`.
- [x] Actualizar `CourtsPage.tsx` para usar `effectiveHourlyPrice` de la franja elegida, con indicación visual cuando hay descuento.
- [x] Pruebas de `WeekdayDiscountEditor`: valida rango, arma el payload correcto (omite días vacíos), maneja error del backend. 4 pruebas, todas verdes.

## Contratos y tipos (obligatorio)

- [x] Definir/actualizar `src/types/api/reservas.ts` a partir del contrato real verificado en `canchago` (feature `025`, ya implementada del lado backend).
- [x] Actualizar `../../constitution/api-integration.md` con el nuevo endpoint y campos.
- [ ] Verificar manualmente contra el backend real (Postgres levantado, pero sin una reserva real de punta a punta con descuento aplicado) — pendiente.

## Cierre

- [ ] Validar contra los criterios de aceptación de `spec.md` (verificación de código y pruebas hecha; falta la verificación manual end-to-end de arriba).
- [x] `yarn lint && yarn typecheck && yarn test && yarn build` sin errores (pruebas acotadas a los archivos tocados, dado el OOM preexistente ya documentado de la suite completa).
- [ ] Mover la feature a "Hecho" en `../../constitution/roadmap.md` — pendiente hasta la verificación manual end-to-end.
