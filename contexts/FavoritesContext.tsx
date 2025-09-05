// File: contexts/FavoritesContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext'; // same-folder import

export type FavoritesContextType = {
  favorites: Set<string>;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  clearFavorites: () => void;
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const storageKeyFor = (userId: string) => `favorites:${userId || 'guest'}`;

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Safe access even if AuthProvider isn't mounted yet
  const { user } = (typeof useAuth === 'function' ? useAuth?.() : { user: undefined }) as any;
  const userId = user?.uid ?? 'guest';

  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Load favorites whenever the signed-in user changes
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKeyFor(userId));
        if (!isMounted) return;
        if (raw) {
          const arr: string[] = JSON.parse(raw);
          setFavorites(new Set(arr));
        } else {
          setFavorites(new Set());
        }
      } catch (e) {
        console.warn('Failed to load favorites', e);
        setFavorites(new Set());
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Persist favorites on change
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(
          storageKeyFor(userId),
          JSON.stringify(Array.from(favorites))
        );
      } catch (e) {
        console.warn('Failed to persist favorites', e);
      }
    })();
  }, [favorites, userId]);

  const isFavorite = useCallback((id: string) => favorites.has(id), [favorites]);

  const addFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearFavorites = useCallback(() => setFavorites(new Set()), []);

  const value = useMemo(
    () => ({
      favorites,
      isFavorite,
      toggleFavorite,
      addFavorite,
      removeFavorite,
      clearFavorites,
    }),
    [favorites, isFavorite, toggleFavorite, addFavorite, removeFavorite, clearFavorites]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

export function useFavorites(): FavoritesContextType {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
