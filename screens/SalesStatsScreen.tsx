// File: screens/SalesStatsScreen.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

type OrderHistoryItem = {
  id: string;
  placedAt: string; // ISO
};

type DraftProduct = {
  id: string;
  createdAt: string; // ISO
};

type InventoryProduct = {
  id: string;
  publishedAt: string; // ISO
};

const ORDERS_KEY = 'orders:history';
const DRAFTS_KEY = 'seller:products';
const INVENTORY_KEY = 'inventory:products';

async function safeGet<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function withinDays(iso: string | undefined, days: number): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  const now = Date.now();
  const ms = days * 24 * 60 * 60 * 1000;
  return now - t <= ms && t <= now;
}

const SalesStatsScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [drafts, setDrafts] = useState<DraftProduct[]>([]);
  const [inventory, setInventory] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    const [o, d, i] = await Promise.all([
      safeGet<OrderHistoryItem[]>(ORDERS_KEY, []),
      safeGet<DraftProduct[]>(DRAFTS_KEY, []),
      safeGet<InventoryProduct[]>(INVENTORY_KEY, []),
    ]);

    // Normalize ordering (newest first)
    o.sort((a, b) => (b.placedAt || '').localeCompare(a.placedAt || ''));
    d.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    i.sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));

    setOrders(o);
    setDrafts(d);
    setInventory(i);
  }, []);

  // initial load
  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchAll();
      setLoading(false);
    })();
  }, [fetchAll]);

  // refresh on focus
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        if (!active) return;
        await fetchAll();
      })();
      return () => {
        active = false;
      };
    }, [fetchAll])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }, [fetchAll]);

  // Derived stats
  const {
    totalOrders,
    orders7d,
    orders30d,
    lastOrderAt,
    inventoryCount,
    draftsCount,
    publishRatePct,
    published7d,
  } = useMemo(() => {
    const total = orders.length;
    const lastAt = orders[0]?.placedAt;
    const in7 = orders.filter((o) => withinDays(o.placedAt, 7)).length;
    const in30 = orders.filter((o) => withinDays(o.placedAt, 30)).length;

    const inv = inventory.length;
    const dr = drafts.length;
    const denom = inv + dr;
    const rate = denom > 0 ? Math.round((inv / denom) * 100) : 0;

    const inv7 = inventory.filter((p) => withinDays(p.publishedAt, 7)).length;

    return {
      totalOrders: total,
      orders7d: in7,
      orders30d: in30,
      lastOrderAt: lastAt,
      inventoryCount: inv,
      draftsCount: dr,
      publishRatePct: rate,
      published7d: inv7,
    };
  }, [orders, inventory, drafts]);

  const StatTile = ({
    label,
    value,
    hint,
    accent = false,
  }: {
    label: string;
    value: string | number;
    hint?: string;
    accent?: boolean;
  }) => (
    <View
      style={[
        styles.tile,
        { borderColor: accent ? '#ef4444' : '#1f2937' },
      ]}
    >
      <Text style={[styles.value, accent && { color: '#ef4444' }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {!!hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>Sales Overview</Text>
      <Text style={styles.subtitle}>
        Lightweight stats based on local order history.
      </Text>

      {/* Orders block */}
      <Text style={styles.section}>Orders</Text>
      <View style={styles.grid}>
        <StatTile label="Total Orders" value={loading ? '—' : totalOrders} accent />
        <StatTile label="Last 7 Days" value={loading ? '—' : orders7d} />
        <StatTile label="Last 30 Days" value={loading ? '—' : orders30d} />
      </View>
      <View style={styles.detailCard}>
        <Text style={styles.detailLabel}>Last Order</Text>
        <Text style={styles.detailValue}>
          {loading
            ? '—'
            : lastOrderAt
            ? new Date(lastOrderAt).toLocaleString()
            : 'No orders yet'}
        </Text>
      </View>

      {/* Inventory block */}
      <Text style={styles.section}>Catalog</Text>
      <View style={styles.grid}>
        <StatTile label="Live Inventory" value={loading ? '—' : inventoryCount} accent />
        <StatTile label="Drafts" value={loading ? '—' : draftsCount} />
        <StatTile
          label="Publish Rate"
          value={loading ? '—' : `${publishRatePct}%`}
          hint="Inventory / (Inventory + Drafts)"
        />
      </View>
      <View style={styles.detailCard}>
        <Text style={styles.detailLabel}>Published (7d)</Text>
        <Text style={styles.detailValue}>{loading ? '—' : published7d}</Text>
      </View>

      {/* Actions */}
      <View style={{ height: 12 }} />
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: '#ef4444' }]}
        onPress={() => navigation.navigate('OrderHistory')}
        activeOpacity={0.85}
      >
        <Text style={styles.btnText}>View Order History</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: '#1f2937', marginTop: 8 }]}
        onPress={() => navigation.navigate('DraftsList')}
        activeOpacity={0.85}
      >
        <Text style={styles.btnText}>Manage Drafts</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: '#1f2937', marginTop: 8 }]}
        onPress={() => navigation.navigate('Tabs', { screen: 'Inventory' })}
        activeOpacity={0.85}
      >
        <Text style={styles.btnText}>Go to Inventory</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0c' },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  subtitle: { color: '#9ca3af', marginTop: 6, marginBottom: 14 },

  section: {
    color: '#9ca3af',
    marginTop: 10,
    marginBottom: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontSize: 12,
  },

  grid: {
    flexDirection: 'row',
    gap: 10,
  },
  tile: {
    flex: 1,
    backgroundColor: '#111216',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  value: { color: '#fff', fontSize: 20, fontWeight: '800' },
  label: { color: '#9ca3af', marginTop: 8 },
  hint: { color: '#6b7280', fontSize: 11, marginTop: 4 },

  detailCard: {
    backgroundColor: '#111216',
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  detailLabel: { color: '#9ca3af' },
  detailValue: { color: '#fff', fontWeight: '800', marginTop: 6 },

  btn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontWeight: '800' },
});

export default SalesStatsScreen;
