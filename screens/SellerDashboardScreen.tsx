// screens/SellerDashboardScreen.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SellerDashboard'>;

export default function SellerDashboardScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seller Dashboard</Text>

      <Pressable
        style={styles.primary}
        onPress={() => navigation.navigate('AddCard')}
      >
        <Text style={styles.primaryText}>+ Add Card</Text>
      </Pressable>

      <View style={{ height: 12 }} />

      <Pressable
        style={styles.secondary}
        onPress={() => navigation.navigate('SalesStats')}
      >
        <Text style={styles.secondaryText}>View Sales Stats</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 16 },
  primary: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  secondary: {
    backgroundColor: '#111827',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
