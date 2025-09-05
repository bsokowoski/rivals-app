// contexts/AuthContext.tsx
import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';

export type User = {
  id: string;
  email: string;
  name?: string;
  verified: boolean;
  rewardsPoints?: number;
};

type AuthContextValue = {
  user: User | null;
  signIn: (email: string, name?: string) => void;
  signOut: () => void;
  verifyEmail: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const signIn = (email: string, name?: string) => {
    const u: User = {
      id: 'u_' + Math.random().toString(36).slice(2, 10),
      email: email.trim().toLowerCase(),
      name: name?.trim() || 'Rivals Trainer',
      verified: false,
      rewardsPoints: 0,
    };
    setUser(u);
  };

  const signOut = () => setUser(null);

  const verifyEmail = () => {
    if (!user) return;
    setUser({ ...user, verified: true, rewardsPoints: (user.rewardsPoints ?? 0) + 50 });
  };

  const value = useMemo(() => ({ user, signIn, signOut, verifyEmail }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
