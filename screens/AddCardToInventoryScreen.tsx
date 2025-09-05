import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type CardForSale = {
  id: string;
  name: string;
  image: string;
  price: string;
};

const mockCards: Omit<CardForSale, 'price'>[] = [
  { id: '001', name: 'Charizard EX', image: 'charizard.png' },
  { id: '002', name: 'Pikachu VMAX', image: 'pikachu.png' },
  { id: '003', name: 'Mewtwo GX', image: 'mewtwo.png' },
];

export default function AddCardToInventoryScreen() {
  const [prices, setPrices] = useState<{ [id: string]: string }>({});

  const saveCard = async (card: Omit<CardForSale, 'price'>) => {
    const price = prices[card.id];
    if (!price) {
      Alert.alert('Please enter a price before saving.');
      return;
    }

    const newCard: CardForSale = { ...card, price };

    try {
      const stored = await AsyncStorage.getItem('sellerInventory');
      const inventory: CardForSale[] = stored ? JSON.parse(stored) : [];

      const updatedInventory = [...inventory, newCard];
      await AsyncStorage.setItem('sellerInventory', JSON.stringify(updatedInventory));

      Alert.alert(`${card.name} added to inventory!`);
      setPrices((prev) => ({ ...prev, [card.id]: '' }));
    } catch (err) {
      Alert.alert('Error saving card.');
      console.error(err);
    }
  };

  const renderItem = ({ item }: { item: Omit<CardForSale, 'price'> }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.name}</Text>
      <TextInput
        placeholder="Set price"
        style={styles.input}
        value={prices[item.id] || ''}
        onChangeText={(text) => setPrices((prev) => ({ ...prev, [item.id]: text }))}
        keyboardType="numeric"
      />
      <Button title="Add to Inventory" onPress={() => saveCard(item)} />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Cards to Inventory</Text>
      <FlatList
        data={mockCards}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 60 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#eee',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  input: {
    borderBottomWidth: 1,
    borderColor: '#aaa',
    marginVertical: 10,
    padding: 5,
  },
});
