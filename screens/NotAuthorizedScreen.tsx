// screens/NotAuthorizedScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function NotAuthorizedScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Not Authorized</Text>
      <Text style={styles.subtitle}>
        You don’t have permission to access this area.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
});
