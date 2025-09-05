// utils/analytics.ts
import type { Order } from '../contexts/OrdersContext';

export type SalesSummary = {
  ordersCount: number;
  revenue: number;
  aov: number; // average order value
  itemsSold: number;
};

export function computeSalesSummary(orders: Order[]): SalesSummary {
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const itemsSold = orders.reduce((s, o) => s + o.items.reduce((x, i) => x + i.qty, 0), 0);
  const ordersCount = orders.length;
  const aov = ordersCount ? revenue / ordersCount : 0;
  return { ordersCount, revenue, aov, itemsSold };
}

export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}

/** Returns an array of 7 numbers for the last 7 days (oldest -> newest) */
export function revenueLast7Days(orders: Order[]): number[] {
  const today = new Date();
  const days: number[] = Array(7).fill(0);

  for (const o of orders) {
    const d = new Date(o.createdAt);
    // Find which day bucket: 0 oldest … 6 today
    const diffDays = Math.floor((stripTime(today).getTime() - stripTime(d).getTime()) / 86400000);
    if (diffDays >= 0 && diffDays < 7) {
      const idx = 6 - diffDays; // newest at the end
      days[idx] += o.total;
    }
  }
  return days;
}

function stripTime(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function topProducts(orders: Order[], limit = 5): Array<{ id: string; name: string; qty: number; revenue: number; }> {
  const map = new Map<string, { id: string; name: string; qty: number; revenue: number; }>();
  for (const o of orders) {
    for (const it of o.items) {
      const key = it.id;
      const prev = map.get(key) ?? { id: it.id, name: it.name, qty: 0, revenue: 0 };
      prev.qty += it.qty;
      prev.revenue += it.price * it.qty;
      map.set(key, prev);
    }
  }
  return [...map.values()]
    .sort((a, b) => b.revenue - a.revenue || b.qty - a.qty)
    .slice(0, limit);
}
