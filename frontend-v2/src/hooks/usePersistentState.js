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

  return [state, setState];
}
