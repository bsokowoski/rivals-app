// components/RivalsHeader.tsx
import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Image } from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '../theme';
import { useCart } from '../contexts/CartContext';
import type { RootStackParamList } from '../navigation/types';

type Props = {
  title?: string;
  showBack?: boolean;
  showCart?: boolean;
};

const RivalsHeader: React.FC<Props> = ({ title, showBack, showCart = true }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { totalCount } = useCart();

  return (
    <View style={styles.wrapper}>
      <View style={styles.bar}>
        {/* Left */}
        <View style={styles.left}>
          {showBack ? (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.iconBtn}
            >
              <Ionicons name="chevron-back" size={22} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 22 }} />
          )}
        </View>

        {/* Center */}
        <View style={styles.center}>
          <Image
            source={require('../assets/rivals-logo.png')}
            resizeMode="contain"
            style={styles.logo}
          />
          {!!title && title !== 'Home' && (
            <Text numberOfLines={1} style={styles.subtitle}>
              {title}
            </Text>
          )}
        </View>

        {/* Right */}
        <View style={styles.right}>
          {showCart && (
            <TouchableOpacity
              onPress={() => navigation.navigate('Tabs', { screen: 'Cart' } as any)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.iconBtn}
            >
              <Ionicons name="cart-outline" size={22} />
              {totalCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{totalCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

export default RivalsHeader;

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingTop: Platform.select({ ios: 8, android: 8, default: 8 }),
  },
  bar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    justifyContent: 'space-between',
  },
  left: { width: 48, alignItems: 'flex-start' },
  right: { width: 48, alignItems: 'flex-end' },
  center: { flex: 1, alignItems: 'center' },
  logo: { height: 28, width: 120 }, // adjust width to your logo ratio
  subtitle: { fontSize: 12, color: colors.textMuted },
  iconBtn: { position: 'relative', padding: 6, borderRadius: 999 },
  badge: {
    position: 'absolute',
    right: 0,
    top: 0,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: 'white', fontSize: 10, fontWeight: '700' },
});
