import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AuthUser = {
  id: string;
  email?: string;
  name?: string;
  role?: 'buyer' | 'seller' | 'admin';
  isSeller?: boolean;
};

export type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = '@rivals.auth.user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // hydrate from storage
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as AuthUser;
          setUser(parsed ?? null);
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const persist = async (u: AuthUser | null) => {
    try {
      if (u) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      else await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
  };

  const login = async (email: string, _password: string) => {
    // In real app: call your auth API here.
    // For dev, build a user object and mark as seller if email hints it.
    const isSeller =
      /seller|admin|rivals/i.test(email) || email.endsWith('@rivals.tcg');

    const u: AuthUser = {
      id: `${Date.now()}`,
      email,
      name: email.split('@')[0],
      role: isSeller ? 'seller' : 'buyer',
      isSeller,
    };
    setUser(u);
    await persist(u);
  };

  const logout = async () => {
    setUser(null);
    await persist(null);
  };

  const value: AuthContextValue = {
    user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
