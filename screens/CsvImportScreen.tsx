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

/* ---------- helpers ---------- */

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
function rowToItem(r: ParsedRow): InventoryItem {
  const name = r.name ?? r.cardName ?? r.title ?? 'Unknown';
  const set = r.set ?? r.Set ?? r.series ?? '';
  const number = r.number ?? r.No ?? r.num ?? '';
  const rarity = r.rarity ?? r.Rarity ?? undefined;
  const condition = r.condition ?? r.Condition ?? undefined;

  const computedSku =
    [set, number, name].filter(Boolean).join('|') ||
    (r.sku ?? r.id ?? String(Math.random()));

  // Prefer explicit for-sale price columns; fall back to plain price
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
    // keep legacy "price" in sync for any UI still reading it
    ...(forSalePrice !== undefined ? { price: forSalePrice } : {}),
  };

  // Preserve any unknown columns from CSV
  for (const [k, v] of Object.entries(r)) {
    if (!(k in base)) (base as any)[k] = v;
  }
  return base;
}

/** Apply in-screen price transforms to forSalePrice (keeps legacy price mirrored). */
function applyPriceTransforms(
  arr: InventoryItem[],
  multiplier: string,
  roundTo99: boolean
): InventoryItem[] {
  const mult = Number(multiplier) || 1;
  return arr.map((i) => {
    // Start from whichever price is present (forSale > price > market > cost)
    let p =
      typeof i.forSalePrice === 'number'
        ? i.forSalePrice
        : typeof i.price === 'number'
        ? i.price
        : typeof i.marketPrice === 'number'
        ? i.marketPrice
        : typeof i.costPrice === 'number'
        ? i.costPrice
        : undefined;

    if (typeof p === 'number') {
      p = p * mult;
      if (roundTo99) p = Math.max(0, Math.round(p) - 0.01);
    }

    const next: InventoryItem = { ...i };
    if (typeof p === 'number') {
      next.forSalePrice = p;
      (next as any).price = p; // legacy mirror
    }
    return next;
  });
}

/* ---------- screen ---------- */

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
  const [showBanner, setShowBanner] = useState(true);

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
      const hasSale =
        typeof i.forSalePrice === 'number' ||
        typeof i.price === 'number' ||
        typeof i.marketPrice === 'number' ||
        typeof i.costPrice === 'number';
      if (hasSale) withPrice++;
      qtyTotal += Number(i.quantity ?? 0);
    }
    return { withPrice, qtyTotal };
  }, [items]);

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
      setItems(applyPriceTransforms(mapped, multiplier, roundTo99));
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
    const url = mode === 'replace' ? ADMIN_REPLACE_URL : ADMIN_BULK_UPSERT_URL;
    if (!url || !ADMIN_TOKEN) {
      Alert.alert('Missing admin configuration', 'Check ADMIN_* values in env.');
      return;
    }
    try {
      setLoading(true);
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

      // reflect server changes locally
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

      {/* Admin banner — Collectr tip */}
      {showBanner ? (
        <View
          style={{
            backgroundColor: '#111827',
            borderColor: '#334155',
            borderWidth: 1,
            borderRadius: 12,
            padding: 12,
            gap: 6,
          }}
        >
          <Text style={{ color: '#e5e7eb', fontWeight: '700' }}>
            Tip: export a CSV from Collectr Admin, then import it here.
          </Text>
          <Text style={{ color: '#9ca3af' }}>
            Recognized columns include: <Text style={{ color: '#e5e7eb' }}>name, set, number,
            rarity, condition, quantity, forSalePrice (or price), marketPrice, costPrice, imageUrl, sku</Text>.
            Unknown columns are preserved per row.
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              onPress={() => setShowBanner(false)}
              style={{ backgroundColor: '#374151', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
            >
              <Text style={{ color: 'white', fontWeight: '700' }}>Got it</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <Text style={{ color: '#9ca3af' }}>
        You can bulk-adjust the for-sale price with the multiplier and “.99” rounding before uploading.
      </Text>

      {/* Controls */}
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
          onPress={() => setItems((arr) => applyPriceTransforms(arr, multiplier, roundTo99))}
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

      {/* Stats */}
      <View style={{ gap: 6 }}>
        <Text style={{ color: 'white', fontWeight: '600' }}>
          Parsed rows: {rows.length} • Items: {items.length} • With price: {stats.withPrice} • Qty total: {stats.qtyTotal}
        </Text>
      </View>

      {/* Filter + Preview (first 50) */}
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
              Qty: {item.quantity ?? 0} • For sale:{' '}
              {typeof item.forSalePrice === 'number'
                ? `$${item.forSalePrice.toFixed(2)}`
                : typeof item.price === 'number'
                ? `$${item.price.toFixed(2)}`
                : typeof item.marketPrice === 'number'
                ? `$${item.marketPrice.toFixed(2)}`
                : '—'}{' '}
              {typeof item.costPrice === 'number' ? `• Cost: $${item.costPrice.toFixed(2)}` : ''}
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
