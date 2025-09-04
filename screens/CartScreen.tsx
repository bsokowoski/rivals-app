// screens/CartScreen.tsx
import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../contexts/CartContext';

const currency = (n: number) =>
  Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);

const CartScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { cart, total, updateQuantity, removeFromCart, clearCart, isHydrated } = useCart();

  const itemCount = useMemo(
    () => cart.reduce((sum, i) => sum + i.quantity, 0),
    [cart]
  );

  const handleDecrease = (id: string, qty: number) => {
    if (qty <= 1) {
      // Confirm removal at qty 1 when decreasing
      Alert.alert('Remove item?', 'Quantity is 1. Remove this item from cart?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeFromCart(id) },
      ]);
    } else {
      updateQuantity(id, qty - 1);
    }
  };

  const handleIncrease = (id: string, qty: number) => {
    updateQuantity(id, qty + 1);
  };

  const handleRemove = (id: string) => {
    removeFromCart(id);
  };

  const confirmClear = () => {
    if (cart.length === 0) return;
    Alert.alert('Clear cart?', 'This will remove all items from your cart.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearCart },
    ]);
  };

  const goToCheckout = () => {
    if (cart.length === 0) return;
    navigation.navigate('Checkout');
  };

  // Hydration/loading
  if (!isHydrated) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.muted}>Loading your cart…</Text>
      </View>
    );
  }

  // Empty state
  if (cart.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Your cart is empty</Text>
        <Text style={styles.muted}>Add some items and they’ll show up here.</Text>
        <TouchableOpacity
          style={[styles.button, styles.primary]}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.buttonText}>Browse Products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Cart ({itemCount})</Text>
        <TouchableOpacity onPress={confirmClear}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={cart}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]}>
                <Text style={styles.thumbInitial}>{item.name?.[0]?.toUpperCase() ?? '?'}</Text>
              </View>
            )}

            <View style={styles.itemInfo}>
              <Text numberOfLines={1} style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>{currency(item.price)}</Text>

              <View style={styles.qtyRow}>
                <TouchableOpacity
                  style={[styles.qtyBtn, styles.pill]}
                  onPress={() => handleDecrease(item.id, item.quantity)}
                >
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>

                <Text style={styles.qtyLabel}>{item.quantity}</Text>

                <TouchableOpacity
                  style={[styles.qtyBtn, styles.pill]}
                  onPress={() => handleIncrease(item.id, item.quantity)}
                >
                  <Text style={styles.qtyBtnText}>＋</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(item.id)}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.lineTotalWrap}>
              <Text style={styles.lineTotal}>{currency(item.price * item.quantity)}</Text>
            </View>
          </View>
        )}
      />

      {/* Footer / Summary */}
      <View style={styles.footer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{currency(total)}</Text>
        </View>
        {/* If you introduce taxes/shipping, add rows here */}

        <TouchableOpacity
          style={[styles.button, styles.primary, styles.checkoutBtn]}
          onPress={goToCheckout}
        >
          <Text style={styles.buttonText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CartScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B0B' },
  center: {
    flex: 1,
    backgroundColor: '#0B0B0B',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  muted: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', marginTop: 8 },
  headerRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1F2937',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0B0B0B',
  },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  clearText: { color: '#EF4444', fontWeight: '600' },

  itemRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' },
  thumb: { width: 64, height: 64, borderRadius: 12, backgroundColor: '#111827' },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  thumbInitial: { color: '#9CA3AF', fontSize: 18, fontWeight: '700' },

  itemInfo: { flex: 1, marginLeft: 12 },
  itemName: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  itemPrice: { color: '#9CA3AF', marginTop: 2 },

  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  qtyBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  pill: { borderRadius: 16 },
  qtyBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  qtyLabel: { color: '#FFFFFF', fontSize: 16, marginHorizontal: 12, minWidth: 20, textAlign: 'center' },
  removeBtn: { marginLeft: 12 },
  removeText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },

  lineTotalWrap: { marginLeft: 8, alignItems: 'flex-end' },
  lineTotal: { color: '#FFFFFF', fontWeight: '700' },

  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#1F2937', marginHorizontal: 16 },

  footer: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    backgroundColor: '#0B0B0B',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#1F2937',
    padding: 16,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { color: '#9CA3AF', fontSize: 14 },
  summaryValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: '#E11D48' }, // Rivals red
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  checkoutBtn: { marginTop: 4 },
});
