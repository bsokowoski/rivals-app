// File: screens/CheckoutScreen.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStripe } from '@stripe/stripe-react-native';
import { useCart } from '../contexts/CartContext';

type RawCartItem = {
  id?: string | number;
  name?: string;
  price?: number;          // dollars
  priceCents?: number;     // cents
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

// Demo estimates (server should compute real totals)
const SHIPPING_CENTS = 499; // $4.99 demo
const TAX_RATE = 0.0725;    // 7.25% demo

// Backend for PaymentSheet. Override with EXPO_PUBLIC_BACKEND_URL if you have one.
const API_BASE =
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  'https://effective-funicular-q5grxpr796434w75-4242.app.github.dev';

// --- helpers ---
const toCents = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
};

const normalizeItem = (it: RawCartItem): CartItem => {
  const id = String(it.id ?? '');
  const name = it.name ?? 'Item';
  const priceCents =
    typeof it.priceCents === 'number'
      ? Math.max(0, Math.round(it.priceCents))
      : toCents(it.price);
  const qty = Math.max(1, Number(it.qty ?? it.quantity ?? 1));
  const imageUrl = it.imageUrl ?? it.image ?? undefined;
  return { id, name, priceCents, imageUrl, qty };
};

const money = (cents: number) =>
  `$${(Math.max(0, Math.round(cents)) / 100).toFixed(2)}`;

const nowId = () =>
  'ORD-' +
  Math.random().toString(36).slice(2, 6).toUpperCase() +
  '-' +
  Date.now().toString().slice(-5);

// --- component ---
const CheckoutScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const cart = (typeof useCart === 'function' ? useCart?.() : {}) as {
    items?: RawCartItem[];
    clearCart?: () => void;
  };

  const data: CartItem[] = Array.isArray(cart?.items)
    ? (cart!.items as RawCartItem[]).map(normalizeItem)
    : [];

  const { subtotalCents, itemCount } = useMemo(() => {
    let subtotal = 0;
    let count = 0;
    for (const it of data) {
      subtotal += it.qty * it.priceCents;
      count += it.qty;
    }
    return { subtotalCents: subtotal, itemCount: count };
  }, [data]);

  const taxCents = useMemo(
    () => Math.round(subtotalCents * TAX_RATE),
    [subtotalCents]
  );
  const totalCentsEstimate = useMemo(
    () => subtotalCents + (itemCount > 0 ? SHIPPING_CENTS : 0) + taxCents,
    [subtotalCents, taxCents, itemCount]
  );

  const [loadingSheet, setLoadingSheet] = useState(false);
  const [placing, setPlacing] = useState(false);

  const goToConfirmation = (orderId: string) => {
    // If you have an OrderConfirmation route, use it; otherwise, show a toast and go to Cart.
    try {
      navigation.replace('OrderConfirmation', { orderId });
    } catch {
      Alert.alert('Order placed', `Order ${orderId} confirmed (preview).`);
      navigation.navigate('Tabs', { screen: 'Cart' });
    }
  };

  const beginStripeFlow = async () => {
    if (data.length === 0) {
      Alert.alert('Cart is empty', 'Add some items before checking out.');
      return;
    }

    // Try Stripe backend; if unreachable, fall back to preview flow.
    let orderId = nowId();

    try {
      setLoadingSheet(true);

      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${API_BASE}/api/payments/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          items: data.map((it) => ({ id: it.id, qty: it.qty })),
          clientSubtotalCents: subtotalCents,
          clientTaxCents: taxCents,
          clientShippingCents: itemCount > 0 ? SHIPPING_CENTS : 0,
        }),
      });

      clearTimeout(t);

      if (!res.ok) {
        throw new Error(
          (await res.text().catch(() => 'Server error')) || 'Server error'
        );
      }

      const {
        paymentIntentClientSecret,
        customerId,
        customerEphemeralKeySecret,
        orderId: maybeOrder,
        merchantDisplayName = 'Rivals',
      } = (await res.json()) as {
        paymentIntentClientSecret: string;
        customerId?: string;
        customerEphemeralKeySecret?: string;
        orderId?: string;
        merchantDisplayName?: string;
      };

      orderId = maybeOrder || orderId;

      const init = await initPaymentSheet({
        merchantDisplayName,
        customerId,
        customerEphemeralKeySecret,
        paymentIntentClientSecret,
        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: { address: { country: 'US' } },
      });

      if (init.error) throw new Error(init.error.message);

      setLoadingSheet(false);

      setPlacing(true);
      const present = await presentPaymentSheet();

      if (present.error) {
        setPlacing(false);
        if ((present.error as any)?.code === 'Canceled') return;
        Alert.alert('Payment Error', present.error.message || 'Payment failed.');
        return;
      }

      // Success
      setPlacing(false);
      cart.clearCart?.();
      goToConfirmation(orderId);
    } catch (e: any) {
      // Fallback preview mode (most common cause: device cannot reach Codespaces URL)
      setLoadingSheet(false);
      setPlacing(false);
      Alert.alert(
        'Checkout (preview)',
        'Could not reach payment server. Completing a simulated order for testing.'
      );
      cart.clearCart?.();
      goToConfirmation(orderId);
    }
  };

  return (
    <View style={styles.container}>
      {data.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nothing to checkout</Text>
          <Text style={styles.emptySubtitle}>Your cart is currently empty.</Text>
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
            contentContainerStyle={{ padding: 16, paddingBottom: 160 }}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Image
                  source={{
                    uri:
                      item.imageUrl ||
                      'https://ui-avatars.com/api/?name=Card&background=0f1012&color=fff',
                  }}
                  style={styles.thumb}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.meta}>
                    Qty {item.qty} · {money(item.priceCents)} each
                  </Text>
                </View>
                <Text style={styles.lineTotal}>
                  {money(item.priceCents * item.qty)}
                </Text>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          />

          {/* Sticky summary */}
          <View style={styles.footer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{money(subtotalCents)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>
                {itemCount > 0 ? money(SHIPPING_CENTS) : '$0.00'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax (est.)</Text>
              <Text style={styles.summaryValue}>{money(taxCents)}</Text>
            </View>
            <View style={[styles.summaryRow, { marginTop: 6 }]}>
              <Text
                style={[styles.summaryLabel, { color: '#fff', fontWeight: '800' }]}
              >
                Total (est.)
              </Text>
              <Text
                style={[styles.summaryValue, { color: '#fff', fontWeight: '800' }]}
              >
                {money(totalCentsEstimate)}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.placeBtn,
                { backgroundColor: placing || loadingSheet ? '#1f2937' : '#ef4444' },
              ]}
              onPress={beginStripeFlow}
              disabled={placing || loadingSheet}
              activeOpacity={0.9}
            >
              {placing || loadingSheet ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator />
                  <Text style={styles.placeBtnText}>
                    {loadingSheet ? 'Preparing…' : 'Processing…'}
                  </Text>
                </View>
              ) : (
                <Text style={styles.placeBtnText}>Pay with Card</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0c' },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  cta: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  ctaText: { color: '#fff', fontWeight: '700' },

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
  lineTotal: { color: '#fff', fontWeight: '800' },

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
    marginBottom: 4,
  },
  summaryLabel: { color: '#9ca3af' },
  summaryValue: { color: '#9ca3af', fontWeight: '700' },

  placeBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});

export default CheckoutScreen;
