// screens/ProfileScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';

const ADMIN_FLAG = 'admin:authorized';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  // Be defensive about the AuthContext shape
  const { user, signOut } =
    (typeof useAuth === 'function' ? useAuth?.() : { user: undefined }) as {
      user?: unknown;
      signOut?: () => Promise<void> | void;
    };

  const typedUser = user as
    | {
        email?: string | null;
        displayName?: string | null;
        uid?: string;
      }
    | undefined;

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const val = await AsyncStorage.getItem(ADMIN_FLAG);
        setIsAdmin(val === 'true');
      } catch {
        setIsAdmin(false);
      }
    })();
  }, []);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut?.();
          } catch {
            Alert.alert('Error', 'Sign out failed.');
          }
        },
      },
    ]);
  };

  const handleSecretAdminGate = () => {
    // Hidden entry: long-press on title opens the admin gate
    navigation.navigate('AdminGate');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      {/* Long-press to open AdminGate */}
      <TouchableOpacity
        activeOpacity={1}
        onLongPress={handleSecretAdminGate}
        delayLongPress={600}
      >
        <Text style={styles.title}>Profile</Text>
      </TouchableOpacity>

      {typedUser ? (
        <View style={styles.card}>
          {typedUser.email ? (
            <>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{typedUser.email}</Text>
            </>
          ) : null}

          {typedUser.uid ? (
            <>
              <Text style={styles.label}>UID</Text>
              <Text style={styles.value}>{typedUser.uid}</Text>
            </>
          ) : null}

          {!typedUser.email && !typedUser.uid ? (
            <Text style={styles.value}>Signed in</Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.value}>Not logged in</Text>
        </View>
      )}

      {/* NEW: Order History button */}
      <TouchableOpacity
        style={styles.btn}
        onPress={() => navigation.navigate('OrderHistory')}
        activeOpacity={0.85}
      >
        <Text style={styles.btnText}>Order History</Text>
      </TouchableOpacity>

      {/* Admin-only entries */}
      {isAdmin && (
        <>
          <TouchableOpacity
            style={[styles.btn, styles.adminBtn]}
            onPress={() => navigation.navigate('SellerDashboard')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>Seller Tools</Text>
          </TouchableOpacity>

          {/* ⬅️ NEW: Import Inventory (CSV) */}
          <TouchableOpacity
            style={[styles.btn, styles.adminBtn]}
            onPress={() => navigation.navigate('CsvImport')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>Import Inventory (CSV)</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        style={styles.btn}
        onPress={handleLogout}
        activeOpacity={0.85}
      >
        <Text style={styles.btnText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0c' },
  title: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 16 },

  card: {
    backgroundColor: '#111216',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  label: { color: '#9ca3af', marginBottom: 4 },
  value: { color: '#fff', fontWeight: '700', marginBottom: 12 },

  btn: {
    backgroundColor: '#1f2937',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  adminBtn: { backgroundColor: '#ef4444' },
  btnText: { color: '#fff', fontWeight: '700' },
});

export default ProfileScreen;
