import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  FlatList,
  TextInput,
  Switch,
  ScrollView,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import Papa from 'papaparse';
import {
  ADMIN_BULK_UPSERT_URL,
  ADMIN_REPLACE_URL,
  ADMIN_TOKEN,
} from '../env';
import { useInventory, type InventoryItem } from '../contexts/InventoryContext';

type ParsedRow = Record<string, any>;

function normalizeNumber(n: any): number | undefined {
  if (n === null || n === undefined || n === '') return undefined;
  const v = Number(String(n).replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(v) ? v : undefined;
}

function rowToItem(r: ParsedRow): InventoryItem {
  const name = r.name ?? r.cardName ?? r.title ?? 'Unknown';
  const set = r.set ?? r.Set ?? r.series ?? '';
  const number = r.number ?? r.No ?? r.num ?? '';
  const rarity = r.rarity ?? r.Rarity ?? undefined;
  const condition = r.condition ?? r.Condition ?? undefined;
  const imageUrl = r.imageUrl ?? r.Image ?? r.image ?? undefined;

  const computedSku =
    [set, number, name].filter(Boolean).join('|') ||
    (r.sku ?? r.id ?? String(Math.random()));

  const price = normalizeNumber(r.price);
  const quantity = normalizeNumber(r.quantity) ?? 0;

  const base: InventoryItem = {
    id: r.id ?? computedSku,
    sku: r.sku ?? computedSku,
    name,
    set,
    number,
    rarity,
    condition,
    price,
    quantity,
    imageUrl,
  };

  // preserve unknown columns
  for (const [k, v] of Object.entries(r)) {
    if (!(k in base)) (base as any)[k] = v;
  }
  return base;
}

export default function CsvImportScreen() {
  const { refresh, setItemsLocal } = useInventory();
  const [rawCsv, setRawCsv] = useState<string>('');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [multiplier, setMultiplier] = useState<string>('1.00');
  const [roundTo99, setRoundTo99] = useState<boolean>(false);
  const [filter, setFilter] = useState('');

  const filtered = useMemo(() => {
    if (!filter.trim()) return items;
    const f = filter.toLowerCase();
    return items.filter((it) =>
      [it.name, it.set, it.number, it.sku]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(f))
    );
  }, [items, filter]);

  const stats = useMemo(() => {
    let withPrice = 0;
    let qtyTotal = 0;
    for (const i of items) {
      if (typeof i.price === 'number' && Number.isFinite(i.price)) withPrice++;
      qtyTotal += Number(i.quantity ?? 0);
    }
    return { withPrice, qtyTotal };
  }, [items]);

  const applyPriceTransforms = (arr: InventoryItem[]) => {
    const mult = Number(multiplier) || 1;
    return arr.map((i) => {
      let price = typeof i.price === 'number' ? i.price * mult : (i.price as any);
      if (typeof price === 'number' && roundTo99) {
        price = Math.max(0, Math.round(price) - 0.01);
      }
      return { ...i, price };
    });
  };

  const pickCsv = async () => {
    try {
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
      setRawCsv(text);

      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
      if ((parsed as any).errors?.length) {
        Alert.alert(
          'CSV Parse Warnings',
          (parsed as any).errors
            .map((e: any) => `${e.code}: ${e.message} (row ${e.row})`)
            .join('\n')
            .slice(0, 1200)
        );
      }
      const parsedRows = (parsed.data as ParsedRow[]).filter((r) =>
        Object.values(r).some((v) => String(v ?? '').trim() !== '')
      );
      setRows(parsedRows);

      const mapped = parsedRows.map(rowToItem);
      setItems(applyPriceTransforms(mapped));
    } catch (e: any) {
      Alert.alert('Error reading CSV', e?.message ?? 'Unknown error');
    }
  };

  const push = async (mode: 'replace' | 'bulk-upsert') => {
    if (!items.length) {
      Alert.alert('Nothing to upload', 'Pick and parse a CSV first.');
      return;
    }
    if (dryRun) {
      Alert.alert('Dry run enabled', 'Toggle off "Dry Run" to push changes.');
      return;
    }
    try {
      setLoading(true);
      const url = mode === 'replace' ? ADMIN_REPLACE_URL : ADMIN_BULK_UPSERT_URL;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ADMIN_TOKEN}`,
        },
        body: JSON.stringify({ items }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`);

      setItemsLocal(items);
      Alert.alert('Success', mode === 'replace' ? 'Inventory replaced.' : 'Inventory upserted.');
      refresh();
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0b0b0b' }}
      contentContainerStyle={{ padding: 16, gap: 16 }}
    >
      <Text style={{ color: 'white', fontSize: 22, fontWeight: '800' }}>CSV Import</Text>
      <Text style={{ color: '#9ca3af' }}>
        Columns supported: name, set, number, rarity, condition, price, quantity, imageUrl, sku.
        Unknown columns will be kept.
      </Text>

      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <Pressable
          onPress={pickCsv}
          style={{
            backgroundColor: '#ef4444',
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '700' }}>Pick CSV</Text>
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 12 }}>
          <Text style={{ color: 'white' }}>Multiplier</Text>
          <TextInput
            placeholder="1.00"
            placeholderTextColor="#888"
            value={multiplier}
            onChangeText={setMultiplier}
            keyboardType="decimal-pad"
            style={{
              borderWidth: 1,
              borderColor: '#333',
              color: 'white',
              paddingHorizontal: 10,
              paddingVertical: 6,
              minWidth: 80,
              borderRadius: 8,
            }}
          />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ color: 'white' }}>Round to .99</Text>
          <Switch value={roundTo99} onValueChange={setRoundTo99} />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ color: 'white' }}>Dry Run</Text>
          <Switch value={dryRun} onValueChange={setDryRun} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
        <Pressable
          onPress={() => setItems((arr) => applyPriceTransforms(arr))}
          style={{
            backgroundColor: '#374151',
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '700' }}>Apply Price Changes</Text>
        </Pressable>

        <Pressable
          onPress={() => push('replace')}
          style={{
            backgroundColor: dryRun ? '#555' : '#10b981',
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '700' }}>Replace All</Text>
        </Pressable>

        <Pressable
          onPress={() => push('bulk-upsert')}
          style={{
            backgroundColor: dryRun ? '#555' : '#0ea5e9',
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '700' }}>Bulk Upsert</Text>
        </Pressable>
      </View>

      <View style={{ gap: 6 }}>
        <Text style={{ color: 'white', fontWeight: '600' }}>
          Parsed rows: {rows.length} • Items: {items.length} • With price: {stats.withPrice} • Qty
          total: {stats.qtyTotal}
        </Text>
      </View>

      <TextInput
        placeholder="Filter preview..."
        placeholderTextColor="#888"
        value={filter}
        onChangeText={setFilter}
        style={{
          borderWidth: 1,
          borderColor: '#333',
          color: 'white',
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 10,
        }}
      />

      <FlatList
        data={filtered.slice(0, 50)}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => (
          <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderColor: '#222' }}>
            <Text style={{ color: 'white', fontWeight: '700' }}>{item.name}</Text>
            <Text style={{ color: '#9ca3af' }}>
              {item.set ?? '—'} {item.number ? `#${item.number}` : ''}
            </Text>
            <Text style={{ color: '#9ca3af' }}>
              Qty: {item.quantity ?? 0} • Price:{' '}
              {typeof item.price === 'number' ? `$${item.price.toFixed(2)}` : '—'} • Cond:{' '}
              {item.condition ?? '—'}
            </Text>
          </View>
        )}
      />

      {!rawCsv ? (
        <Text style={{ color: '#6b7280' }}>Pick a CSV to see a 50-row preview here.</Text>
      ) : null}
      {loading ? <ActivityIndicator /> : null}
    </ScrollView>
  );
}
