import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import type { InventoryItem } from '../contexts/InventoryContext';
import {
  getCollection,
  removeItem,
  clearCollection,
} from '../services/collection';

export default function CollectionScreen() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getCollection();
      setItems(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const count = items.length;
    const qtyTotal = items.reduce((sum, i) => sum + Number(i.quantity ?? 0), 0);
    const totalValue = items.reduce((sum, i) => {
      const price = typeof i.price === 'number' ? i.price : 0;
      const qty = Number(i.quantity ?? 1);
      return sum + price * qty;
    }, 0);
    return { count, qtyTotal, totalValue };
  }, [items]);

  const onRemove = async (id: string) => {
    await removeItem(id);
    await load();
  };

  const onClear = async () => {
    Alert.alert('Clear collection?', 'This will remove all saved items.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await clearCollection();
          await load();
        },
      },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0b0b0b', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0b0b0b' }}>
      <View style={{ padding: 16, gap: 8 }}>
        <Text style={{ color: 'white', fontSize: 22, fontWeight: '800' }}>My Collection</Text>
        <Text style={{ color: '#9ca3af' }}>
          Items: {stats.count} • Total Qty: {stats.qtyTotal} • Est. Value: ${stats.totalValue.toFixed(2)}
        </Text>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            onPress={onRefresh}
            style={{ backgroundColor: '#374151', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 }}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>Refresh</Text>
          </Pressable>
          <Pressable
            onPress={onClear}
            style={{ backgroundColor: '#ef4444', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 }}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>Clear All</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        refreshControl={
          <RefreshControl tintColor="#fff" refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#1f2937' }} />}
        renderItem={({ item }) => (
          <View style={{ paddingVertical: 12 }}>
            <Text style={{ color: 'white', fontWeight: '700' }}>{item.name}</Text>
            <Text style={{ color: '#9ca3af' }}>
              {item.set ?? '—'} {item.number ? `#${item.number}` : ''}
            </Text>
            <Text style={{ color: '#9ca3af' }}>
              Qty: {item.quantity ?? 0} • Price: {typeof item.price === 'number' ? `$${item.price.toFixed(2)}` : '—'}
            </Text>

            <View style={{ marginTop: 8, flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={() => onRemove(item.id)}
                style={{ backgroundColor: '#6b7280', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
              >
                <Text style={{ color: 'white', fontWeight: '700' }}>Remove</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', padding: 24 }}>
            <Text style={{ color: '#9ca3af' }}>
              Your collection is empty. Add items from Inventory or Product Details.
            </Text>
          </View>
        }
      />
    </View>
  );
}
