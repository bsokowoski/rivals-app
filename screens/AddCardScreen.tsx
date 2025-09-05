import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { useInventory, type InventoryItem } from '../contexts/InventoryContext';

export default function AddCardScreen() {
  const { addItem } = useInventory();

  const [cardName, setCardName] = useState('');
  const [setName, setSetName] = useState('');
  const [number, setNumber] = useState('');
  const [condition, setCondition] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [imageUrl, setImageUrl] = useState('');

  const onSave = () => {
    if (!cardName.trim()) {
      Alert.alert('Name required', 'Please enter a name.');
      return;
    }

    const skuBase = [setName, number, cardName].filter(Boolean).join('|');
    const id = `${Date.now()}`;
    const sku = skuBase || id;

    const parsedPrice = Number(price);
    const parsedQty = Number(quantity);

    const item: InventoryItem = {
      id,
      sku,
      name: cardName.trim(),
      set: setName.trim() || undefined,
      number: number.trim() || undefined,
      condition: condition.trim() || undefined,
      price: Number.isFinite(parsedPrice) ? parsedPrice : undefined,
      quantity: Number.isFinite(parsedQty) ? parsedQty : 0,
      imageUrl: imageUrl.trim() || undefined,
    };

    addItem(item);
    Alert.alert('Saved', 'Card added to inventory.');
    // optionally clear the form:
    setCardName(''); setSetName(''); setNumber(''); setCondition('');
    setPrice(''); setQuantity('0'); setImageUrl('');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0b0b0b' }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ color: 'white', fontSize: 22, fontWeight: '800' }}>Add Card</Text>

      <Field label="Name" value={cardName} onChangeText={setCardName} />
      <Field label="Set" value={setName} onChangeText={setSetName} />
      <Field label="Number" value={number} onChangeText={setNumber} />
      <Field label="Condition" value={condition} onChangeText={setCondition} />
      <Field label="Price" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
      <Field label="Quantity" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" />
      <Field label="Image URL" value={imageUrl} onChangeText={setImageUrl} autoCapitalize="none" />

      <Pressable
        onPress={onSave}
        style={{ backgroundColor: '#10b981', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 8 }}
      >
        <Text style={{ color: 'white', fontWeight: '800' }}>Save</Text>
      </Pressable>
    </ScrollView>
  );
}

function Field({
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
