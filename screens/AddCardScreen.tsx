// screens/AddCardScreen.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useInventory } from '../contexts/InventoryContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddCard'>;

const CONDITIONS = ['NM', 'LP', 'MP', 'HP', 'DMG', 'Sealed'];

export default function AddCardScreen({ navigation }: Props) {
  const { addItem } = useInventory();

  // Renamed to avoid collisions and be explicit
  const [cardName, setCardName] = useState('');
  const [cardSetName, setCardSetName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [condition, setCondition] = useState<string>('NM');
  const [price, setPrice] = useState<string>('0');
  const [quantity, setQuantity] = useState<string>('1');
  const [imageUrl, setImageUrl] = useState<string>('');

  const canSave = useMemo(() => {
    const priceNum = Number(price);
    const qtyNum = Number(quantity);
    return (
      cardName.trim().length > 0 &&
      cardSetName.trim().length > 0 &&
      cardNumber.trim().length > 0 &&
      !Number.isNaN(priceNum) &&
      !Number.isNaN(qtyNum) &&
      priceNum >= 0 &&
      qtyNum > 0
    );
  }, [cardName, cardSetName, cardNumber, price, quantity]);

  const onSave = () => {
    if (!canSave) {
      Alert.alert('Missing or invalid fields', 'Please fill out all required fields.');
      return;
    }

    addItem({
      name: cardName.trim(),
      setName: cardSetName.trim(),
      number: cardNumber.trim(),
      condition,
      price: Number(price),
      quantity: Number(quantity),
      imageUrl: imageUrl.trim() || undefined,
    });

    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Add Card</Text>

        <Field label="Card Name *">
          <TextInput
            placeholder="e.g., Charizard"
            value={cardName}
            onChangeText={setCardName}
            style={styles.input}
          />
        </Field>

        <Field label="Set Name *">
          <TextInput
            placeholder="e.g., Base Set 2"
            value={cardSetName}
            onChangeText={setCardSetName}
            style={styles.input}
          />
        </Field>

        <Field label="Card Number *">
          <TextInput
            placeholder='e.g., "15/108"'
            value={cardNumber}
            onChangeText={setCardNumber}
            autoCapitalize="none"
            style={styles.input}
          />
        </Field>

        <Field label="Condition">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {CONDITIONS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setCondition(c)}
                style={[styles.pill, condition === c && styles.pillActive]}
              >
                <Text style={[styles.pillText, condition === c && styles.pillTextActive]}>
                  {c}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Field>

        <Field label="Price *">
          <TextInput
            placeholder="e.g., 19.99"
            keyboardType="decimal-pad"
            value={price}
            onChangeText={setPrice}
            style={styles.input}
          />
        </Field>

        <Field label="Quantity *">
          <TextInput
            placeholder="e.g., 3"
            keyboardType="number-pad"
            value={quantity}
            onChangeText={setQuantity}
            style={styles.input}
          />
        </Field>

        <Field label="Image URL (optional)">
          <TextInput
            placeholder="https://..."
            autoCapitalize="none"
            value={imageUrl}
            onChangeText={setImageUrl}
            style={styles.input}
          />
          <Text style={styles.help}>
            Tip: paste a stock image URL. We can add camera/gallery or auto-fill later.
          </Text>
        </Field>

        <Pressable onPress={onSave} disabled={!canSave} style={[styles.button, !canSave && styles.buttonDisabled]}>
          <Text style={styles.buttonText}>Save Card</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  pill: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  pillActive: {
    borderColor: '#111827',
  },
  pillText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#111827',
  },
  button: {
    marginTop: 8,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  help: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
  },
});
