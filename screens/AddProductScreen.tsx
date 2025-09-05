// File: screens/AddProductScreen.tsx
import React, { useMemo, useState } from 'react';
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
  createdAt: string; // ISO
};

const DRAFTS_KEY = 'seller:products';

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

function genId() {
  return (
    'dft_' +
    Math.random().toString(36).slice(2, 7) +
    '_' +
    Date.now().toString(36)
  ).toUpperCase();
}

const AddProductScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [name, setName] = useState('');
  const [priceStr, setPriceStr] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const priceCents = useMemo(() => {
    const cleaned = priceStr.replace(/[^\d.]/g, '');
    const n = Number(cleaned);
    if (Number.isNaN(n)) return 0;
    return Math.round(n * 100);
  }, [priceStr]);

  const previewValid = useMemo(
    () => !!imageUrl?.trim() && /^https?:\/\//i.test(imageUrl.trim()),
    [imageUrl]
  );

  const canSave = useMemo(
    () => name.trim().length > 0 && priceCents > 0 && !saving,
    [name, priceCents, saving]
  );

  const handleSave = async () => {
    if (!canSave) return;
    try {
      setSaving(true);
      const id = genId();
      const draft: DraftProduct = {
        id,
        name: name.trim(),
        priceCents,
        imageUrl: imageUrl.trim() || undefined,
        description: description.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      const existing = await loadDrafts();
      // prepend newest
      const next = [draft, ...existing];
      await saveDrafts(next);

      Alert.alert('Draft Created', 'You can edit and publish it now.', [
        {
          text: 'Edit Draft',
          onPress: () => navigation.replace('DraftDetail', { draftId: id }),
        },
        {
          text: 'Close',
          style: 'cancel',
          onPress: () => navigation.navigate('DraftsList'),
        },
      ]);
    } catch {
      Alert.alert('Error', 'Could not create draft.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.title}>New Draft</Text>
        <Text style={styles.subtitle}>Add details for your product.</Text>

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
            placeholder="e.g., Charizard EX — Obsidian Flames"
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

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: canSave ? '#ef4444' : '#1f2937' }]}
            onPress={handleSave}
            disabled={!canSave}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>{saving ? 'Saving…' : 'Create Draft'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#1f2937', marginTop: 8 }]}
            onPress={() => navigation.navigate('DraftsList')}
            activeOpacity={0.85}
          >
            <Text style={[styles.btnText, { color: '#9ca3af' }]}>View Drafts</Text>
          </TouchableOpacity>
        </View>

        {/* Optional: quick link to scanner if you have it */}
        <View style={[styles.card, { marginBottom: 24 }]}>
          <Text style={styles.sectionTitle}>Tools</Text>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#0f1012', borderWidth: 1, borderColor: '#1f2937' }]}
            onPress={() => navigation.navigate('Scanner')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>Open Scanner</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0c' },

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
});

export default AddProductScreen;
