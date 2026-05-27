import { useEffect, useMemo, useState } from 'react';
import { appLabels } from '../copy.js';
import { initialSettings } from '../mockData.js';

function getInitialLocale() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get('lang');
  let stored = initialSettings.defaultLocale;

  try {
    stored = window.localStorage.getItem('cr-locale') || initialSettings.defaultLocale;
  } catch {
    stored = initialSettings.defaultLocale;
  }

  return appLabels[requested] ? requested : appLabels[stored] ? stored : 'id';
}

export function useI18n() {
  const [locale, setLocaleState] = useState(getInitialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      window.localStorage.setItem('cr-locale', locale);
    } catch {
      // Browser storage can be disabled in previews; labels still resolve from memory.
    }
  }, [locale]);

  const t = useMemo(() => {
    return (key, values = {}) => {
      const template = appLabels[locale]?.[key] ?? appLabels.id?.[key] ?? key;
      return Object.entries(values).reduce(
        (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
        template,
      );
    };
  }, [locale]);

  const setLocale = (nextLocale) => {
    if (!appLabels[nextLocale]) return;
    setLocaleState(nextLocale);
    const url = new URL(window.location.href);
    url.searchParams.set('lang', nextLocale);
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  };

  return { locale, setLocale, t };
}
