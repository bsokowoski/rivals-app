// services/collection.ts
// Local AsyncStorage-backed "My Collection" service (no external APIs).

import type { InventoryItem } from '../contexts/InventoryContext';

type AsyncStorageLike = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem?(key: string): Promise<void>;
};

let memCache: InventoryItem[] = []; // fallback if AsyncStorage not available

// Lazy-load to avoid issues in non-RN contexts; handle both default and namespace exports
let AsyncStorage: AsyncStorageLike | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('@react-native-async-storage/async-storage');
  const asAny = (mod?.default ?? mod) as any;
  if (asAny && typeof asAny.getItem === 'function' && typeof asAny.setItem === 'function') {
    AsyncStorage = asAny as AsyncStorageLike;
  }
} catch {
  AsyncStorage = null;
}

const KEY = '@rivals.myCollection';

async function readStorage(): Promise<InventoryItem[]> {
  if (!AsyncStorage) return memCache;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as InventoryItem[]) : [];
  } catch {
    return [];
  }
}

async function writeStorage(items: InventoryItem[]): Promise<void> {
  if (!AsyncStorage) {
    memCache = items.slice();
    return;
  }
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // ignore write errors
  }
}

export async function getCollection(): Promise<InventoryItem[]> {
  return readStorage();
}

export async function setCollection(items: InventoryItem[]): Promise<void> {
  await writeStorage(items);
}

export async function upsertItem(item: InventoryItem): Promise<void> {
  const list = await readStorage();
  const idx = list.findIndex((i) => i.id === item.id);
  if (idx >= 0) list[idx] = { ...list[idx], ...item };
  else list.push(item);
  await writeStorage(list);
}

export async function removeItem(id: string): Promise<void> {
  const list = await readStorage();
  const next = list.filter((i) => i.id !== id);
  await writeStorage(next);
}

export async function clearCollection(): Promise<void> {
  await writeStorage([]);
}

const CollectionService = {
  getCollection,
  setCollection,
  upsertItem,
  removeItem,
  clearCollection,
};

export default CollectionService;
