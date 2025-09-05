import { Share } from 'react-native';

type OrderLine = { id: string; name: string; quantity: number; price?: number };
type Order = {
  id: string;
  lines: OrderLine[];
  createdAt?: string | number | Date;
};

function toCsv(orders: Order[]): string {
  const header = ['order_id', 'created_at', 'item_id', 'name', 'qty', 'price', 'line_total'];
  const rows = orders.flatMap((o) =>
    o.lines.map((l) => {
      const price = typeof l.price === 'number' ? l.price : 0;
      const total = price * (l.quantity || 0);
      return [
        o.id,
        o.createdAt ? new Date(o.createdAt).toISOString() : '',
        l.id,
        l.name?.replace(/"/g, '""') ?? '',
        String(l.quantity ?? 0),
        price.toFixed(2),
        total.toFixed(2),
      ];
    })
  );
  const csv = [header.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
  return csv;
}

/** Share a CSV export of orders using the native share sheet. */
export async function exportOrders(orders: Order[], filename = 'orders.csv'): Promise<void> {
  const csv = toCsv(orders);
  // Share as plain text (most platforms will offer "Save to Files" or similar)
  await Share.share({
    title: filename,
    message: csv,
  });
}
