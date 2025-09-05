// navigation/types.ts
export type RootStackParamList = {
  // Core app
  Tabs: undefined;
  ProductDetails: { id?: string } | undefined;
  Checkout: undefined;
  OrderConfirmation: { orderId?: string } | undefined;

  // Seller/admin
  SellerDashboard: undefined;
  SalesStats: undefined;
  CsvImport: undefined; // <— NEW: admin import screen

  // Legacy / referenced elsewhere (to satisfy TS in existing screens)
  AddCard: undefined;
  EditCard: { id?: string } | undefined;

  // Auth/entry routes referenced by some screens
  Main: undefined;
  Signup: undefined;
  Login: undefined;

  // Collection feature
  Collection: undefined;

  // Edit product
  EditProduct: { productId?: string } | undefined;
};
