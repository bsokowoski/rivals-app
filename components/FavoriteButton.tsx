// File: components/FavoriteButton.tsx
import React from 'react';
import { TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFavorites } from '../contexts/FavoritesContext';

interface Props {
  productId: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  onToggle?: (nextIsFavorite: boolean) => void;
}

const FavoriteButton: React.FC<Props> = ({ productId, size = 24, style, onToggle }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(productId);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={fav ? 'Remove from favorites' : 'Add to favorites'}
      onPress={() => {
        toggleFavorite(productId);
        onToggle?.(!fav);
      }}
      style={style}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons
        name={fav ? 'heart' : 'heart-outline'}
        size={size}
        color={fav ? '#ef4444' : '#6b7280'}
      />
    </TouchableOpacity>
  );
};

export default FavoriteButton;
