"use client";

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { defaultEventDate } from '@/marketplace/format';

const CART_KEY = 'kbr-marketplace-cart:v1';
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [eventDate, setEventDate] = useState(defaultEventDate);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(CART_KEY));
        if (Array.isArray(saved?.items)) setItems(saved.items);
        if (saved?.eventDate) setEventDate(saved.eventDate);
      } catch {
        localStorage.removeItem(CART_KEY);
      } finally {
        setHydrated(true);
      }
    }, 0);

    return () => window.clearTimeout(hydrationTimer);
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(CART_KEY, JSON.stringify({ items, eventDate }));
    }
  }, [eventDate, hydrated, items]);

  const addItem = (costume, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((item) => item.id === costume.id);
      if (existing) {
        return current.map((item) =>
          item.id === costume.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, costume.maxQuantity) }
            : item
        );
      }
      return [...current, { ...costume, quantity: Math.min(quantity, costume.maxQuantity) }];
    });
  };

  const updateQuantity = (id, quantity) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, Math.min(quantity, item.maxQuantity)) }
          : item
      )
    );
  };

  const removeItem = (id) => setItems((current) => current.filter((item) => item.id !== id));
  const clearCart = () => setItems([]);
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);

  const value = useMemo(
    () => ({
      items,
      eventDate,
      setEventDate,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      itemCount,
      subtotal,
      hydrated,
    }),
    [eventDate, hydrated, itemCount, items, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}
