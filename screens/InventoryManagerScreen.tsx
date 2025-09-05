import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, FontSizes } from '../theme/theme';

// Mock data - replace with live inventory later
const mockInventory = [
  { id: '001', name: 'Charizard EX', marketPrice: 50 },
  { id: '002', name: 'Pikachu V', marketPrice: 10 },
  { id: '003', name: 'Gengar SIR', marketPrice: 25 },
];

export default function InventoryManagerScreen() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'FOR_SALE'>('ALL');

  useEffect(() => {
    const loadPrices = async () => {
      const loaded = await Promise.all(
        mockInventory.map(async (item) => {
          const price = await AsyncStorage.getItem(`price_${item.id}`);
          return {
            ...item,
            forSalePrice: price || '',
            forSale: !!price,
          };
        })
      );
      setInventory(loaded);
    };

    loadPrices();
  }, []);

  const savePrice = async (id: string, price: string) => {
    await AsyncStorage.setItem(`price_${id}`, price);
    const updated = inventory.map((item) =>
      item.id === id ? { ...item, forSalePrice: price, forSale: !!price } : item
    );
    setInventory(updated);
  };

  const clearPrice = async (id: string) => {
    await AsyncStorage.removeItem(`price_${id}`);
    const updated = inventory.map((item) =>
      item.id === id ? { ...item, forSalePrice: '', forSale: false } : item
    );
    setInventory(updated);
  };

  const filteredInventory =
    filter === 'ALL' ? inventory : inventory.filter((item) => item.forSale);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory Manager</Text>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Show for sale only</Text>
          <Switch
            value={filter === 'FOR_SALE'}
            onValueChange={(value) => setFilter(value ? 'FOR_SALE' : 'ALL')}
          />
        </View>
      </View>

      <FlatList
        data={filteredInventory}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSub}>Market: ${item.marketPrice.toFixed(2)}</Text>
            <TextInput
              style={styles.input}
              placeholder="Set for-sale price"
              keyboardType="numeric"
              value={item.forSalePrice}
              onChangeText={(text) => savePrice(item.id, text)}
            />
            {item.forSalePrice ? (
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => clearPrice(item.id)}
              >
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: Colors.background,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: FontSizes.title,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  filterLabel: {
    color: Colors.text,
    marginRight: 8,
  },
  card: {
    backgroundColor: Colors.card,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: FontSizes.subtitle,
    fontWeight: 'bold',
    color: Colors.text,
  },
  cardSub: {
    fontSize: FontSizes.body,
    color: Colors.gray,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.gray,
    borderRadius: 6,
    padding: 8,
    fontSize: FontSizes.body,
    backgroundColor: Colors.white,
    marginBottom: 8,
  },
  clearBtn: {
    alignSelf: 'flex-end',
  },
  clearText: {
    color: Colors.accent,
    fontSize: FontSizes.body,
  },
});
