import { IonInput, IonNote } from '@ionic/react';
import { useEffect, useState } from 'react';
import AppButton from '../../../components/common/AppButton';
import AppInteractionAlert from '../../../components/feedback/AppInteractionAlert';
import { AppClientError } from '../../../services/api/errorMapper';
import type { WeekdayDiscountDto } from '../../../types/api/reservas';
import { useUpdateWeekdayDiscounts } from '../hooks/useBookings';
import { WEEKDAYS } from '../utils/monthly-schedule';

interface WeekdayDiscountEditorProps {
  resourceId: string;
  discounts: WeekdayDiscountDto[];
}

// Un valor por día: '' significa "sin descuento ese día". Nunca se persiste 0, porque el
// backend solo acepta (0, 100] — un 0% explícito no tendría efecto distinto de omitir el día.
type DiscountInputs = Record<number, string>;

const toInputs = (discounts: WeekdayDiscountDto[]): DiscountInputs =>
  Object.fromEntries(discounts.map(discount => [discount.weekday, discount.discountPercent]));

const isValidPercent = (value: string): boolean => {
  if (value === '') return true;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 && parsed <= 100;
};

const WeekdayDiscountEditor: React.FC<WeekdayDiscountEditorProps> = ({ resourceId, discounts }) => {
  const [inputs, setInputs] = useState<DiscountInputs>(() => toInputs(discounts));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const mutation = useUpdateWeekdayDiscounts(resourceId);

  useEffect(() => {
    setInputs(toInputs(discounts));
  }, [discounts]);

  const hasInvalidValue = Object.values(inputs).some(value => !isValidPercent(value));

  const save = async (): Promise<void> => {
    setError(null);
    setSuccess(false);
    try {
      await mutation.mutateAsync({
        discounts: Object.entries(inputs)
          .filter(([, value]) => value !== '')
          .map(([weekday, value]) => ({ weekday: Number(weekday), discountPercent: Number(value) })),
      });
      setSuccess(true);
    } catch (thrown) {
      setError(thrown instanceof AppClientError ? thrown.message : 'No se pudieron guardar los descuentos.');
    }
  };

  return (
    <div className="booking-stack weekday-discount-editor">
      <IonNote>
        Define un descuento opcional por día de la semana sobre el precio por hora. Déjalo vacío para cobrar el precio
        normal ese día.
      </IonNote>
      {WEEKDAYS.map(day => {
        const value = inputs[day.value] ?? '';
        const invalid = !isValidPercent(value);
        return (
          <div key={day.value} className="weekday-discount-editor__row">
            <IonInput
              className="app-input"
              fill="outline"
              label={day.short}
              labelPlacement="start"
              aria-label={`Descuento del ${day.short}`}
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="Sin descuento"
              value={value}
              onIonInput={event => {
                const next = String(event.detail.value ?? '');
                setInputs(current => ({ ...current, [day.value]: next }));
              }}
            >
              <div slot="end">%</div>
            </IonInput>
            {invalid && (
              <IonNote color="danger">El descuento del {day.short} debe estar entre 0 y 100.</IonNote>
            )}
          </div>
        );
      })}
      <AppButton disabled={hasInvalidValue} isLoading={mutation.isPending} onClick={() => void save()}>
        Guardar descuentos
      </AppButton>
      <AppInteractionAlert
        isOpen={Boolean(error)}
        kind="error"
        header="No se pudieron guardar los descuentos"
        message={error ?? ''}
        onDismiss={() => setError(null)}
      />
      <AppInteractionAlert
        isOpen={success}
        kind="success"
        message="Descuentos actualizados."
        onDismiss={() => setSuccess(false)}
      />
    </div>
  );
};

export default WeekdayDiscountEditor;
