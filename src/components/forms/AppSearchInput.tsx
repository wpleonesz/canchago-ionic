import { useEffect, useState } from 'react';
import { IonSearchbar } from '@ionic/react';
import { useDebounce } from '../../hooks/useDebounce';

interface AppSearchInputProps {
  placeholder?: string;
  initialValue?: string;
  debounceMs?: number;
  onSearch: (value: string) => void;
}

// Debounce genérico de búsqueda (tech-stack.md §3, requerido por la feature 005 para no
// saturar el backend con cada tecla — mínimo ~300ms, ver spec 005).
const AppSearchInput: React.FC<AppSearchInputProps> = ({
  placeholder = 'Buscar',
  initialValue = '',
  debounceMs = 300,
  onSearch,
}) => {
  const [value, setValue] = useState(initialValue);
  const debouncedValue = useDebounce(value, debounceMs);

  useEffect(() => {
    onSearch(debouncedValue);
    // onSearch se recrea en cada render del padre; solo nos interesa reaccionar al valor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);

  return (
    <IonSearchbar
      className="app-search-input"
      placeholder={placeholder}
      value={value}
      debounce={0}
      onIonInput={event => setValue(event.detail.value ?? '')}
    />
  );
};

export default AppSearchInput;
