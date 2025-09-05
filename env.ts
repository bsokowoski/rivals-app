// env.ts — client-safe env access (Expo reads EXPO_PUBLIC_* at runtime)
export const INVENTORY_URL =
  process.env.EXPO_PUBLIC_INVENTORY_URL ?? '';

export const ADMIN_BULK_UPSERT_URL =
  process.env.EXPO_PUBLIC_ADMIN_BULK_UPSERT_URL ?? '';

export const ADMIN_REPLACE_URL =
  process.env.EXPO_PUBLIC_ADMIN_REPLACE_URL ?? '';

/**
 * Avoid shipping real admin tokens in the client.
 * Leave this empty unless your server explicitly requires it for a demo/dev flow.
 */
export const ADMIN_TOKEN =
  process.env.EXPO_PUBLIC_ADMIN_TOKEN ?? '';
