// File: screens/CartScreen.tsx
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../contexts/CartContext';

type RawCartItem = {
  id?: string | number;
  name?: string;
  price?: number;        // dollars
  priceCents?: number;   // cents
  image?: string;
  imageUrl?: string;
  quantity?: number;
  qty?: number;
};

type CartItem = {
  id: string;
  name: string;
  priceCents: number;
  imageUrl?: string;
  qty: number;
};

const toCents = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
};

const normalize = (it: RawCartItem): CartItem => ({
  id: String(it.id ?? ''),
  name: it.name ?? 'Item',
  priceCents:
    typeof it.priceCents === 'number'
      ? Math.max(0, Math.round(it.priceCents))
      : toCents(it.price),
  imageUrl: it.imageUrl ?? it.image ?? undefined,
  qty: Math.max(1, Number(it.qty ?? it.quantity ?? 1)),
});

const money = (cents: number) =>
  `$${(Math.max(0, Math.round(cents)) / 100).toFixed(2)}`;

export default function CartScreen() {
  const navigation = useNavigation<any>();

  // ✅ Safely consume cart context (no crash if provider not mounted)
  let cart: {
    items?: RawCartItem[];
    removeItem?: (id: string) => void;
    clearCart?: () => void;
  } = {};
  try {
    cart = (useCart?.() as any) ?? {};
  } catch {
    cart = {};
  }

  const data: CartItem[] = useMemo(() => {
    const arr = Array.isArray(cart.items) ? cart.items : [];
    return arr.map(normalize).filter((x) => x.id);
  }, [cart.items]);

  const { subtotalCents, itemCount } = useMemo(() => {
    let subtotal = 0;
    let count = 0;
    for (const it of data) {
      subtotal += it.priceCents * it.qty;
      count += it.qty;
    }
    return { subtotalCents: subtotal, itemCount: count };
  }, [data]);

  const onRemove = (id: string) => {
    if (typeof cart.removeItem === 'function') {
      cart.removeItem(id);
    } else {
      Alert.alert('Not available in this beta', 'Removing items will be enabled soon.');
    }
  };

  const onClear = () => {
    if (typeof cart.clearCart === 'function') {
      cart.clearCart();
    } else {
      Alert.alert('Not available in this beta', 'Clearing the cart is not enabled.');
    }
  };

  const proceedToCheckout = () => {
    try {
      navigation.navigate('Checkout');
    } catch {
      Alert.alert('Navigation error', 'Checkout screen is not available in this build.');
    }
  };

  if (data.length === 0) {
    return (
      <View style={s.empty}>
        <Text style={s.title}>Your Cart</Text>
        <Text style={s.muted}>Your cart is empty.</Text>
        <TouchableOpacity
          style={[s.btn, s.primary]}
          onPress={() => navigation.navigate('Tabs', { screen: 'Inventory' })}
          activeOpacity={0.85}
        >
          <Text style={s.btnText}>Browse Inventory</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <FlatList
        data={data}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 160 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <View style={s.row}>
            <Image
              source={{
                uri:
                  item.imageUrl ||
                  'https://ui-avatars.com/api/?name=Card&background=0f1012&color=fff',
              }}
              style={s.thumb}
            />
            <View style={{ flex: 1 }}>
              <Text style={s.name} numberOfLines={2}>{item.name}</Text>
              <Text style={s.meta}>
                Qty {item.qty} · {money(item.priceCents)} each
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.lineTotal}>{money(item.priceCents * item.qty)}</Text>
              <TouchableOpacity style={[s.smallBtn, s.ghost]} onPress={() => onRemove(item.id)}>
                <Text style={s.smallBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Sticky footer */}
      <View style={s.footer}>
        <View style={s.summaryRow}>
          <Text style={s.summaryLabel}>Items</Text>
          <Text style={s.summaryValue}>{itemCount}</Text>
        </View>
        <View style={s.summaryRow}>
          <Text style={s.summaryLabel}>Subtotal</Text>
          <Text style={s.summaryValue}>{money(subtotalCents)}</Text>
        </View>

        <View style={s.footerActions}>
          <TouchableOpacity style={[s.footerBtn, s.ghost]} onPress={onClear}>
            <Text style={s.btnText}>Clear Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.footerBtn, s.primary]} onPress={proceedToCheckout}>
            <Text style={s.btnText}>Proceed to Checkout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B0B' },
  empty: {
    flex: 1,
    backgroundColor: '#0B0B0B',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 8 },
  muted: { color: '#9CA3AF', fontSize: 14, marginBottom: 16, textAlign: 'center' },

  row: {
    backgroundColor: '#111216',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#0f1012',
  },
  name: { color: '#fff', fontWeight: '700' },
  meta: { color: '#9ca3af', marginTop: 4, fontSize: 12 },
  lineTotal: { color: '#fff', fontWeight: '800', marginBottom: 8 },

  smallBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  ghost: { backgroundColor: '#1f2937' },
  primary: { backgroundColor: '#ef4444' },

  btn: {
    backgroundColor: '#1f2937',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
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
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: { color: '#9ca3af' },
  summaryValue: { color: '#9ca3af', fontWeight: '700' },

  footerActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  footerBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
