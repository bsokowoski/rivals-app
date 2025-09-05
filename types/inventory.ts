export type InventoryItem = {
  id: string;
  sku: string;
  name: string;
  set?: string;
  number?: string;
  rarity?: string;
  condition?: string;
  price?: number;
  quantity: number;
  imageUrl?: string;
  [key: string]: any;
};
