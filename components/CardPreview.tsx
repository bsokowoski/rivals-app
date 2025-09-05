import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface CardProps {
  name: string;
  imageUrl: string;
}

export default function CardPreview({ name, imageUrl }: CardProps) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: imageUrl }} style={styles.image} />
      <Text style={styles.text}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    marginVertical: 10,
  },
  image: {
    width: 150,
    height: 210,
    borderRadius: 10,
  },
  text: {
    marginTop: 8,
    fontWeight: '600',
  },
});
