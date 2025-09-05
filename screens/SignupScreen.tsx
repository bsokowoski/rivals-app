import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function SignupScreen() {
  const navigation = useNavigation<Nav>();
  const { login, isLoading } = useAuth(); // reuse login as mock sign-up
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const busy = isLoading || submitting;

  const onSubmit = async () => {
    if (!email.trim()) return;
    try {
      setSubmitting(true);
      // In a real app, call your signup API then log in.
      await login(email.trim(), password);
      navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0b0b0b', padding: 16, gap: 12, justifyContent: 'center' }}>
      <Text style={{ color: 'white', fontSize: 24, fontWeight: '800', marginBottom: 8 }}>
        Create account
      </Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#888"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{
          borderWidth: 1,
          borderColor: '#333',
          color: 'white',
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 10,
        }}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#888"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{
          borderWidth: 1,
          borderColor: '#333',
          color: 'white',
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 10,
        }}
      />

      <Pressable
        onPress={onSubmit}
        disabled={busy}
        style={{
          backgroundColor: busy ? '#6b7280' : '#10b981',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 12,
          alignItems: 'center',
          marginTop: 4,
        }}
      >
        {busy ? (
          <ActivityIndicator />
        ) : (
          <Text style={{ color: 'white', fontWeight: '800' }}>Sign up</Text>
        )}
      </Pressable>

      <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
        <Text style={{ color: '#9ca3af' }}>Already have an account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={{ color: '#93c5fd', fontWeight: '700' }}>Log in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
