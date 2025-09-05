import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useInventory, type InventoryItem } from '../contexts/InventoryContext';

type EditProductRoute = RouteProp<RootStackParamList, 'EditProduct'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function EditProductScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<EditProductRoute>();
  const { items, isHydrated, isLoading, addItem } = useInventory();

  const existing: InventoryItem | undefined = useMemo(() => {
    const id = route.params?.productId;
    if (!id) return undefined;
    return items.find((i) => String(i.id) === String(id));
  }, [items, route.params]);

  // form state
  const [name, setName] = useState<string>(existing?.name ?? '');
  const [setNameStr, setSetNameStr] = useState<string>(existing?.set ?? '');
  const [number, setNumber] = useState<string>(String(existing?.number ?? ''));
  const [rarity, setRarity] = useState<string>(existing?.rarity ?? '');
  const [condition, setCondition] = useState<string>(existing?.condition ?? '');
  const [price, setPrice] = useState<string>(
    typeof existing?.price === 'number' ? existing!.price.toString() : ''
  );
  const [quantity, setQuantity] = useState<string>(String(existing?.quantity ?? '0'));
  const [imageUrl, setImageUrl] = useState<string>(existing?.imageUrl ?? '');
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    try {
      if (!name.trim()) {
        Alert.alert('Name required', 'Please enter a name.');
        return;
      }
      setSaving(true);

      const parsedPrice = Number(price);
      const parsedQty = Number(quantity);

      const updated: InventoryItem = {
        id: existing?.id ?? `${Date.now()}`,
        sku:
        existing?.sku ??
        ([setNameStr, number, name].filter(Boolean).join('|') || `${Date.now()}`),
        name: name.trim(),
        set: setNameStr.trim() || undefined,
        number: number.trim() || undefined,
        rarity: rarity.trim() || undefined,
        condition: condition.trim() || undefined,
        price: Number.isFinite(parsedPrice) ? parsedPrice : undefined,
        quantity: Number.isFinite(parsedQty) ? parsedQty : 0,
        imageUrl: imageUrl.trim() || undefined,
        ...(existing ? existing : {}), // preserve custom fields
      };

      await Promise.resolve(addItem(updated));
      Alert.alert('Saved', 'Product details updated.');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading && !isHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0b0b0b', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0b0b0b' }}
      contentContainerStyle={{ padding: 16, gap: 12 }}
    >
      <Text style={{ color: 'white', fontSize: 22, fontWeight: '800' }}>
        {existing ? 'Edit Product' : 'Add Product'}
      </Text>

      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          resizeMode="cover"
          style={{ width: '100%', height: 180, backgroundColor: '#111827', borderRadius: 12 }}
        />
      ) : (
        <View
          style={{
            width: '100%',
            height: 120,
            backgroundColor: '#111827',
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#6b7280' }}>No image</Text>
        </View>
      )}

      <LabeledInput label="Name" value={name} onChangeText={setName} autoCapitalize="words" />
      <LabeledInput label="Set" value={setNameStr} onChangeText={setSetNameStr} />
      <LabeledInput label="Number" value={number} onChangeText={setNumber} keyboardType="default" />
      <LabeledInput label="Rarity" value={rarity} onChangeText={setRarity} />
      <LabeledInput label="Condition" value={condition} onChangeText={setCondition} />
      <LabeledInput label="Price" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
      <LabeledInput label="Quantity" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" />
      <LabeledInput label="Image URL" value={imageUrl} onChangeText={setImageUrl} autoCapitalize="none" />

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
        <Pressable
          onPress={onSave}
          disabled={saving}
          style={{
            backgroundColor: saving ? '#6b7280' : '#10b981',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '800' }}>
            {saving ? 'Saving…' : 'Save'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.goBack()}
          style={{
            backgroundColor: '#374151',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '800' }}>Cancel</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function LabeledInput({
  label,
  ...props
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: '#9ca3af', fontWeight: '700' }}>{label}</Text>
      <TextInput
        placeholder={label}
        placeholderTextColor="#6b7280"
        style={{
          borderWidth: 1,
          borderColor: '#333',
          color: 'white',
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 10,
        }}
        {...props}
      />
    </View>
  );
}
