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

  // Legacy / referenced elsewhere (to satisfy TS in existing screens)
  AddCard: undefined;
  EditCard: { id?: string } | undefined;

  // Auth/entry routes referenced by some screens
  Main: undefined;
  Signup: undefined;
  Login: undefined;

  // Collection feature (referenced by CollectionScreen)
  Collection: undefined;

  // Edit product (referenced by EditProductScreen)
  EditProduct: { productId?: string } | undefined;
};
