// utils/exportOrders.ts
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import type { Order } from '../contexts/OrdersContext';
import { toCSV } from './csv';

export async function exportOrdersCSV(orders: Order[]) {
  // Flatten orders → rows (one row per line item)
  const rows = orders.flatMap((o) =>
    o.items.map((it) => ({
      order_id: o.id,
      created_at: o.createdAt,
      user_email: o.userEmail,
      item_id: it.id,
      item_name: it.name,
      qty: it.qty,
      price: it.price,
      line_total: it.price * it.qty,
      order_total: o.total,
    }))
  );

  const csv = toCSV(rows, [
    'order_id',
    'created_at',
    'user_email',
    'item_id',
    'item_name',
    'qty',
    'price',
    'line_total',
    'order_total',
  ]);

  const filename = `rivals-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  const uri = FileSystem.cacheDirectory + filename;

  await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });

  // On iOS/Android show the system share sheet; on web (or if unavailable) just return the URI
  if (Platform.OS !== 'web' && (await Sharing.isAvailableAsync())) {
    await Sharing.shareAsync(uri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Orders CSV',
      UTI: 'public.comma-separated-values-text',
    });
    return;
  }

  return uri;
}
