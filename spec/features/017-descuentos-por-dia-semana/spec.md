# 017 · Descuentos por día de la semana

**Estado:** propuesta

## Qué hace

En la misma sección "Ubicación, precio y estado de la cancha" (`AvailabilityManagementPage.tsx`), el Gestor puede definir un porcentaje de descuento por día de la semana (lunes a domingo) sobre el precio por hora de la cancha. El Futbolista ve, al elegir una franja en `CourtsPage.tsx`, el precio ya con el descuento del día correspondiente aplicado, sin ningún cálculo hecho en el cliente.

## Por qué

Contraparte de `canchago` feature `025`: el backend ya calcula y expone el precio efectivo por día; falta la UI para que el Gestor configure el descuento y para que el Futbolista lo vea reflejado antes de reservar.

## Contrato de API consumido

_Verificado leyendo `canchago` directamente (feature `025-descuentos-por-dia-semana`, implementada en paralelo)._

- `PUT /api/resources/{resourceId}/weekday-discounts` — permiso `resources.manage`, mismo alcance que `PATCH /api/resources/{resourceId}`. Body `{ discounts: Array<{ weekday: number (0-6); discountPercent: number (0, 100] }> }`, reemplaza el conjunto completo (enviar `discounts: []` quita todos los descuentos). Responde `{ data: Array<{ weekday, discountPercent }> }`.
- `GET /api/resources` y `GET /api/resources/{resourceId}` ahora incluyen `weekdayDiscounts: Array<{ weekday, discountPercent }>` en cada recurso.
- `GET /api/resources/{resourceId}/availability` ahora incluye `effectiveHourlyPrice` en cada franja (precio ya con el descuento de su día aplicado, o el precio base si no aplica ninguno).
- Si el contrato real difiere de esto al integrar, se relee `canchago` y se corrige aquí antes de escribir tipos sobre un supuesto.

## Criterios de aceptación

- [ ] En "Ubicación, precio y estado de la cancha", el Gestor ve un control por cada día de la semana para ingresar un porcentaje de descuento opcional (vacío = sin descuento ese día).
- [ ] Guardar los descuentos llama a `PUT /api/resources/{resourceId}/weekday-discounts` con el conjunto completo, incluidos los días sin descuento (omitidos del array).
- [ ] Un porcentaje inválido (fuera de `(0, 100]`) se valida en el cliente antes de enviarlo, además de que el backend lo revalida.
- [ ] En `CourtsPage.tsx`, el precio por hora y el total mostrados antes de confirmar usan `effectiveHourlyPrice` de la franja elegida, no `hourlyPrice` del recurso.
- [ ] Si una franja no tiene descuento ese día, se muestra igual el precio normal (sin indicar descuento).
- [ ] Si una franja sí tiene descuento, se indica visualmente (por ejemplo, precio tachado + precio con descuento, o una etiqueta "Descuento").
- [ ] Estados `loading`/`error`/`success` de guardar descuentos siguen el mismo patrón que el resto de esta sección (`AppInteractionAlert`).

### Contratos y tipos (obligatorio)

- [ ] `ResourceDto` incluye `weekdayDiscounts`, `AvailabilitySlotDto` incluye `effectiveHourlyPrice`, y existe `UpdateWeekdayDiscountsRequest`/`WeekdayDiscountDto` en `src/types/api/reservas.ts`, reflejando exactamente el contrato real verificado en `canchago`.
- [ ] `../../constitution/api-integration.md` documenta el nuevo endpoint y los campos nuevos.

## Fuera de alcance

- Cualquier cálculo de descuento hecho en el cliente — el precio efectivo siempre viene ya calculado del backend.
- Descuentos por rango de fechas o promociones temporales (no existen en el backend de esta feature).
- Cambios a la lógica de creación de horarios mensuales (`createMonthlySchedule`) — el descuento es una propiedad de la cancha, no de la franja ni del mes.
