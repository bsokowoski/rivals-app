import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function SellerDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0b0b0b' }}
      contentContainerStyle={{ padding: 16, gap: 16 }}
    >
      <View style={{ gap: 6 }}>
        <Text style={{ color: 'white', fontSize: 22, fontWeight: '800' }}>
          Seller Dashboard
        </Text>
        <Text style={{ color: '#9ca3af' }}>
          {user?.name ?? user?.email ?? 'Seller'} • {user?.role ?? 'seller'}
        </Text>
      </View>

      <View style={{ backgroundColor: '#111827', padding: 16, borderRadius: 12, gap: 12 }}>
        <Text style={{ color: 'white', fontWeight: '700' }}>Inventory</Text>
        <Text style={{ color: '#9ca3af' }}>
          Import your latest Collectr CSV to replace or merge inventory.
        </Text>

        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          <Pressable
            onPress={() => navigation.navigate('CsvImport')}
            style={{ backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 }}
          >
            <Text style={{ color: 'white', fontWeight: '800' }}>Open CSV Import</Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('SalesStats')}
            style={{ backgroundColor: '#0ea5e9', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 }}
          >
            <Text style={{ color: 'white', fontWeight: '800' }}>View Sales Stats</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
