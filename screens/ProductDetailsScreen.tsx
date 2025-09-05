import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useInventory, type InventoryItem } from '../contexts/InventoryContext';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

type RouteT = RouteProp<RootStackParamList, 'ProductDetails'>;
type NavT = NativeStackNavigationProp<RootStackParamList>;

function formatMoney(n?: number): string {
  return typeof n === 'number' ? `$${n.toFixed(2)}` : '—';
}

export default function ProductDetailsScreen() {
  const route = useRoute<RouteT>();
  const navigation = useNavigation<NavT>();
  const { user } = useAuth();
  const isSeller =
    Boolean(user?.isSeller) || String(user?.role ?? '').toLowerCase() === 'seller';

  const { items, isLoading, isHydrated } = useInventory();
  const { addItem } = useCart();

  const product: InventoryItem | undefined = useMemo(() => {
    const id = route.params?.id;
    if (!id) return undefined;
    return items.find((i) => String(i.id) === String(id));
  }, [items, route.params]);

  const [qty, setQty] = useState(1);

  if (isLoading && !isHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0b0b0b', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0b0b0b', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>
          Product not found
        </Text>
        <Text style={{ color: '#9ca3af', textAlign: 'center' }}>
          We couldn’t find that product. It may have been removed or the link is invalid.
        </Text>
      </View>
    );
  }

  const displayPrice =
    typeof product.forSalePrice === 'number'
      ? product.forSalePrice
      : typeof product.price === 'number'
      ? product.price
      : typeof product.marketPrice === 'number'
      ? product.marketPrice
      : undefined;

  const onAddToCart = () => {
    addItem(
      {
        ...product,
        quantity: Math.max(1, Number(qty || 1)),
      },
      Math.max(1, Number(qty || 1))
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0b0b0b' }}
      contentContainerStyle={{ padding: 16, gap: 16 }}
    >
      {/* Image */}
      {product.imageUrl ? (
        <Image
          source={{ uri: String(product.imageUrl) }}
          resizeMode="cover"
          style={{
            width: '100%',
            height: 240,
            borderRadius: 12,
            backgroundColor: '#111827',
          }}
        />
      ) : (
        <View
          style={{
            width: '100%',
            height: 180,
            borderRadius: 12,
            backgroundColor: '#111827',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#6b7280' }}>No image</Text>
        </View>
      )}

      {/* Title / meta */}
      <View style={{ gap: 6 }}>
        <Text style={{ color: 'white', fontSize: 22, fontWeight: '800' }} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={{ color: '#9ca3af' }}>
          {product.set ?? '—'} {product.number ? `#${product.number}` : ''}
        </Text>

        <Text style={{ color: 'white', fontSize: 18, fontWeight: '700', marginTop: 6 }}>
          {formatMoney(displayPrice)}
        </Text>

        <Text style={{ color: '#9ca3af', marginTop: 2 }}>
          {product.rarity ? `Rarity: ${product.rarity}` : ''}
          {product.rarity && product.condition ? ' • ' : ''}
          {product.condition ? `Condition: ${product.condition}` : ''}
        </Text>

        <Text style={{ color: '#9ca3af' }}>
          In stock: {Number(product.quantity ?? 0)}
        </Text>

        {(typeof product.marketPrice === 'number' || typeof product.costPrice === 'number') && (
          <Text style={{ color: '#6b7280', marginTop: 2 }}>
            {typeof product.marketPrice === 'number'
              ? `Market: ${formatMoney(product.marketPrice)}`
              : ''}
            {typeof product.marketPrice === 'number' && typeof product.costPrice === 'number' ? ' • ' : ''}
            {typeof product.costPrice === 'number' ? `Cost: ${formatMoney(product.costPrice)}` : ''}
          </Text>
        )}

        <Text style={{ color: '#6b7280', marginTop: 2 }}>SKU: {product.sku}</Text>
      </View>

      {/* Quantity + actions */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#111827',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <Pressable
            onPress={() => setQty((q) => Math.max(1, q - 1))}
            style={{ paddingHorizontal: 14, paddingVertical: 10 }}
          >
            <Text style={{ color: 'white', fontWeight: '800' }}>−</Text>
          </Pressable>
          <Text style={{ color: 'white', fontWeight: '700', paddingHorizontal: 10 }}>
            {qty}
          </Text>
          <Pressable
            onPress={() => setQty((q) => Math.max(1, q + 1))}
            style={{ paddingHorizontal: 14, paddingVertical: 10 }}
          >
            <Text style={{ color: 'white', fontWeight: '800' }}>+</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={onAddToCart}
          style={{
            backgroundColor: '#0ea5e9',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: 'white', fontWeight: '800' }}>Add to Cart</Text>
        </Pressable>

        {isSeller && (
          <Pressable
            onPress={() => navigation.navigate('EditProduct', { productId: product.id })}
            style={{
              backgroundColor: '#374151',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: 'white', fontWeight: '800' }}>Edit</Text>
          </Pressable>
        )}
      </View>

      {/* Extra info (if CSV carried extra fields) */}
      {Object.entries(product).some(
        ([k]) =>
          ![
            'id',
            'sku',
            'name',
            'set',
            'number',
            'rarity',
            'condition',
            'imageUrl',
            'quantity',
            'price',
            'forSalePrice',
            'marketPrice',
            'costPrice',
          ].includes(k)
      ) && (
        <View style={{ backgroundColor: '#111827', padding: 12, borderRadius: 12, marginTop: 4 }}>
          <Text style={{ color: 'white', fontWeight: '700', marginBottom: 6 }}>
            Additional Details
          </Text>
          {Object.entries(product).map(([key, val]) => {
            if (
              [
                'id',
                'sku',
                'name',
                'set',
                'number',
                'rarity',
                'condition',
                'imageUrl',
                'quantity',
                'price',
                'forSalePrice',
                'marketPrice',
                'costPrice',
              ].includes(key)
            ) {
              return null;
            }
            const display =
              typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
            if (!display || display === 'undefined' || display === 'null') return null;
            return (
              <View key={key} style={{ flexDirection: 'row', marginBottom: 4 }}>
                <Text style={{ color: '#9ca3af', width: 120 }}>{key}</Text>
                <Text style={{ color: '#e5e7eb', flex: 1 }}>{display}</Text>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
