// File: screens/ScannerScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

const ScannerScreen: React.FC = () => {
  const [scanning, setScanning] = useState(false);

  const handleStartScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      Alert.alert(
        'Scan Complete',
        'Detected product ID: svpe-umbreon-sir',
        [
          { text: 'Cancel' },
          { text: 'Add to Drafts', onPress: () => console.log('TODO: save draft') },
        ]
      );
    }, 2000); // mock 2s scanning
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scanner</Text>
      <View style={styles.scanBox}>
        {scanning ? (
          <Text style={styles.scanningText}>Scanning…</Text>
        ) : (
          <Text style={styles.idleText}>Camera Idle</Text>
        )}
      </View>
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: scanning ? '#1f2937' : '#ef4444' }]}
        onPress={handleStartScan}
        disabled={scanning}
        activeOpacity={0.85}
      >
        <Text style={styles.btnText}>{scanning ? 'Scanning…' : 'Start Scan'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0c', padding: 16, justifyContent: 'center' },
  title: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 20, textAlign: 'center' },

  scanBox: {
    height: 250,
    backgroundColor: '#111216',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  scanningText: { color: '#ef4444', fontSize: 18, fontWeight: '700' },
  idleText: { color: '#9ca3af', fontSize: 16 },

  btn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default ScannerScreen;
