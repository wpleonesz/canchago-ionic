import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@ionic/react', () => ({
  IonAlert: ({
    header,
    message,
    cssClass,
    onDidDismiss,
  }: {
    header: string;
    message: string;
    cssClass: string;
    onDidDismiss?: () => void;
  }) => (
    <button type="button" data-header={header} data-message={message} data-css-class={cssClass} onClick={onDidDismiss}>
      Cerrar alerta
    </button>
  ),
}));

import AppInteractionAlert from './AppInteractionAlert';

describe('AppInteractionAlert', () => {
  it('uses a coherent default title and exposes the message through IonAlert', () => {
    const { container } = render(<AppInteractionAlert isOpen kind="error" message="El servidor no respondió." />);

    const alert = container.querySelector('button');
    expect(alert).toHaveAttribute('data-header', 'No se pudo completar la operación');
    expect(alert).toHaveAttribute('data-message', 'El servidor no respondió.');
    expect(alert).toHaveAttribute('data-css-class', 'app-interaction-alert app-interaction-alert--error');
  });

  it('notifies the owner after a manual dismissal', () => {
    const onDismiss = vi.fn();
    const { container } = render(
      <AppInteractionAlert isOpen kind="success" message="Cambios guardados." onDismiss={onDismiss} />,
    );
    fireEvent.click(container.querySelector('button')!);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
