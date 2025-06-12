// frontend/src/useDebounce.js
import { useState, useEffect } from 'react';

// Este hook toma un valor y un retraso (delay)
// y solo devuelve el valor más reciente después de que no ha cambiado durante el tiempo de retraso.
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Configura un temporizador para actualizar el valor debounced después del retraso
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpia el temporizador si el valor cambia (por ejemplo, el usuario sigue moviendo el slider)
    // Esto reinicia el "conteo" y evita que se actualice hasta que el usuario se detenga.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Solo se vuelve a ejecutar si el valor o el retraso cambian

  return debouncedValue;
}

export default useDebounce;