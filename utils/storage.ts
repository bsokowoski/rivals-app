// utils/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function setJSON<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore write errors
  }
}

/** Clear all Rivals persisted state in one call */
export async function clearRivalsStorage() {
  try {
    await AsyncStorage.multiRemove([
      'rivals.auth.v1',
      'rivals.cart.v1',
      'rivals.orders.v1',
    ]);
  } catch {
    // ignore
  }
}
