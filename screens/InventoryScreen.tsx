import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useInventory, type InventoryItem } from '../contexts/InventoryContext';
import { useCart } from '../contexts/CartContext';
import { upsertItem as addToCollection } from '../services/collection';

export default function InventoryScreen() {
  const { items, isLoading, isHydrated, refresh } = useInventory();
  const { addItem } = useCart();

  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) =>
      [it.name, it.set, it.number, it.sku]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [items, query]);

  // <-- CHANGED: accept InventoryItem (price optional) and normalize internally
  const handleAdd = useCallback(
    (item: InventoryItem) => {
      // CartContext accepts missing price, but ensure quantity at least 1
      addItem(
        {
          ...item,
          quantity: Math.max(1, Number(item.quantity ?? 1)),
          // if price is missing, CartContext will treat as 0 in totals
        },
        1
      );
    },
    [addItem]
  );

  const handleAddToCollection = useCallback(async (item: InventoryItem) => {
    await addToCollection({
      ...item,
      quantity: Math.max(1, Number(item.quantity ?? 1)),
    });
  }, []);

  if (isLoading && !isHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0b0b0b', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0b0b0b' }}>
      <View style={{ padding: 16, gap: 12 }}>
        <Text style={{ color: 'white', fontSize: 22, fontWeight: '800' }}>Inventory</Text>
        <TextInput
          placeholder="Search name, set, number, sku…"
          placeholderTextColor="#888"
          value={query}
          onChangeText={setQuery}
          style={{
            borderWidth: 1,
            borderColor: '#333',
            color: 'white',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 10,
          }}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#1f2937' }} />}
        onRefresh={refresh}
        refreshing={false}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', paddingVertical: 12, gap: 12 }}>
            {item.imageUrl ? (
              <Image
                source={{ uri: String(item.imageUrl) }}
                resizeMode="cover"
                style={{ width: 64, height: 64, borderRadius: 8, backgroundColor: '#111827' }}
              />
            ) : (
              <View style={{ width: 64, height: 64, borderRadius: 8, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#6b7280', fontSize: 12 }}>No image</Text>
              </View>
            )}

            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ color: 'white', fontWeight: '700' }} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={{ color: '#9ca3af' }} numberOfLines={1}>
                {item.set ?? '—'} {item.number ? `#${item.number}` : ''}
              </Text>
              <Text style={{ color: '#9ca3af' }}>
                Qty: {item.quantity ?? 0} • Price:{' '}
                {typeof item.price === 'number' ? `$${item.price.toFixed(2)}` : '—'}
              </Text>

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                <Pressable
                  onPress={() => handleAdd(item)}
                  style={{ backgroundColor: '#0ea5e9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
                >
                  <Text style={{ color: 'white', fontWeight: '700' }}>Add to Cart</Text>
                </Pressable>

                <Pressable
                  onPress={() => handleAddToCollection(item)}
                  style={{ backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
                >
                  <Text style={{ color: 'white', fontWeight: '700' }}>Add to Collection</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ color: '#9ca3af' }}>No items match your search.</Text>
          </View>
        }
      />
    </View>
  );
}
