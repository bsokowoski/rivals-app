import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { InventoryItem } from './InventoryContext';

export type CartItem = {
  id: string;
  name: string;
  price?: number;      // price may be missing on some items; treat missing as 0 in totals
  imageUrl?: string;
  quantity: number;    // always >= 1 in cart
  sku?: string;
  set?: string;
  number?: string | number;
  [key: string]: any;
};

export type CartContextValue = {
  items: CartItem[];
  addItem: (item: InventoryItem | CartItem, qty?: number) => void;
  removeItem: (id: string) => void;
  increment: (id: string, delta?: number) => void;
  decrement: (id: string, delta?: number) => void;
  setQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  totalCount: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);

function normalizeToCartItem(
  item: InventoryItem | CartItem,
  qty: number
): CartItem {
  const baseQty = Math.max(1, Math.floor(qty || 1));
  return {
    id: String((item as any).id),
    name: String((item as any).name ?? 'Unknown'),
    price: typeof (item as any).price === 'number' ? (item as any).price : undefined,
    imageUrl: (item as any).imageUrl,
    sku: (item as any).sku,
    set: (item as any).set,
    number: (item as any).number,
    quantity: baseQty,
    ...item, // keep any extra fields
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (item: InventoryItem | CartItem, qty = 1) => {
    const normalized = normalizeToCartItem(item, qty);
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.id === normalized.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + normalized.quantity };
        return next;
      }
      return [...prev, normalized];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  const increment = (id: string, delta = 1) => {
    setItems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, quantity: Math.max(1, p.quantity + delta) } : p))
    );
  };

  const decrement = (id: string, delta = 1) => {
    setItems((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, quantity: Math.max(1, p.quantity - delta) } : p
      )
    );
  };

  const setQuantity = (id: string, qty: number) => {
    const q = Math.max(1, Math.floor(qty || 1));
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, quantity: q } : p)));
  };

  const clearCart = () => setItems([]);

  const totalCount = useMemo(
    () => items.reduce((sum, i) => sum + Number(i.quantity || 0), 0),
    [items]
  );

  const subtotal = useMemo(
    () =>
      items.reduce((sum, i) => {
        const price = typeof i.price === 'number' ? i.price : 0;
        return sum + price * (i.quantity || 0);
      }, 0),
    [items]
  );

  const value: CartContextValue = {
    items,
    addItem,
    removeItem,
    increment,
    decrement,
    setQuantity,
    clearCart,
    totalCount,
    subtotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
