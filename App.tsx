// App.tsx
import 'react-native-gesture-handler';
import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StripeProvider } from '@stripe/stripe-react-native';

// contexts
import { CartProvider } from './contexts/CartContext';

// screens
import HomeScreen from './screens/HomeScreen';
import InventoryScreen from './screens/InventoryScreen';
// ✂️ MarketWatchScreen removed
import FavoritesScreen from './screens/FavoritesScreen';
import CartScreen from './screens/CartScreen';
import ProfileScreen from './screens/ProfileScreen';
import ProductDetailsScreen from './screens/ProductDetailsScreen';

type RootStackParamList = {
  Tabs: undefined;
  // Our ProductDetails screen expects a full product object passed from Inventory
  ProductDetails: { product: any };
};

type TabParamList = {
  Home: undefined;
  Inventory: undefined;
  // ✂️ MarketWatch removed
  Favorites: undefined;
  Cart: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Inventory" component={InventoryScreen} />
      {/* ✂️ Market Watch tab removed */}
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function MissingStripeKeyNotice() {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Stripe key not found</Text>
      <Text style={styles.muted}>
        Set <Text style={styles.code}>EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY</Text> in your EAS
        environment (development/preview) or a local env file before running the app.
      </Text>
    </View>
  );
}

export default function App() {
  // Publishable key is safe to expose in the client (we set it via EAS env)
  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';

  // In dev, show a friendly message if the key is missing.
  // In preview/production, you should always have this set via EAS Env.
  if (__DEV__ && !publishableKey) {
    return <MissingStripeKeyNotice />;
  }

  return (
    <CartProvider>
      <StripeProvider
        publishableKey={publishableKey}
        // Optional: set if you plan to support Apple Pay / URL redirects
        // merchantIdentifier="merchant.com.rivalstcg.rivalsapp"
        // urlScheme="rivalsapp"
      >
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
            <Stack.Screen
              name="ProductDetails"
              component={ProductDetailsScreen}
              options={{ title: 'Details' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </StripeProvider>
    </CartProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#0B0B0B',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  muted: { color: '#9CA3AF', fontSize: 14, textAlign: 'center' },
  code: { color: '#E11D48', fontWeight: '700' },
});
