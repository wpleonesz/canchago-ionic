# 017 · Descuentos por día de la semana — Plan

_Cómo se implementa lo descrito en `spec.md`. Debe respetar la `constitution/`._

## Enfoque

Un componente pequeño y reutilizable `WeekdayDiscountEditor` (siete inputs de porcentaje, uno por día, reutilizando `WEEKDAYS` ya definido en `AvailabilityManagementPage.tsx`) integrado en el mismo acordeón "Ubicación, precio y estado de la cancha", con su propia mutación (`useUpdateWeekdayDiscounts`) y su propio botón de guardado — igual criterio que la sección de estado/ubicación: no todo pertenece al mismo formulario porque cada pieza tiene su propio endpoint y su propio ciclo de guardado.

En `CourtsPage.tsx`, el cambio es mínimo: usar `slot.effectiveHourlyPrice` en vez de `selectedResource.hourlyPrice` para el precio y el total antes de confirmar.

## Implementación

1. **`src/types/api/reservas.ts`** — agregar `WeekdayDiscountDto` (`{ weekday: number; discountPercent: string }`, string porque el backend serializa `Decimal` como texto igual que `hourlyPrice`), `weekdayDiscounts: WeekdayDiscountDto[]` en `ResourceDto`, `effectiveHourlyPrice: string` en `AvailabilitySlotDto`, y `UpdateWeekdayDiscountsRequest { discounts: Array<{ weekday: number; discountPercent: number }> }`.
2. **`src/services/api/endpoints/reservas.ts`** — `updateWeekdayDiscounts(resourceId, body)` → `PUT /resources/{resourceId}/weekday-discounts`.
3. **`src/features/bookings/hooks/useBookings.ts`** — `useUpdateWeekdayDiscounts(resourceId)`, invalida `['resources']` igual que `useUpdateResource`.
4. **`src/features/bookings/components/WeekdayDiscountEditor.tsx`** (nuevo) — recibe `resourceId` y `initialDiscounts`, mantiene un mapa local `weekday → porcentaje | ''`, valida `(0,100]` antes de habilitar guardar, arma el array final (omite días vacíos) y llama a la mutación.
5. **`AvailabilityManagementPage.tsx`** — montar `WeekdayDiscountEditor` dentro del acordeón "Ubicación, precio y estado de la cancha" cuando hay una cancha seleccionada, pasando `selectedResource.weekdayDiscounts`.
6. **`CourtsPage.tsx`** — usar `selectedSlotData.effectiveHourlyPrice` (no `selectedResource.hourlyPrice`) en el resumen y el total; si difiere de `selectedResource.hourlyPrice`, mostrar una indicación visual simple (precio tachado + nuevo precio).
7. **`../../constitution/api-integration.md`** — documentar el endpoint y los campos nuevos apenas se verifique el contrato real contra el backend de la feature `025`.

## Decisiones

- **Editor separado del resto del formulario de la cancha** — mismo criterio que el control de estado (feature `015`): cada pieza con su propio endpoint tiene su propio guardado, en vez de un único formulario gigante con validación cruzada innecesaria.
- **`discountPercent`/`effectiveHourlyPrice` como `string`** — el backend serializa todo `Decimal` como texto (mismo criterio que `hourlyPrice` ya existente); no se introduce una excepción para estos campos nuevos.
- **Sin cálculo de descuento en el cliente** — el backend siempre entrega el precio final; el cliente solo lo muestra y, opcionalmente, indica que hubo un descuento comparando contra el precio base ya recibido.

## Riesgos

- **Contrato aún no estabilizado del lado backend** (feature `025` en paralelo) — mitigado releyendo el código real de `canchago` antes de fijar los tipos, no antes de este documento.
- **Confundir visualmente "sin descuento" con "descuento 0%"** — el backend nunca persiste un descuento de 0% (rango válido es `(0,100]`), así que la ausencia de una entrada para un día ya es inequívoca.
