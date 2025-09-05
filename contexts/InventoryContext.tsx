import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { INVENTORY_URL } from '../env';

export type InventoryItem = {
  id: string;
  sku: string;
  name: string;
  set?: string;
  number?: string | number;
  rarity?: string;
  condition?: string;
  price?: number;
  quantity?: number;
  imageUrl?: string;
  [key: string]: any;
};

type InventoryContextValue = {
  items: InventoryItem[];
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  /** Replace items locally (e.g., after CSV import) without hitting the server. */
  setItemsLocal: (items: InventoryItem[]) => void;
};

const InventoryContext = createContext<InventoryContextValue | null>(null);

function coerceNumber(n: any, fallback = 0): number {
  const v = Number(String(n ?? '').replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(v) ? v : fallback;
}

function normalizeRow(r: any): InventoryItem {
  const set = r.set ?? r.Set ?? r.series ?? '';
  const number = r.number ?? r.No ?? r.num ?? '';
  const name = r.name ?? r.cardName ?? r.title ?? 'Unknown';

  const baseSku =
    [set, number, name].filter(Boolean).join('|') ||
    String(r.sku || r.id || Math.random());

  const price =
    r.price !== undefined && r.price !== null
      ? coerceNumber(r.price, NaN)
      : undefined;

  const quantity = coerceNumber(r.quantity, 0);

  const {
    id: _id,
    sku: _sku,
    name: _name,
    quantity: _qty,
    price: _price,
    ...rest
  } = (r || {}) as Record<string, any>;

  const out: InventoryItem = {
    ...rest,
    ...(price !== undefined ? { price } : {}),
    id: _id ?? baseSku,
    sku: _sku ?? baseSku,
    name: _name ?? name,
    set,
    number,
    quantity,
  };
  return out;
}

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!INVENTORY_URL) throw new Error('INVENTORY_URL not set');
      const res = await fetch(INVENTORY_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const normalized = Array.isArray(data) ? data.map(normalizeRow) : [];
      setItems(normalized);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load inventory');
    } finally {
      setIsLoading(false);
      setIsHydrated(true);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setItemsLocal = (next: InventoryItem[]) => {
    setItems(next.map(normalizeRow));
    setIsHydrated(true);
  };

  const value = useMemo(
    () => ({ items, isLoading, isHydrated, error, refresh, setItemsLocal }),
    [items, isLoading, isHydrated, error]
  );

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error('useInventory must be used within InventoryProvider');
  return ctx;
}
