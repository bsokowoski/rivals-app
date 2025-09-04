// screens/InventoryScreen.tsx
import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../contexts/CartContext';

// Replace this with your real inventory source if you have one
type Product = {
  id: string;
  name: string;
  price: number;
  image?: string;
  // add any extra fields you need (set, rarity, etc.)
};

// Temporary showcase items (safe defaults). Swap for your real data source.
const PRODUCTS: Product[] = [
  {
    id: 'pkm-0001',
    name: 'Charizard ex – Holo',
    price: 24.99,
    image: 'https://images.pokemontcg.io/sv3/125_hires.png',
  },
  {
    id: 'pkm-0002',
    name: 'Gardevoir ex – Alt Art',
    price: 39.95,
    image: 'https://images.pokemontcg.io/sv1/245_hires.png',
  },
  {
    id: 'pkm-0003',
    name: 'Umbreon VMAX – TG',
    price: 89.0,
    image: 'https://images.pokemontcg.io/swsh7tg/23_hires.png',
  },
  {
    id: 'pkm-0004',
    name: 'Rayquaza V – Full Art',
    price: 29.5,
    image: 'https://images.pokemontcg.io/swsh7/110_hires.png',
  },
];

const currency = (n: number) =>
  Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);

const InventoryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { addToCart, isHydrated } = useCart();

  // If you have a selector/hook for inventory, use it here instead of PRODUCTS
  const products: Product[] = useMemo(() => PRODUCTS, []);

  const handleAdd = (p: Product) => {
    if (!isHydrated) return;
    addToCart({
      id: p.id,
      name: p.name,
      price: p.price,
      image: p.image,
      quantity: 1,
    });
    Alert.alert('Added to cart', `${p.name} has been added.`);
  };

  if (!isHydrated) {
    // We wait for cart hydration so the "Add to Cart" button reflects real state
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  if (!products || products.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>No products yet</Text>
        <Text style={styles.muted}>Check back soon as we add inventory.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={{ padding: 12, paddingBottom: 120 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('ProductDetails', { product: item })}
          >
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.image} />
            ) : (
              <View style={[styles.image, styles.imgPlaceholder]}>
                <Text style={styles.imgInitial}>{item.name?.[0]?.toUpperCase() ?? '?'}</Text>
              </View>
            )}

            <View style={styles.meta}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.price}>{currency(item.price)}</Text>

              <TouchableOpacity
                style={[styles.button, styles.primary, !isHydrated && styles.disabled]}
                disabled={!isHydrated}
                onPress={() => handleAdd(item)}
              >
                <Text style={styles.buttonText}>
                  {isHydrated ? 'Add to Cart' : 'Loading…'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default InventoryScreen;

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

  column: { gap: 12, paddingHorizontal: 0 },
  card: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 10,
    margin: 6,
    gap: 8,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  image: { width: '100%', height: 140, borderRadius: 12, backgroundColor: '#0B0B0B' },
  imgPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  imgInitial: { color: '#9CA3AF', fontSize: 22, fontWeight: '700' },

  meta: { gap: 6 },
  name: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  price: { color: '#9CA3AF', fontSize: 13 },

  button: {
    marginTop: 4,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: '#E11D48' }, // Rivals red
  disabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});
