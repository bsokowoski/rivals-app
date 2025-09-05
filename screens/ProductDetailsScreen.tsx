import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import { useInventory, type InventoryItem } from '../contexts/InventoryContext';
import { getCollection, upsertItem } from '../services/collection';

type ProductDetailsRoute = RouteProp<RootStackParamList, 'ProductDetails'>;

export default function ProductDetailsScreen() {
  const route = useRoute<ProductDetailsRoute>();
  const paramId = route.params?.id;

  const { items, isHydrated, isLoading } = useInventory();
  const [qty, setQty] = useState<number>(1);
  const [saving, setSaving] = useState(false);

  // If caller passed a whole item (optional), prefer that; else find by id
  const paramItem = (route.params as any)?.item as InventoryItem | undefined;

  const item: InventoryItem | undefined = useMemo(() => {
    if (paramItem) return paramItem;
    if (!paramId) return undefined;
    return items.find((i) => i.id === String(paramId));
  }, [items, paramItem, paramId]);

  const inc = () => setQty((n) => Math.min(999, n + 1));
  const dec = () => setQty((n) => Math.max(1, n - 1));

  const addToCollection = async () => {
    if (!item) return;
    try {
      setSaving(true);
      const current = await getCollection();
      const existing = current.find((i) => i.id === item.id);
      const existingQty = Number(existing?.quantity ?? 0);
      const nextQty = existingQty + qty;

      // Persist merged quantity
      await upsertItem({
        ...item,
        quantity: nextQty,
      });

      Alert.alert(
        'Added to Collection',
        `${item.name} • +${qty} (now ${nextQty})`
      );
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to save to collection.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading && !isHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0b0b0b', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0b0b0b', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
          Item not found
        </Text>
        <Text style={{ color: '#9ca3af', marginTop: 8, textAlign: 'center' }}>
          Try opening this page from Inventory again.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0b0b0b' }} contentContainerStyle={{ padding: 16, gap: 16 }}>
      {/* Image */}
      {item.imageUrl ? (
        <Image
          source={{ uri: String(item.imageUrl) }}
          resizeMode="contain"
          style={{ width: '100%', height: 260, backgroundColor: '#111827', borderRadius: 12 }}
        />
      ) : (
        <View style={{ width: '100%', height: 180, backgroundColor: '#111827', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#6b7280' }}>No image</Text>
        </View>
      )}

      {/* Title + meta */}
      <View style={{ gap: 6 }}>
        <Text style={{ color: 'white', fontSize: 22, fontWeight: '800' }}>{item.name}</Text>
        <Text style={{ color: '#9ca3af' }}>
          {item.set ?? '—'} {item.number ? `#${item.number}` : ''}
          {item.rarity ? ` • ${item.rarity}` : ''}
          {item.condition ? ` • ${item.condition}` : ''}
        </Text>
        <Text style={{ color: '#9ca3af' }}>
          SKU: {item.sku}
        </Text>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '700', marginTop: 6 }}>
          {typeof item.price === 'number' ? `$${item.price.toFixed(2)}` : '—'}
        </Text>
      </View>

      {/* Quantity selector */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable
          onPress={dec}
          style={{ backgroundColor: '#1f2937', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }}
        >
          <Text style={{ color: 'white', fontWeight: '800' }}>−</Text>
        </Pressable>
        <Text style={{ color: 'white', fontWeight: '800', minWidth: 24, textAlign: 'center' }}>{qty}</Text>
        <Pressable
          onPress={inc}
          style={{ backgroundColor: '#1f2937', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }}
        >
          <Text style={{ color: 'white', fontWeight: '800' }}>＋</Text>
        </Pressable>
      </View>

      {/* Actions */}
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
        <Pressable
          onPress={addToCollection}
          disabled={saving}
          style={{
            backgroundColor: saving ? '#6b7280' : '#10b981',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '800' }}>
            {saving ? 'Saving…' : 'Add to Collection'}
          </Text>
        </Pressable>

        {/* Placeholder for future: Add to Cart (can wire CartContext later)
        <Pressable
          onPress={addToCart}
          style={{ backgroundColor: '#0ea5e9', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 }}
        >
          <Text style={{ color: 'white', fontWeight: '800' }}>Add to Cart</Text>
        </Pressable>
        */}
      </View>

      {/* Description dump (optional custom fields) */}
      <View style={{ marginTop: 8, gap: 4 }}>
        {Object.entries(item)
          .filter(([k]) => !['id', 'sku', 'name', 'set', 'number', 'rarity', 'condition', 'price', 'quantity', 'imageUrl'].includes(k))
          .slice(0, 6)
          .map(([k, v]) => (
            <Text key={k} style={{ color: '#9ca3af' }}>
              {k}: {String(v)}
            </Text>
          ))}
      </View>
    </ScrollView>
  );
}
