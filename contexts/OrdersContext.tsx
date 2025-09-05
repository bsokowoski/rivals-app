// contexts/OrdersContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'rivals.orders.v1';

export type OrderItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  imageUrl?: string;
};

export type Order = {
  id: string;
  userEmail: string;
  total: number;
  items: OrderItem[];
  createdAt: string; // ISO string
};

export type OrdersContextValue = {
  orders: Order[];
  addOrder: (order: Order) => void;
  removeOrder: (orderId: string) => void;
  clearAll: () => void; // ✅ expose this
};

const OrdersContext = createContext<OrdersContextValue | undefined>(undefined);

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);

  // Load persisted orders
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setOrders(JSON.parse(raw));
      } catch {
        // ignore
      }
    })();
  }, []);

  // Persist on change
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(orders)).catch(() => {});
  }, [orders]);

  const addOrder = (order: Order) => setOrders(prev => [order, ...prev]);

  const removeOrder = (orderId: string) =>
    setOrders(prev => prev.filter(o => o.id !== orderId));

  const clearAll = () => setOrders([]);

  const value = useMemo(
    () => ({ orders, addOrder, removeOrder, clearAll }),
    [orders]
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders(): OrdersContextValue {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used within an OrdersProvider');
  return ctx;
}
