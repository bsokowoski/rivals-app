// screens/ProductDetailsScreen.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { useCart } from '../contexts/CartContext';

// If you have centralized types for navigation, you can import RootStackParamList.
// For now we define a minimal local type to keep this screen drop-in ready.
type Product = {
  id: string;
  name: string;
  price: number;
  image?: string;
  // add any extra fields you need (set, rarity, condition, etc.)
};

type LocalStackParams = {
  ProductDetails: { product: Product };
};

const currency = (n: number) =>
  Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);

const ProductDetailsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<LocalStackParams, 'ProductDetails'>>();
  const { product } = route.params || {};

  const { addToCart, isHydrated } = useCart();

  const [qty, setQty] = useState(1);

  const price = useMemo(() => product?.price ?? 0, [product]);
  const lineTotal = useMemo(() => price * qty, [price, qty]);

  const handleDecrease = () => setQty((q) => Math.max(1, q - 1));
  const handleIncrease = () => setQty((q) => q + 1);

  const handleAdd = () => {
    if (!isHydrated || !product) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: qty,
    });
    Alert.alert('Added to cart', `${product.name} ×${qty} added.`);
  };

  if (!product) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Product not found</Text>
        <Text style={styles.muted}>Try returning to inventory.</Text>
        <TouchableOpacity style={[styles.button, styles.primary]} onPress={() => navigation.navigate('Inventory')}>
          <Text style={styles.buttonText}>Back to Inventory</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isHydrated) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Hero image */}
        {product.image ? (
          <Image source={{ uri: product.image }} style={styles.hero} />
        ) : (
          <View style={[styles.hero, styles.heroPlaceholder]}>
            <Text style={styles.heroInitial}>{product.name?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
        )}

        {/* Meta */}
        <View style={styles.content}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>{currency(product.price)}</Text>

          {/* You can add set/rarity/condition rows here */}
          {/* <View style={styles.metaRow}><Text style={styles.metaLabel}>Set</Text><Text style={styles.metaValue}>Scarlet & Violet</Text></View> */}

          {/* Quantity selector */}
          <View style={styles.qtyWrap}>
            <Text style={styles.qtyLabel}>Quantity</Text>
            <View style={styles.qtyRow}>
              <TouchableOpacity style={[styles.qtyBtn, styles.pill]} onPress={handleDecrease}>
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{qty}</Text>
              <TouchableOpacity style={[styles.qtyBtn, styles.pill]} onPress={handleIncrease}>
                <Text style={styles.qtyBtnText}>＋</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Line total */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryValue}>{currency(lineTotal)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky footer actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.secondary]}
          onPress={() => navigation.navigate('Cart')}
        >
          <Text style={styles.buttonText}>View Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.primary]}
          onPress={handleAdd}
          disabled={!isHydrated}
        >
          <Text style={styles.buttonText}>{isHydrated ? 'Add to Cart' : 'Loading…'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ProductDetailsScreen;

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

  hero: { width: '100%', height: 300, backgroundColor: '#111827' },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  heroInitial: { color: '#9CA3AF', fontSize: 28, fontWeight: '800' },

  content: { padding: 16 },
  name: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  price: { color: '#E5E7EB', fontSize: 18, marginTop: 6 },

  metaRow: {
    marginTop: 10,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#1F2937',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: { color: '#9CA3AF' },
  metaValue: { color: '#FFFFFF' },

  qtyWrap: { marginTop: 16 },
  qtyLabel: { color: '#9CA3AF', marginBottom: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#111827',
    borderWidth: 1, borderColor: '#1F2937',
  },
  pill: { borderRadius: 18 },
  qtyBtnText: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  qtyValue: { color: '#FFFFFF', fontSize: 16, marginHorizontal: 14, minWidth: 24, textAlign: 'center' },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#1F2937',
    marginTop: 16,
  },
  summaryLabel: { color: '#9CA3AF', fontSize: 14 },
  summaryValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },

  footer: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    backgroundColor: '#0B0B0B',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#1F2937',
    padding: 12,
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: '#E11D48' }, // Rivals red
  secondary: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#1F2937' },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});
