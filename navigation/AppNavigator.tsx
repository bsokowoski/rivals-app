import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import TabNavigator from './TabNavigator';
import NotAuthorizedScreen from '../screens/NotAuthorizedScreen';
import SellerDashboardScreen from '../screens/SellerDashboardScreen';
import SalesStatsScreen from '../screens/SalesStatsScreen';
import ProductDetailsScreen from '../screens/ProductDetailsScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrderConfirmationScreen from '../screens/OrderConfirmationScreen';

import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { CartProvider } from '../contexts/CartContext';
import { InventoryProvider } from '../contexts/InventoryContext';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function useIsSeller() {
  const { user } = useAuth();
  const role = (user as any)?.role;
  const isSellerFlag = (user as any)?.isSeller;
  return Boolean((role && String(role).toLowerCase() === 'seller') || isSellerFlag);
}

export default function AppNavigator() {
  const isSeller = useIsSeller();
  return (
    <NavigationContainer
      theme={{ ...DefaultTheme, colors: { ...DefaultTheme.colors, background: '#0b0b0b' } }}
    >
      <AuthProvider>
        <CartProvider>
          <InventoryProvider>
            <Stack.Navigator
              id={undefined}
              screenOptions={{
                headerStyle: { backgroundColor: '#0b0b0b' },
                headerTintColor: 'white',
              }}
            >
              <Stack.Screen
                name="Tabs"
                component={TabNavigator}
                options={{ headerShown: false }}
              />

              <Stack.Screen
                name="ProductDetails"
                component={ProductDetailsScreen}
                options={{ title: 'Details' }}
              />

              <Stack.Screen
                name="Checkout"
                component={CheckoutScreen}
                options={{ title: 'Checkout' }}
              />

              <Stack.Screen
                name="OrderConfirmation"
                component={OrderConfirmationScreen}
                options={{ title: 'Thank you!' }}
              />

              {/* Gates use render-prop form so navigation/route are forwarded */}
              <Stack.Screen
                name="SellerDashboard"
                options={{ title: 'Seller Dashboard' }}
              >
                {(props) =>
                  isSeller ? (
                    <SellerDashboardScreen {...(props as any)} />
                  ) : (
                    <NotAuthorizedScreen {...(props as any)} />
                  )
                }
              </Stack.Screen>

              <Stack.Screen name="SalesStats" options={{ title: 'Sales Stats' }}>
                {(props) =>
                  isSeller ? (
                    <SalesStatsScreen {...(props as any)} />
                  ) : (
                    <NotAuthorizedScreen {...(props as any)} />
                  )
                }
              </Stack.Screen>
            </Stack.Navigator>
          </InventoryProvider>
        </CartProvider>
      </AuthProvider>
    </NavigationContainer>
  );
}
