// screens/InventoryScreen.tsx
import React from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../contexts/CartContext';
import { useInventory } from '../contexts/InventoryContext';

const currency = (n: number) =>
  n > 0
    ? Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n)
    : '—';

const InventoryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { addToCart, isHydrated } = useCart();
  const { items, isLoading, error, refresh } = useInventory();

  const handleAdd = (p: { id: string; name: string; price: number; image?: string }) => {
    if (!isHydrated) return;
    addToCart({ id: p.id, name: p.name, price: p.price, image: p.image, quantity: 1 });
    Alert.alert('Added to cart', `${p.name} has been added.`);
  };

  if (!isHydrated || (isLoading && items.length === 0)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.muted}>Loading inventory…</Text>
      </View>
    );
  }

  if (error && items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Couldn’t load inventory</Text>
        <Text style={styles.muted}>{error}</Text>
        <TouchableOpacity style={[styles.button, styles.primary]} onPress={refresh}>
          <Text style={styles.buttonText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!items || items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>No products yet</Text>
        <Text style={styles.muted}>Check back soon as we add inventory.</Text>
        <TouchableOpacity style={[styles.button, styles.primary]} onPress={refresh}>
          <Text style={styles.buttonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={{ padding: 12, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor="#fff" />}
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

              {(item as any).setName || (item as any).rarity ? (
                <Text style={styles.sub} numberOfLines={1}>
                  {(item as any).setName ?? ''}
                  {(item as any).setName && (item as any).rarity ? ' · ' : ''}
                  {(item as any).rarity ?? ''}
                </Text>
              ) : null}

              <Text style={styles.price}>{currency(item.price)}</Text>

              <TouchableOpacity
                style={[styles.button, styles.primary, !isHydrated && styles.disabled]}
                disabled={!isHydrated}
                onPress={() => handleAdd(item)}
              >
                <Text style={styles.buttonText}>{isHydrated ? 'Add to Cart' : 'Loading…'}</Text>
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
  title: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
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
  sub: { color: '#9CA3AF', fontSize: 12 },
  price: { color: '#9CA3AF', fontSize: 13 },

  button: {
    marginTop: 4,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: '#E11D48' },
  disabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});
