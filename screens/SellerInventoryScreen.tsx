// screens/SellerInventoryScreen.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, FontSizes } from '../theme/theme';

type InventoryItem = {
  id: string;
  name: string;
  set: string;
  price: number;
};

export default function SellerInventoryScreen() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filtered, setFiltered] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadInventory = async () => {
      const data = await AsyncStorage.getItem('sellerInventory');
      if (data) {
        const parsed = JSON.parse(data);
        setInventory(parsed);
        setFiltered(parsed);
      }
    };
    loadInventory();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(inventory);
    } else {
      const query = search.toLowerCase();
      const filteredItems = inventory.filter(
        item =>
          item.name.toLowerCase().includes(query) ||
          item.set.toLowerCase().includes(query)
      );
      setFiltered(filteredItems);
    }
  }, [search, inventory]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Inventory</Text>

      <TextInput
        style={styles.input}
        placeholder="Search by name or set..."
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.set}>Set: {item.set}</Text>
            <Text style={styles.price}>Price: ${item.price.toFixed(2)}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No cards found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: Colors.background,
    flex: 1,
  },
  title: {
    fontSize: FontSizes.title,
    color: Colors.primary,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    backgroundColor: Colors.card,
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: FontSizes.body,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  name: {
    fontSize: FontSizes.subtitle,
    color: Colors.primary,
  },
  set: {
    fontSize: FontSizes.body,
    color: Colors.text,
  },
  price: {
    fontSize: FontSizes.body,
    color: Colors.accent,
    fontWeight: '600',
  },
  empty: {
    textAlign: 'center',
    color: Colors.gray,
    marginTop: 30,
    fontSize: FontSizes.body,
  },
});
