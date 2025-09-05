// File: screens/DraftsListScreen.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

type DraftProduct = {
  id: string;
  name: string;
  priceCents: number;
  imageUrl?: string;
  description?: string;
  createdAt: string; // ISO
};

type InventoryProduct = {
  id: string;
  name: string;
  priceCents: number;
  imageUrl?: string;
  description?: string;
  publishedAt: string; // ISO
};

const DRAFTS_KEY = 'seller:products';
const INVENTORY_KEY = 'inventory:products';

async function loadDrafts(): Promise<DraftProduct[]> {
  try {
    const raw = await AsyncStorage.getItem(DRAFTS_KEY);
    return raw ? (JSON.parse(raw) as DraftProduct[]) : [];
  } catch {
    return [];
  }
}

async function saveDrafts(items: DraftProduct[]): Promise<void> {
  try {
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(items));
  } catch {}
}

async function loadInventory(): Promise<InventoryProduct[]> {
  try {
    const raw = await AsyncStorage.getItem(INVENTORY_KEY);
    return raw ? (JSON.parse(raw) as InventoryProduct[]) : [];
  } catch {
    return [];
  }
}

async function saveInventory(items: InventoryProduct[]): Promise<void> {
  try {
    await AsyncStorage.setItem(INVENTORY_KEY, JSON.stringify(items));
  } catch {}
}

const DraftsListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [drafts, setDrafts] = useState<DraftProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null); // for per-item publish/delete states

  const fetchDrafts = useCallback(async () => {
    const items = await loadDrafts();
    // Newest first by createdAt
    items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    setDrafts(items);
  }, []);

  // Initial load
  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchDrafts();
      setLoading(false);
    })();
  }, [fetchDrafts]);

  // Reload on focus (e.g., after editing a draft)
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const items = await loadDrafts();
        items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        if (active) setDrafts(items);
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDrafts();
    setRefreshing(false);
  }, [fetchDrafts]);

  const data = useMemo(() => drafts, [drafts]);

  const confirmDelete = (id: string) => {
    Alert.alert('Delete Draft', 'Are you sure you want to remove this draft?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setBusyId(id);
            const next = drafts.filter((d) => d.id !== id);
            setDrafts(next);
            await saveDrafts(next);
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  };

  const publishDraft = async (draft: DraftProduct) => {
    try {
      setBusyId(draft.id);

      // 1) Write/replace in inventory
      const inventory = await loadInventory();
      const idx = inventory.findIndex((p) => p.id === draft.id);
      const published: InventoryProduct = {
        id: draft.id,
        name: draft.name,
        priceCents: draft.priceCents,
        imageUrl: draft.imageUrl,
        description: draft.description,
        publishedAt: new Date().toISOString(),
      };
      const nextInventory =
        idx === -1
          ? [published, ...inventory]
          : Object.assign([...inventory], { [idx]: published });
      await saveInventory(nextInventory);

      // 2) Remove from drafts
      const nextDrafts = drafts.filter((d) => d.id !== draft.id);
      setDrafts(nextDrafts);
      await saveDrafts(nextDrafts);

      Alert.alert('Published', 'Draft moved to Inventory.', [
        { text: 'View Inventory', onPress: () => navigation.navigate('Tabs', { screen: 'Inventory' }) },
        { text: 'OK' },
      ]);
    } catch {
      Alert.alert('Error', 'Could not publish draft.');
    } finally {
      setBusyId(null);
    }
  };

  const renderItem = ({ item }: { item: DraftProduct }) => {
    const isBusy = busyId === item.id;
    return (
      <View style={styles.card}>
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
            ${(item.priceCents / 100).toFixed(2)} ·{' '}
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>

          <View style={styles.rowActions}>
            <TouchableOpacity
              style={[styles.btn, styles.secondary]}
              onPress={() => navigation.navigate('DraftDetail', { draftId: item.id })}
              activeOpacity={0.85}
              disabled={isBusy}
            >
              <Text style={styles.btnText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.success]}
              onPress={() => publishDraft(item)}
              activeOpacity={0.85}
              disabled={isBusy}
            >
              <Text style={styles.btnText}>{isBusy ? 'Publishing…' : 'Publish'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.danger]}
              onPress={() => confirmDelete(item.id)}
              activeOpacity={0.85}
              disabled={isBusy}
            >
              <Text style={styles.btnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{ color: '#9ca3af' }}>Loading drafts…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {data.length === 0 ? (
        <View style={[styles.center, { padding: 24 }]}>
          <Text style={styles.emptyTitle}>No drafts yet</Text>
          <Text style={styles.emptySubtitle}>
            Create a product draft from the Seller Dashboard.
          </Text>
          <TouchableOpacity
            style={styles.cta}
            onPress={() => navigation.navigate('SellerDashboard')}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>Go to Seller Dashboard</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0c' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#111216',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#0f1012',
  },
  name: { color: '#fff', fontWeight: '700' },
  meta: { color: '#9ca3af', marginTop: 4, fontSize: 12 },

  rowActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700' },
  secondary: { backgroundColor: '#1f2937' },
  success: { backgroundColor: '#22c55e' },
  danger: { backgroundColor: '#0f1012', borderWidth: 1, borderColor: '#1f2937' },

  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 6, textAlign: 'center' },
  emptySubtitle: { color: '#9ca3af', textAlign: 'center', marginBottom: 12 },
  cta: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  ctaText: { color: '#fff', fontWeight: '700' },
});

export default DraftsListScreen;
