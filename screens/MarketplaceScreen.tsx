import React from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useInventory, type InventoryItem } from '../contexts/InventoryContext';
import { useCart } from '../contexts/CartContext';

export default function MarketplaceScreen() {
  const { items } = useInventory();
  const { addItem } = useCart(); // was addToCart

  const onAddToCart = (it: InventoryItem) => {
    addItem({ ...it, quantity: Math.max(1, Number(it.quantity ?? 1)) }, 1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0b0b0b' }}>
      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => (
          <View style={{ padding: 12, borderBottomWidth: 1, borderColor: '#1f2937' }}>
            <Text style={{ color: 'white', fontWeight: '700' }}>{item.name}</Text>
            <Text style={{ color: '#9ca3af' }}>
              {item.set ?? '—'} {item.number ? `#${item.number}` : ''} •{' '}
              {typeof item.price === 'number' ? `$${item.price.toFixed(2)}` : '—'}
            </Text>
            <Pressable
              onPress={() => onAddToCart(item)}
              style={{ backgroundColor: '#0ea5e9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginTop: 8 }}
            >
              <Text style={{ color: 'white', fontWeight: '700' }}>Add to Cart</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}
