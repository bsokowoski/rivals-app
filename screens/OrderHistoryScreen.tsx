// File: screens/OrderHistoryScreen.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

type OrderHistoryItem = {
  id: string;
  placedAt: string; // ISO timestamp
};

const ORDERS_KEY = 'orders:history';

async function loadOrders(): Promise<OrderHistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(ORDERS_KEY);
    return raw ? (JSON.parse(raw) as OrderHistoryItem[]) : [];
  } catch {
    return [];
  }
}

async function saveOrders(items: OrderHistoryItem[]) {
  try {
    await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(items));
  } catch {}
}

const OrderHistoryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    const data = await loadOrders();
    // Newest first by placedAt
    data.sort((a, b) => (b.placedAt || '').localeCompare(a.placedAt || ''));
    setOrders(data);
  }, []);

  // Initial load
  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchOrders();
      setLoading(false);
    })();
  }, [fetchOrders]);

  // Reload on focus
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const data = await loadOrders();
        data.sort((a, b) => (b.placedAt || '').localeCompare(a.placedAt || ''));
        if (active) setOrders(data);
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

  const data = useMemo(() => orders, [orders]);

  const clearHistory = () => {
    if (data.length === 0) return;
    Alert.alert('Clear Order History', 'Remove all saved orders on this device?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await saveOrders([]);
          setOrders([]);
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: OrderHistoryItem }) => {
    const date = new Date(item.placedAt);
    return (
      <View style={styles.card}>
        <Text style={styles.orderId} numberOfLines={1}>
          {item.id}
        </Text>
        <Text style={styles.meta}>
          Placed {isNaN(date.getTime()) ? item.placedAt : date.toLocaleString()}
        </Text>

        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#1f2937' }]}
            onPress={() => {
              // Could deep-link to an order detail screen later
              Alert.alert('Order', `Order ID:\n${item.id}`);
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>View</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#0f1012', borderColor: '#1f2937', borderWidth: 1 }]}
            onPress={async () => {
              await navigator.clipboard?.writeText?.(item.id);
              Alert.alert('Copied', 'Order ID copied to clipboard.');
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>Copy ID</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{ color: '#9ca3af' }}>Loading orders…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {data.length === 0 ? (
        <View style={[styles.center, { padding: 24 }]}>
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySubtitle}>
            Place an order to see it appear here.
          </Text>
          <TouchableOpacity
            style={styles.cta}
            onPress={() => navigation.navigate('Tabs', { screen: 'Inventory' })}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>Browse Inventory</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={data}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.footerBtn, { backgroundColor: '#1f2937' }]}
              onPress={() => navigation.navigate('Tabs', { screen: 'Home' })}
              activeOpacity={0.85}
            >
              <Text style={styles.footerBtnText}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.footerBtn, { backgroundColor: '#ef4444' }]}
              onPress={clearHistory}
              activeOpacity={0.85}
            >
              <Text style={styles.footerBtnText}>Clear History</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0c' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: { color: '#9ca3af', textAlign: 'center', marginBottom: 12 },
  cta: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  ctaText: { color: '#fff', fontWeight: '700' },

  card: {
    backgroundColor: '#111216',
    borderRadius: 16,
    padding: 14,
  },
  orderId: { color: '#fff', fontWeight: '800' },
  meta: { color: '#9ca3af', marginTop: 6 },

  row: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700' },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    backgroundColor: '#0b0b0c',
    padding: 12,
    paddingBottom: 20,
    flexDirection: 'row',
    gap: 10,
  },
  footerBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBtnText: { color: '#fff', fontWeight: '800' },
});

export default OrderHistoryScreen;
