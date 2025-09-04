import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useInventory } from '../contexts/InventoryContext';
import type { InventoryProduct } from '../services/collectr';

type AnyItem = InventoryProduct & {
  quantity?: number;
  number?: string;         // some screens used this name
  cardNumber?: string;     // our mapped name
  condition?: string;
  imageUrl?: string;       // some payloads use imageUrl
};

type RouteParams = {
  product?: AnyItem;
  id?: string;
};

export default function EditCardScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const inv: any = useInventory(); // allow optional methods without TS errors

  const { product, id } = (route.params || {}) as RouteParams;

  const item: AnyItem | undefined = useMemo(() => {
    if (product) return product;
    if (id && Array.isArray(inv?.items)) {
      return (inv.items as AnyItem[]).find((p) => p.id === id);
    }
    return undefined;
  }, [product, id, inv?.items]);

  if (!item) {
    return (
      <View style={s.center}>
        <Text style={s.title}>Item not found</Text>
        <Text style={s.muted}>Return to Inventory and pick an item.</Text>
        <TouchableOpacity style={[s.btn, s.primary]} onPress={() => navigation.goBack()}>
          <Text style={s.btnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const image = item.image ?? item.imageUrl;
  const cardNumber = item.cardNumber ?? item.number ?? '';
  const condition = item.condition ?? '—';

  const [qty, setQty] = useState<number>(item.quantity ?? 1);
  const [price, setPrice] = useState<string>(
    Number.isFinite(item.price) ? String(item.price) : ''
  );

  const save = () => {
    if (typeof inv?.updateItem === 'function') {
      inv.updateItem({
        ...item,
        price: parseFloat(price) || 0,
        quantity: qty,
      });
      Alert.alert('Saved', 'Your changes have been saved.');
      navigation.goBack();
    } else {
      Alert.alert(
        'Not available in this beta',
        'Editing will ship in the next beta. (No updateItem() in InventoryContext yet.)'
      );
    }
  };

  const remove = () => {
    if (typeof inv?.removeItem === 'function') {
      inv.removeItem(item.id);
      Alert.alert('Removed', `${item.name} removed from inventory.`);
      navigation.goBack();
    } else {
      Alert.alert(
        'Not available in this beta',
        'Delete requires removeItem() in InventoryContext.'
      );
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 16 }}>
      <View style={s.card}>
        {image ? (
          <Image source={{ uri: image }} style={s.image} />
        ) : (
          <View style={[s.image, s.imgPh]}>
            <Text style={s.imgInitial}>{item.name?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
        )}

        <Text style={s.name}>{item.name}</Text>
        {(item as any).setName || (item as any).rarity || cardNumber ? (
          <Text style={s.sub} numberOfLines={2}>
            {(item as any).setName ?? ''}
            {(item as any).setName && (item as any).rarity ? ' · ' : ''}
            {(item as any).rarity ?? ''}
            {((item as any).setName || (item as any).rarity) && cardNumber ? ' · ' : ''}
            {cardNumber ? `#${cardNumber}` : ''}
          </Text>
        ) : null}
        <Text style={s.sub}>Condition: {condition}</Text>

        <View style={s.row}>
          <View style={s.field}>
            <Text style={s.label}>Price (USD)</Text>
            <TextInput
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#6B7280"
              style={s.input}
            />
          </View>
          <View style={s.field}>
            <Text style={s.label}>Quantity</Text>
            <TextInput
              value={String(qty)}
              onChangeText={(t) => setQty(Math.max(0, parseInt(t || '0', 10) || 0))}
              keyboardType="number-pad"
              placeholder="1"
              placeholderTextColor="#6B7280"
              style={s.input}
            />
          </View>
        </View>

        <View style={s.actions}>
          <TouchableOpacity style={[s.btn, s.primary]} onPress={save}>
            <Text style={s.btnText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, s.danger]} onPress={remove}>
            <Text style={s.btnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B0B' },
  center: {
    flex: 1,
    backgroundColor: '#0B0B0B',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  muted: { color: '#9CA3AF', fontSize: 14, textAlign: 'center' },

  card: {
    backgroundColor: '#111827',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
    padding: 16,
    gap: 10,
  },
  image: { width: '100%', height: 200, borderRadius: 12, backgroundColor: '#0B0B0B' },
  imgPh: { alignItems: 'center', justifyContent: 'center' },
  imgInitial: { color: '#9CA3AF', fontSize: 28, fontWeight: '700' },

  name: { color: '#fff', fontSize: 18, fontWeight: '700' },
  sub: { color: '#9CA3AF', fontSize: 13 },

  row: { flexDirection: 'row', gap: 12 },
  field: { flex: 1 },
  label: { color: '#9CA3AF', fontSize: 12, marginBottom: 6 },
  input: {
    color: '#fff',
    backgroundColor: '#0B0B0B',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },

  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: '#E11D48' },
  danger: { backgroundColor: '#7F1D1D' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
