import { useEffect, useState } from 'react';

export function usePersistentState(key, fallback) {
  const [state, setState] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Local state remains valid for the current session.
    }
  }, [key, state]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== key) return;
      try {
        setState(event.newValue ? JSON.parse(event.newValue) : fallback);
      } catch {
        setState(fallback);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [fallback, key]);

  return [state, setState];
}
