// File: screens/DraftDetailScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

type DraftProduct = {
  id: string;
  name: string;
  priceCents: number;
  imageUrl?: string;
  description?: string;
  createdAt: string;
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

interface Props {
  route?: {
    params?: {
      draftId?: string;
    };
  };
}

const DraftDetailScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation<any>();
  const draftId = route?.params?.draftId ?? '';

  const [original, setOriginal] = useState<DraftProduct | null>(null);
  const [name, setName] = useState('');
  const [priceStr, setPriceStr] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load the draft by id
  useEffect(() => {
    (async () => {
      const drafts = await loadDrafts();
      const found = drafts.find((d) => d.id === draftId) || null;
      if (found) {
        setOriginal(found);
        setName(found.name);
        setPriceStr((found.priceCents / 100).toFixed(2));
        setImageUrl(found.imageUrl ?? '');
        setDescription(found.description ?? '');
      }
      setLoading(false);
    })();
  }, [draftId]);

  const priceCents = useMemo(() => {
    const cleaned = priceStr.replace(/[^\d.]/g, '');
    const n = Number(cleaned);
    if (Number.isNaN(n)) return 0;
    return Math.round(n * 100);
  }, [priceStr]);

  const isDirty = useMemo(() => {
    if (!original) return false;
    return (
      name !== original.name ||
      priceCents !== original.priceCents ||
      (imageUrl || '') !== (original.imageUrl || '') ||
      (description || '') !== (original.description || '')
    );
  }, [name, priceCents, imageUrl, description, original]);

  const previewValid = useMemo(
    () => !!imageUrl?.trim() && /^https?:\/\//i.test(imageUrl.trim()),
    [imageUrl]
  );

  const canSave = useMemo(
    () => name.trim().length > 0 && priceCents > 0 && isDirty && !saving,
    [name, priceCents, isDirty, saving]
  );

  const canPublish = useMemo(
    () => !!original && name.trim().length > 0 && priceCents > 0 && !publishing && !saving,
    [original, name, priceCents, publishing, saving]
  );

  const handleSave = async () => {
    if (!original) return;
    try {
      setSaving(true);
      const drafts = await loadDrafts();
      const idx = drafts.findIndex((d) => d.id === original.id);
      if (idx === -1) {
        Alert.alert('Not found', 'This draft no longer exists.');
        return;
      }
      const updated: DraftProduct = {
        ...original,
        name: name.trim(),
        priceCents,
        imageUrl: imageUrl.trim() || undefined,
        description: description.trim() || undefined,
      };
      const next = [...drafts];
      next[idx] = updated;
      await saveDrafts(next);
      setOriginal(updated);
      Alert.alert('Saved', 'Draft updated successfully.');
    } catch {
      Alert.alert('Error', 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!original) return;
    Alert.alert('Delete Draft', 'Are you sure you want to delete this draft?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const drafts = await loadDrafts();
          const next = drafts.filter((d) => d.id !== original.id);
          await saveDrafts(next);
          Alert.alert('Deleted', 'Draft has been removed.');
          navigation.goBack();
        },
      },
    ]);
  };

  const handlePublish = async () => {
    if (!original) return;
    try {
      setPublishing(true);

      // 1) Update the draft with any unsaved edits first (to ensure parity)
      if (isDirty) {
        const drafts = await loadDrafts();
        const idx = drafts.findIndex((d) => d.id === original.id);
        if (idx !== -1) {
          drafts[idx] = {
            ...original,
            name: name.trim(),
            priceCents,
            imageUrl: imageUrl.trim() || undefined,
            description: description.trim() || undefined,
          };
          await saveDrafts(drafts);
          setOriginal(drafts[idx]);
        }
      }

      // 2) Load current inventory and add/replace the item
      const inventory = await loadInventory();
      const existingIdx = inventory.findIndex((p) => p.id === original.id);
      const published: InventoryProduct = {
        id: original.id,
        name: name.trim(),
        priceCents,
        imageUrl: imageUrl.trim() || undefined,
        description: description.trim() || undefined,
        publishedAt: new Date().toISOString(),
      };

      let nextInventory: InventoryProduct[];
      if (existingIdx === -1) {
        nextInventory = [published, ...inventory];
      } else {
        nextInventory = [...inventory];
        nextInventory[existingIdx] = published;
      }
      await saveInventory(nextInventory);

      // 3) Remove the draft after successful publish
      const draftsAfter = await loadDrafts();
      const pruned = draftsAfter.filter((d) => d.id !== original.id);
      await saveDrafts(pruned);

      Alert.alert('Published', 'Draft moved to Inventory.', [
        { text: 'OK', onPress: () => navigation.navigate('Tabs', { screen: 'Inventory' }) },
      ]);
    } catch {
      Alert.alert('Error', 'Could not publish draft.');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{ color: '#9ca3af' }}>Loading draft…</Text>
      </View>
    );
  }

  if (!original) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{ color: '#9ca3af' }}>Draft not found.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.title}>Edit Draft</Text>
        <Text style={styles.subtitle}>
          <Text style={{ color: '#9ca3af' }}>ID:</Text>{' '}
          <Text style={{ color: '#fff' }}>{original.id}</Text>
        </Text>

        {/* Preview */}
        <View style={styles.card}>
          <Text style={styles.label}>Preview</Text>
          <View style={styles.previewBox}>
            {previewValid ? (
              <Image source={{ uri: imageUrl.trim() }} style={styles.previewImg} />
            ) : (
              <Text style={styles.previewPlaceholder}>No image</Text>
            )}
          </View>
        </View>

        {/* Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Details</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            placeholder="e.g., Umbreon SIR — Prismatic Evolutions"
            placeholderTextColor="#6b7280"
            style={styles.input}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Price (USD)</Text>
          <TextInput
            placeholder="e.g., 12.99"
            placeholderTextColor="#6b7280"
            style={styles.input}
            value={priceStr}
            onChangeText={setPriceStr}
            keyboardType="decimal-pad"
          />
          <Text style={styles.hint}>
            Stored as <Text style={{ color: '#fff' }}>{priceCents}</Text> cents
          </Text>

          <Text style={styles.label}>Image URL</Text>
          <TextInput
            placeholder="https://…"
            placeholderTextColor="#6b7280"
            style={styles.input}
            value={imageUrl}
            onChangeText={setImageUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            placeholder="Optional details (set, rarity, condition)…"
            placeholderTextColor="#6b7280"
            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={[styles.btn, { flex: 1, backgroundColor: canSave ? '#ef4444' : '#1f2937' }]}
              onPress={handleSave}
              disabled={!canSave}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, { flex: 1, backgroundColor: '#1f2937' }]}
              onPress={handleDelete}
              activeOpacity={0.85}
            >
              <Text style={[styles.btnText, { color: '#ef4444' }]}>Delete Draft</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Publish */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Publish</Text>
          <Text style={styles.note}>
            Publishing moves this draft into your local inventory store. You can later
            wire this to your backend.
          </Text>
          <TouchableOpacity
            style={[
              styles.btn,
              { backgroundColor: canPublish ? '#22c55e' : '#1f2937', marginTop: 8 },
            ]}
            onPress={handlePublish}
            disabled={!canPublish}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>{publishing ? 'Publishing…' : 'Publish Draft'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0c' },
  center: { alignItems: 'center', justifyContent: 'center' },

  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  subtitle: { color: '#9ca3af', marginTop: 6, marginBottom: 12 },

  card: {
    backgroundColor: '#111216',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },

  sectionTitle: { color: '#fff', fontWeight: '700', fontSize: 16, marginBottom: 12 },

  label: { color: '#9ca3af', marginBottom: 6 },
  input: {
    backgroundColor: '#0f1012',
    borderColor: '#1f2937',
    borderWidth: 1,
    color: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  hint: { color: '#9ca3af', marginTop: -6, marginBottom: 10, fontSize: 12 },

  btn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700' },

  previewBox: {
    backgroundColor: '#0f1012',
    borderColor: '#1f2937',
    borderWidth: 1,
    borderRadius: 12,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImg: { width: '100%', height: '100%', borderRadius: 10, resizeMode: 'cover' },
  previewPlaceholder: { color: '#6b7280' },

  note: { color: '#9ca3af', lineHeight: 20 },
});

export default DraftDetailScreen;
