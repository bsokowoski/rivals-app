import React, { useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useCart } from '../contexts/CartContext';
import { useInventory } from '../contexts/InventoryContext';

type RouteT = RouteProp<RootStackParamList, 'OrderConfirmation'>;
type NavT = NativeStackNavigationProp<RootStackParamList>;

export default function OrderConfirmationScreen() {
  const navigation = useNavigation<NavT>();
  const route = useRoute<RouteT>();
  const orderId = route.params?.orderId;

  const { items: cartItems, clearCart, subtotal } = useCart();
  const { fulfillPurchase } = useInventory();

  const lines = useMemo(
    () => cartItems.map((c) => ({ id: c.id, quantity: c.quantity })),
    [cartItems]
  );

  const onFinish = async () => {
    // Decrement inventory quantities locally, then clear the cart
    await fulfillPurchase(lines);
    clearCart();
    navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0b0b0b', padding: 16, gap: 16, justifyContent: 'center' }}>
      <Text style={{ color: 'white', fontSize: 24, fontWeight: '800', textAlign: 'center' }}>
        Thank you!
      </Text>
      {orderId ? (
        <Text style={{ color: '#9ca3af', textAlign: 'center' }}>Order #{orderId}</Text>
      ) : null}

      <View style={{ backgroundColor: '#111827', padding: 16, borderRadius: 12, gap: 6 }}>
        <Text style={{ color: '#9ca3af' }}>
          Items: {cartItems.length} • Subtotal: ${subtotal.toFixed(2)}
        </Text>
        <Text style={{ color: '#6b7280' }}>
          Your items will be marked as fulfilled in inventory.
        </Text>
      </View>

      <Pressable
        onPress={onFinish}
        style={{ backgroundColor: '#10b981', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}
      >
        <Text style={{ color: 'white', fontWeight: '800' }}>Done</Text>
      </Pressable>
    </View>
  );
}
