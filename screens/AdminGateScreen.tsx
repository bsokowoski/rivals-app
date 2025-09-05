// File: screens/AdminGateScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

// 🔐 Centralized function for admin password
const getAdminPassword = (): string => 'Beckblair711!';

// Storage key for the “authorized” flag
const STORAGE_KEY = 'admin:authorized';

const AdminGateScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [pass, setPass] = useState('');
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Auto-bypass if already authorized
  useEffect(() => {
    (async () => {
      try {
        const val = await AsyncStorage.getItem(STORAGE_KEY);
        if (val === 'true') {
          navigation.replace('SellerDashboard');
          return;
        }
      } catch {}
      setChecking(false);
    })();
  }, [navigation]);

  const handleSubmit = async () => {
    if (!pass.trim()) return;
    try {
      setSubmitting(true);
      if (pass.trim() === getAdminPassword()) {
        await AsyncStorage.setItem(STORAGE_KEY, 'true');
        navigation.replace('SellerDashboard');
      } else {
        Alert.alert('Access Denied', 'Incorrect admin password.');
      }
    } catch {
      Alert.alert('Error', 'Unable to verify password right now.');
    } finally {
      setSubmitting(false);
      setPass('');
    }
  };

  if (checking) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{ color: '#9ca3af' }}>Checking access…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <View style={[styles.container, styles.center, { padding: 16 }]}>
        <Text style={styles.title}>Admin Access</Text>
        <Text style={styles.subtitle}>
          Enter the admin password to access seller tools.
        </Text>

        <TextInput
          placeholder="Admin password"
          placeholderTextColor="#6b7280"
          style={styles.input}
          value={pass}
          onChangeText={setPass}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={handleSubmit}
        />

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: pass ? '#ef4444' : '#1f2937' }]}
          onPress={handleSubmit}
          disabled={!pass || submitting}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>{submitting ? 'Verifying…' : 'Unlock'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: '#1f2937', marginTop: 10 }]}
          onPress={async () => {
            await AsyncStorage.removeItem(STORAGE_KEY);
            Alert.alert('Reset', 'Admin lock has been reset on this device.');
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>Reset Admin Lock (This Device)</Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          Tip: I can also gate specific **buttons** behind this flag so deep links can’t bypass it.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0c' },
  center: { alignItems: 'center', justifyContent: 'center' },

  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  subtitle: { color: '#9ca3af', marginTop: 6, marginBottom: 16, textAlign: 'center' },

  input: {
    width: '100%',
    backgroundColor: '#0f1012',
    borderColor: '#1f2937',
    borderWidth: 1,
    color: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },

  btn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700' },

  note: {
    color: '#9ca3af',
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AdminGateScreen;
