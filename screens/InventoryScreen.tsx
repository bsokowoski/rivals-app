import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import Papa from 'papaparse';

import { useInventory, type InventoryItem } from '../contexts/InventoryContext';
import { useCart } from '../contexts/CartContext';
import { upsertItem as addToCollection } from '../services/collection';

/* ---------- helpers for CSV mapping ---------- */

function normalizeNumber(n: any): number | undefined {
  if (n === null || n === undefined || n === '') return undefined;
  const v = Number(String(n).replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(v) ? v : undefined;
}

function pickImageUrl(r: Record<string, any>): string | undefined {
  return (
    r.imageUrl ??
    r.image_url ??
    r.image ??
    r.imgUrl ??
    r.img_url ??
    r.img ??
    r['Image URL'] ??
    r['Image'] ??
    r['imageLink'] ??
    undefined
  );
}

/** Map one CSV row into our InventoryItem shape. Preserves unknown columns. */
function rowToItem(r: Record<string, any>): InventoryItem {
  const name = r.name ?? r.cardName ?? r.title ?? 'Unknown';
  const set = r.set ?? r.Set ?? r.series ?? '';
  const number = r.number ?? r.No ?? r.num ?? '';
  const rarity = r.rarity ?? r.Rarity ?? undefined;
  const condition = r.condition ?? r.Condition ?? undefined;

  const computedSku =
    [set, number, name].filter(Boolean).join('|') ||
    (r.sku ?? r.id ?? String(Math.random()));

  // Prefer explicit for-sale price columns; fall back to price
  const forSalePrice =
    normalizeNumber(
      r.forSalePrice ?? r.sale_price ?? r.salePrice ?? r.listPrice ?? r.list_price ?? r.price
    ) ?? undefined;

  const marketPrice = normalizeNumber(
    r.market ?? r.marketPrice ?? r.tcg_market ?? r.tcgMarket ?? r.tcgplayerMarketPrice ?? r.tcg_low ?? r.lowPrice
  );

  const costPrice = normalizeNumber(
    r.cost ?? r.costPrice ?? r.wholesale ?? r.buy_price ?? r.purchasePrice
  );

  const quantity = normalizeNumber(r.quantity) ?? 0;
  const imageUrl = pickImageUrl(r);

  const base: InventoryItem = {
    id: r.id ?? computedSku,
    sku: r.sku ?? computedSku,
    name,
    set,
    number,
    rarity,
    condition,
    imageUrl,
    quantity,
    forSalePrice,
    marketPrice,
    costPrice,
    // keep legacy "price" mirrored for any UI still reading it
    ...(forSalePrice !== undefined ? { price: forSalePrice } : {}),
  };

  // Preserve unknown CSV columns
  for (const [k, v] of Object.entries(r)) {
    if (!(k in base)) (base as any)[k] = v;
  }
  return base;
}

/* ---------- screen ---------- */

export default function InventoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { items, isLoading, isHydrated, refresh, setItemsLocal } = useInventory();
  const { addItem } = useCart();

  const [query, setQuery] = useState('');
  const [busyImport, setBusyImport] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) =>
      [it.name, it.set, it.number, it.sku]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [items, query]);

  // Cart add (accepts optional price)
  const handleAdd = useCallback(
    (item: InventoryItem) => {
      addItem(
        {
          ...item,
          quantity: Math.max(1, Number(item.quantity ?? 1)),
        },
        1
      );
    },
    [addItem]
  );

  const handleAddToCollection = useCallback(async (item: InventoryItem) => {
    await addToCollection({
      ...item,
      quantity: Math.max(1, Number(item.quantity ?? 1)),
    });
  }, []);

  const importCsv = useCallback(
    async (mode: 'replace' | 'merge') => {
      try {
        setBusyImport(true);
        const res = await DocumentPicker.getDocumentAsync({
          type: 'text/csv',
          multiple: false,
          copyToCacheDirectory: true,
        });
        if (res.canceled) return;

        const file = res.assets?.[0];
        if (!file?.uri) {
          Alert.alert('No file', 'Could not read the selected file.');
          return;
        }

        const text = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
        const rows = (parsed.data as any[]).filter((r) =>
          Object.values(r).some((v) => String(v ?? '').trim() !== '')
        );
        const mapped = rows.map(rowToItem);

        if (mode === 'replace') {
          setItemsLocal(mapped); // InventoryProvider will normalize
          Alert.alert('Imported', `Replaced inventory with ${mapped.length} items.`);
          return;
        }

        // merge/upsert by id
        const byId = new Map<string, InventoryItem>();
        for (const it of items) byId.set(String(it.id), it);
        for (const m of mapped) {
          const id = String(m.id);
          const prev = byId.get(id);
          byId.set(id, prev ? { ...prev, ...m } : m);
        }
        setItemsLocal(Array.from(byId.values()));
        Alert.alert('Imported', `Merged ${mapped.length} rows into inventory.`);
      } catch (e: any) {
        Alert.alert('Import failed', e?.message ?? 'Unknown error');
      } finally {
        setBusyImport(false);
      }
    },
    [items, setItemsLocal]
  );

  if (isLoading && !isHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0b0b0b', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0b0b0b' }}>
      <View style={{ padding: 16, gap: 12 }}>
        <Text style={{ color: 'white', fontSize: 22, fontWeight: '800' }}>Inventory</Text>

        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Pressable
            onPress={() => importCsv('replace')}
            disabled={busyImport}
            style={{
              backgroundColor: busyImport ? '#6b7280' : '#ef4444',
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>
              {busyImport ? 'Importing…' : 'Import CSV (Replace)'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => importCsv('merge')}
            disabled={busyImport}
            style={{
              backgroundColor: busyImport ? '#6b7280' : '#10b981',
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>
              {busyImport ? 'Importing…' : 'Import CSV (Merge/Upsert)'}
            </Text>
          </Pressable>

          <Pressable
            onPress={refresh}
            style={{
              backgroundColor: '#374151',
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>Refresh from API</Text>
          </Pressable>
        </View>

        <TextInput
          placeholder="Search name, set, number, sku…"
          placeholderTextColor="#888"
          value={query}
          onChangeText={setQuery}
          style={{
            borderWidth: 1,
            borderColor: '#333',
            color: 'white',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 10,
          }}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#1f2937' }} />}
        onRefresh={refresh}
        refreshing={false}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', paddingVertical: 12, gap: 12 }}>
            {item.imageUrl ? (
              <Image
                source={{ uri: String(item.imageUrl) }}
                resizeMode="cover"
                style={{ width: 64, height: 64, borderRadius: 8, backgroundColor: '#111827' }}
              />
            ) : (
              <View style={{ width: 64, height: 64, borderRadius: 8, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#6b7280', fontSize: 12 }}>No image</Text>
              </View>
            )}

            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ color: 'white', fontWeight: '700' }} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={{ color: '#9ca3af' }} numberOfLines={1}>
                {item.set ?? '—'} {item.number ? `#${item.number}` : ''}
              </Text>
              <Text style={{ color: '#9ca3af' }}>
                Qty: {item.quantity ?? 0} • For sale:{' '}
                {typeof item.forSalePrice === 'number'
                  ? `$${item.forSalePrice.toFixed(2)}`
                  : typeof item.price === 'number'
                  ? `$${item.price.toFixed(2)}`
                  : typeof item.marketPrice === 'number'
                  ? `$${item.marketPrice.toFixed(2)}`
                  : '—'}
                {typeof item.costPrice === 'number' ? ` • Cost: $${item.costPrice.toFixed(2)}` : ''}
              </Text>

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                <Pressable
                  onPress={() => handleAdd(item)}
                  style={{ backgroundColor: '#0ea5e9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
                >
                  <Text style={{ color: 'white', fontWeight: '700' }}>Add to Cart</Text>
                </Pressable>

                <Pressable
                  onPress={() => handleAddToCollection(item)}
                  style={{ backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
                >
                  <Text style={{ color: 'white', fontWeight: '700' }}>Add to Collection</Text>
                </Pressable>

                <Pressable
                  onPress={() => navigation.navigate('EditProduct', { productId: item.id })}
                  style={{ backgroundColor: '#374151', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
                >
                  <Text style={{ color: 'white', fontWeight: '700' }}>Edit Price</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ color: '#9ca3af' }}>No items match your search.</Text>
          </View>
        }
      />
    </View>
  );
}
