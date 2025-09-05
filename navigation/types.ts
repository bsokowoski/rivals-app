// navigation/types.ts
import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootTabParamList = {
  Home: undefined;
  Inventory: undefined;
  Cart: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<RootTabParamList>;
  ProductDetails: { productId: string };
  Checkout: undefined;
  OrderConfirmation: { orderId?: string };
  SellerDashboard: undefined;
  SalesStats: undefined;
  AddCard: undefined;
  EditCard: { id: string }; // NEW
};
