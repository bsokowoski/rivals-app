import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { InventoryItem } from './InventoryContext';
import {
  getCollection,
  setCollection as persistCollection,
  upsertItem,
  removeItem,
  clearCollection,
} from '../services/collection';

export type CollectionContextValue = {
  items: InventoryItem[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  add: (item: InventoryItem) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clear: () => Promise<void>;
  setAll: (items: InventoryItem[]) => Promise<void>;
  count: number;
  totalQty: number;
  estValue: number;
};

const CollectionContext = createContext<CollectionContextValue | null>(null);

export function CollectionProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await getCollection();
      setItems(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(async (item: InventoryItem) => {
    await upsertItem({ ...item, quantity: Math.max(1, Number(item.quantity ?? 1)) });
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await removeItem(id);
    await refresh();
  }, [refresh]);

  const clear = useCallback(async () => {
    await clearCollection();
    await refresh();
  }, [refresh]);

  const setAll = useCallback(async (next: InventoryItem[]) => {
    await persistCollection(next);
    await refresh();
  }, [refresh]);

  const { count, totalQty, estValue } = useMemo(() => {
    const count = items.length;
    const totalQty = items.reduce((s, i) => s + Number(i.quantity ?? 0), 0);
    const estValue = items.reduce((s, i) => {
      const p = typeof i.price === 'number' ? i.price : 0;
      const q = Number(i.quantity ?? 1);
      return s + p * q;
    }, 0);
    return { count, totalQty, estValue };
  }, [items]);

  const value: CollectionContextValue = {
    items,
    isLoading,
    refresh,
    add,
    remove,
    clear,
    setAll,
    count,
    totalQty,
    estValue,
  };

  return <CollectionContext.Provider value={value}>{children}</CollectionContext.Provider>;
}

export function useCollection() {
  const ctx = useContext(CollectionContext);
  if (!ctx) throw new Error('useCollection must be used within CollectionProvider');
  return ctx;
}
