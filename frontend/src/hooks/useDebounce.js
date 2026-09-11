/**
 * hooks/useDebounce.js
 * Debounces a value by a given delay.
 * Use for search inputs to avoid firing API calls on every keystroke.
 */
import { useState, useEffect } from 'react';

const useDebounce = (value, delay = 400) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
