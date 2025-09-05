// contexts/CollectionContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getMarketPrice } from "../services/collectr";

export type CollectionItem = {
  catalogId: string;
  name: string;
  setName?: string;
  number?: string;
  imageUrl?: string;
  rarity?: string;
  condition?: string; // e.g., "NM", "LP", etc.
  quantity: number;
  lastPrice?: number; // per-card estimated price (units)
  currency?: string;  // defaults "USD"
  updatedAt?: string; // ISO when last valued
};

type CollectionState = {
  items: CollectionItem[];
  totalValue: number;
  currency: string;
  addOrIncrement: (item: Omit<CollectionItem, "quantity" | "lastPrice" | "currency" | "updatedAt">, qty?: number) => Promise<void>;
  setQuantity: (catalogId: string, qty: number, condition?: string) => Promise<void>;
  removeItem: (catalogId: string, condition?: string) => Promise<void>;
  refreshValuations: () => Promise<void>;
  clearAll: () => Promise<void>;
};

const CollectionCtx = createContext<CollectionState | null>(null);
const STORAGE_KEY = "rivals.collection.v1";

export const CollectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [currency, setCurrency] = useState<string>("USD");

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: CollectionItem[] = JSON.parse(raw);
          setItems(parsed);
          const cur = parsed.find(i => i.currency)?.currency;
          if (cur) setCurrency(cur);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {});
  }, [items]);

  const totalValue = useMemo(
    () => items.reduce((sum, i) => sum + (i.lastPrice ?? 0) * i.quantity, 0),
    [items]
  );

  const upsert = (incoming: CollectionItem) => {
    setItems(prev => {
      const idx = prev.findIndex(
        p => p.catalogId === incoming.catalogId && (p.condition || "NM") === (incoming.condition || "NM")
      );
      if (idx >= 0) {
        const clone = [...prev];
        clone[idx] = { ...clone[idx], ...incoming };
        return clone;
      }
      return [incoming, ...prev];
    });
  };

  const addOrIncrement: CollectionState["addOrIncrement"] = async (base, qty = 1) => {
    const condition = base.condition || "NM";
    // Try to value immediately for better UX
    try {
      const { price, currency: cur } = await getMarketPrice({ catalogId: base.catalogId, condition });
      setCurrency(cur);
      upsert({
        ...base,
        condition,
        quantity: qty,
        lastPrice: price ?? undefined,
        currency: cur,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      upsert({
        ...base,
        condition,
        quantity: qty,
        currency,
      });
    }
  };

  const setQuantity: CollectionState["setQuantity"] = async (catalogId, qty, condition = "NM") => {
    setItems(prev =>
      prev.map(i =>
        i.catalogId === catalogId && (i.condition || "NM") === condition
          ? { ...i, quantity: qty }
          : i
      )
    );
  };

  const removeItem: CollectionState["removeItem"] = async (catalogId, condition = "NM") => {
    setItems(prev => prev.filter(i => !(i.catalogId === catalogId && (i.condition || "NM") === condition)));
  };

  const refreshValuations: CollectionState["refreshValuations"] = async () => {
    const updated: CollectionItem[] = [];
    for (const i of items) {
      try {
        const { price, currency: cur } = await getMarketPrice({
          catalogId: i.catalogId,
          condition: i.condition || "NM",
        });
        updated.push({
          ...i,
          lastPrice: price ?? i.lastPrice,
          currency: cur ?? i.currency,
          updatedAt: new Date().toISOString(),
        });
        if (cur) setCurrency(cur);
      } catch {
        updated.push(i);
      }
    }
    setItems(updated);
  };

  const clearAll = async () => {
    setItems([]);
    await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  };

  const value: CollectionState = {
    items,
    totalValue,
    currency,
    addOrIncrement,
    setQuantity,
    removeItem,
    refreshValuations,
    clearAll,
  };

  return <CollectionCtx.Provider value={value}>{children}</CollectionCtx.Provider>;
};

export const useCollection = () => {
  const ctx = useContext(CollectionCtx);
  if (!ctx) throw new Error("useCollection must be used within CollectionProvider");
  return ctx;
};
