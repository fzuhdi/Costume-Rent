"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { marketplaceApi } from '@/marketplace/api';

const CustomerAuthContext = createContext(null);

export function CustomerAuthProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    marketplaceApi.session().then((value) => {
      if (active) setCustomer(value);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const login = useCallback(async (credentials) => {
    const value = await marketplaceApi.login(credentials);
    setCustomer(value);
    return value;
  }, []);
  const value = useMemo(() => ({ customer, loading, login, setCustomer }), [customer, loading, login]);
  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (!context) throw new Error('useCustomerAuth must be used inside CustomerAuthProvider');
  return context;
}
