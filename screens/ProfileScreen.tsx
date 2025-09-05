// File: screens/ProfileScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
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

type PartialUser = {
  email?: string | null;
  displayName?: string | null;
  uid?: string | null;
};

export default function ProfileScreen() {
  const navigation = useNavigation<any>();

  // ✅ Safely consume Auth without crashing if provider isn't mounted
  let auth: { user?: PartialUser; signOut?: () => Promise<void> | void } = {};
  try {
    auth = (useAuth?.() as any) ?? {};
  } catch {
    auth = {};
  }
  const { user, signOut } = auth;

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

  // ✅ Check if a route exists anywhere up the navigator tree
  const hasRoute = (name: string) => {
    try {
      const seen = new Set<any>();
      const collect = (nav: any): string[] => {
        if (!nav || seen.has(nav)) return [];
        seen.add(nav);
        const state = nav.getState?.();
        const names = state?.routeNames ?? [];
        const parent = nav.getParent?.();
        return parent ? [...names, ...collect(parent)] : names;
      };
      const names = collect(navigation);
      return Array.isArray(names) && names.includes(name);
    } catch {
      return false;
    }
  };

  // ✅ Guarded navigate (no crash if route missing)
  const safeNavigate = (name: string, params?: any) => {
    if (hasRoute(name)) {
      try {
        navigation.navigate(name as never, params as never);
      } catch {
        Alert.alert('Coming soon', 'This section is not available in this build.');
      }
    } else {
      Alert.alert('Coming soon', 'This section is not available in this build.');
    }
  };

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
            // If signOut is not available or fails, just notify
          } finally {
            Alert.alert('Signed out', 'You have been signed out.');
            // Go somewhere safe
            try {
              navigation.navigate('Tabs', { screen: 'Home' });
            } catch {
              // noop
            }
          }
        },
      },
    ]);
  };

  const handleSecretAdminGate = () => {
    safeNavigate('AdminGate');
  };

  const typedUser: PartialUser | undefined = useMemo(() => {
    if (!user) return undefined;
    return {
      email: user.email ?? null,
      displayName: user.displayName ?? null,
      uid: user.uid ?? null,
    };
  }, [user]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      {/* Long-press to open AdminGate */}
      <TouchableOpacity activeOpacity={1} onLongPress={handleSecretAdminGate} delayLongPress={600}>
        <Text style={styles.title}>Profile</Text>
      </TouchableOpacity>

      {typedUser ? (
        <View style={styles.card}>
          {typedUser.displayName ? (
            <>
              <Text style={styles.label}>Name</Text>
              <Text style={styles.value}>{typedUser.displayName}</Text>
            </>
          ) : null}

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

          {!typedUser.email && !typedUser.uid && (
            <Text style={styles.value}>Signed in</Text>
          )}
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.value}>Not logged in</Text>
          {/* Optional: show Login only if route exists */}
          {hasRoute('Login') && (
            <TouchableOpacity style={[styles.btn, styles.primary]} onPress={() => safeNavigate('Login')}>
              <Text style={styles.btnText}>Log In</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Order History (only if route exists) */}
      <TouchableOpacity
        style={[styles.btn, hasRoute('OrderHistory') ? styles.primary : styles.disabled]}
        onPress={() => safeNavigate('OrderHistory')}
        activeOpacity={0.85}
      >
        <Text style={styles.btnText}>Order History</Text>
      </TouchableOpacity>

      {/* Admin-only entry */}
      {isAdmin && (
        <TouchableOpacity
          style={[styles.btn, styles.adminBtn, hasRoute('SellerDashboard') ? null : styles.disabled]}
          onPress={() => safeNavigate('SellerDashboard')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>Seller Tools</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.btn} onPress={handleLogout} activeOpacity={0.85}>
        <Text style={styles.btnText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

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
  primary: { backgroundColor: '#ef4444' },
  adminBtn: { backgroundColor: '#ef4444' },
  disabled: { opacity: 0.55 },
  btnText: { color: '#fff', fontWeight: '700' },
});
