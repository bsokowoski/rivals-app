import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, FontSizes } from '../theme/theme';

type Props = {
  id: string;         // Unique card ID (e.g., from Collectr or API)
  name: string;
  marketPrice: number;
};

export default function InventoryItem({ id, name, marketPrice }: Props) {
  const [price, setPrice] = useState<string>('');
  const [savedPrice, setSavedPrice] = useState<string | null>(null);

  const storageKey = `price_${id}`;

  useEffect(() => {
    const loadSavedPrice = async () => {
      const value = await AsyncStorage.getItem(storageKey);
      if (value) {
        setSavedPrice(value);
        setPrice(value);
      }
    };
    loadSavedPrice();
  }, []);

  const handleSave = async () => {
    await AsyncStorage.setItem(storageKey, price);
    setSavedPrice(price);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{name}</Text>
      <Text style={styles.label}>Market Price: ${marketPrice.toFixed(2)}</Text>

      <TextInput
        style={styles.input}
        placeholder="Set your price"
        keyboardType="numeric"
        value={price}
        onChangeText={setPrice}
      />

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save Price</Text>
      </TouchableOpacity>

      {savedPrice && <Text style={styles.saved}>Saved: ${savedPrice}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: FontSizes.subtitle,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  label: {
    color: Colors.text,
    marginBottom: 6,
  },
  input: {
    borderColor: Colors.gray,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    backgroundColor: Colors.white,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: Colors.white,
    textAlign: 'center',
    fontWeight: '600',
  },
  saved: {
    marginTop: 8,
    color: Colors.secondary,
    fontStyle: 'italic',
  },
});
