// screens/OrderConfirmationScreen.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useCart } from '../contexts/CartContext';
import { useInventory } from '../contexts/InventoryContext';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderConfirmation'>;

export default function OrderConfirmationScreen({ route }: Props) {
  const { orderId } = route.params ?? {};
  const { items: cartItems, clearCart } = useCart();
  const { fulfillPurchase } = useInventory();
  const processedRef = useRef(false);

  useEffect(() => {
    // ensure we only run once per visit
    if (processedRef.current) return;
    processedRef.current = true;

    try {
      // Decrement inventory and auto-remove 0-qty items
      fulfillPurchase(
        (cartItems ?? []).map((c: any) => ({
          productId: c.productId ?? c.id ?? c.inventoryId, // flexible mapping
          quantity: Number(c.quantity ?? 1),
        }))
      );
    } catch {
      // no-op: avoid crashing the confirmation screen
    } finally {
      // Clear cart after fulfillment
      try {
        clearCart();
      } catch {}
    }
  }, [cartItems, clearCart, fulfillPurchase]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order Confirmed 🎉</Text>
      {orderId ? (
        <Text style={styles.subtitle}>Order ID: {orderId}</Text>
      ) : (
        <Text style={styles.subtitle}>Thank you for your purchase!</Text>
      )}
      <Text style={styles.body}>
        A confirmation has been sent to your email. Your items will ship soon.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  body: { fontSize: 14, color: '#374151', textAlign: 'center' },
});
