import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useUser } from '../contexts/UserContext';
import { useProducts } from '../contexts/ProductContext';
import { StackNavigationProp } from '@react-navigation/stack';

const EditProductScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'EditProduct'>>();
  const { product } = route.params;
  const { user } = useUser();
  const { updateProduct } = useProducts();

  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(String(product.price));
  const [description, setDescription] = useState(product.description);
  const [imageUrl, setImageUrl] = useState(product.imageUrl);

  const handleSave = () => {
    if (!user?.id) return;
    updateProduct({
      ...product,
      name,
      price: parseFloat(price),
      description,
      imageUrl,
      sellerId: user.id,
    });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <TextInput value={name} onChangeText={setName} placeholder="Name" style={styles.input} />
      <TextInput
        value={price}
        onChangeText={setPrice}
        placeholder="Price"
        keyboardType="numeric"
        style={styles.input}
      />
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Description"
        style={styles.input}
      />
      <TextInput value={imageUrl} onChangeText={setImageUrl} placeholder="Image URL" style={styles.input} />
      <Button title="Save Changes" onPress={handleSave} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
  },
});

export default EditProductScreen;
