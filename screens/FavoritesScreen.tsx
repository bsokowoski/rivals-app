// File: screens/FavoritesScreen.tsx
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
import { useFavorites } from '../contexts/FavoritesContext';
import { useCart } from '../contexts/CartContext';

type RawItem = {
  id?: string | number;
  name?: string;
  price?: number;        // dollars
  priceCents?: number;   // cents
  image?: string;
  imageUrl?: string;
};

type FavItem = {
  id: string;
  name: string;
  priceCents: number;
  imageUrl?: string;
};

const toCents = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
};

const normalize = (it: RawItem): FavItem => ({
  id: String(it.id ?? ''),
  name: it.name ?? 'Item',
  priceCents:
    typeof it.priceCents === 'number'
      ? Math.max(0, Math.round(it.priceCents))
      : toCents(it.price),
  imageUrl: it.imageUrl ?? it.image ?? undefined,
});

const money = (c: number) => `$${(Math.max(0, Math.round(c)) / 100).toFixed(2)}`;

export default function FavoritesScreen() {
  const navigation = useNavigation<any>();

  // Safely consume contexts (won't crash if providers not mounted)
  let favCtx: { items?: RawItem[]; removeFavorite?: (id: string) => void } = {};
  let cartCtx: { addItem?: (item: any) => void } = {};
  try { favCtx = (useFavorites?.() as any) ?? {}; } catch { favCtx = {}; }
  try { cartCtx = (useCart?.() as any) ?? {}; } catch { cartCtx = {}; }

  const data: FavItem[] = useMemo(() => {
    const arr = Array.isArray(favCtx.items) ? favCtx.items : [];
    return arr.map(normalize).filter((x) => x.id);
  }, [favCtx.items]);

  // Route guard (don’t navigate to routes that don’t exist)
  const hasRoute = (name: string) => {
    try {
      const seen = new Set<any>();
      const collect = (nav: any): string[] => {
        if (!nav || seen.has(nav)) return [];
        seen.add(nav);
        const state = nav.getState?.();
        const names = state?.routeNames ?? [];
        const parent = nav.getParent?.();
        return parent ? [...names, ...collect(parent)] : names;
      };
      const names = collect(navigation);
      return Array.isArray(names) && names.includes(name);
    } catch {
      return false;
    }
  };

  const safeNavigate = (name: string, params?: any) => {
    if (hasRoute(name)) {
      try { navigation.navigate(name as never, params as never); }
      catch { Alert.alert('Coming soon', 'This section is not available in this build.'); }
    } else {
      Alert.alert('Coming soon', 'This section is not available in this build.');
    }
  };

  const onPressItem = (it: FavItem) => {
    safeNavigate('ProductDetails', { id: it.id });
  };

  const onRemove = (id: string) => {
    if (typeof favCtx.removeFavorite === 'function') {
      favCtx.removeFavorite(id);
    } else {
      Alert.alert('Not available in this beta', 'Removing favorites will be enabled soon.');
    }
  };

  const onAddToCart = (it: FavItem) => {
    if (typeof cartCtx.addItem === 'function') {
      cartCtx.addItem({
        id: it.id,
        name: it.name,
        priceCents: it.priceCents,
        imageUrl: it.imageUrl,
        qty: 1,
      });
      Alert.alert('Added to Cart', `${it.name} was added to your cart.`);
    } else {
      Alert.alert('Not available in this beta', 'Cart is not initialized in this screen.');
    }
  };

  if (data.length === 0) {
    return (
      <View style={s.empty}>
        <Text style={s.title}>Favorites</Text>
        <Text style={s.muted}>
          {Array.isArray(favCtx.items)
            ? 'No favorites yet.'
            : 'Favorites are not available in this build.'}
        </Text>
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
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.row} onPress={() => onPressItem(item)} activeOpacity={0.9}>
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
              <Text style={s.meta}>{money(item.priceCents)}</Text>
              <View style={s.actions}>
                <TouchableOpacity style={[s.smallBtn, s.ghost]} onPress={() => onRemove(item.id)}>
                  <Text style={s.smallBtnText}>Remove</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.smallBtn, s.primary]} onPress={() => onAddToCart(item)}>
                  <Text style={s.smallBtnText}>Add to Cart</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
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

  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
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
});
