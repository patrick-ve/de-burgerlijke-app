import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Plus, Trash2, UtensilsCrossed } from 'lucide-react-native';
import { useGroceryStore } from '@/store/grocery-store';
import GroceryItem from '@/components/GroceryItem';
import Button from '@/components/Button';
import Colors from '@/constants/colors';
import { CardLayout } from '@/components/AnimatedLayout';

export default function GroceryListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    getGroceryListById,
    addGroceryItem,
    toggleGroceryItem,
    deleteGroceryItem,
    deleteGroceryList,
  } = useGroceryStore();

  const groceryList = getGroceryListById(id);

  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('');

  if (!groceryList) {
    return (
      <CardLayout>
        <View style={styles.container}>
          <Text style={styles.errorText}>Grocery list not found</Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            style={{ marginTop: 16 }}
          />
        </View>
      </CardLayout>
    );
  }

  const handleAddItem = () => {
    if (newItemName.trim()) {
      addGroceryItem(id, {
        name: newItemName,
        quantity: parseFloat(newItemQuantity) || 0,
        unit: newItemUnit,
        checked: false,
      });
      setNewItemName('');
      setNewItemQuantity('');
      setNewItemUnit('');
    }
  };

  const handleDeleteList = () => {
    deleteGroceryList(id);
    router.back();
  };

  const handleAddRecipe = () => {
    router.push({
      pathname: '/add-recipe-to-grocery',
      params: { groceryListId: id },
    });
  };

  // Sort items: unchecked first, then checked
  const sortedItems = [...groceryList.items].sort((a, b) => {
    if (a.checked === b.checked) return 0;
    return a.checked ? 1 : -1;
  });

  return (
    <CardLayout>
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: groceryList.name,
            headerRight: () => (
              <TouchableOpacity
                onPress={handleDeleteList}
                style={{ marginRight: 8 }}
              >
                <Trash2 size={20} color={Colors.error} />
              </TouchableOpacity>
            ),
          }}
        />

        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={100}
        >
          <FlatList
            data={sortedItems}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <GroceryItem
                item={item}
                onToggle={(itemId) => toggleGroceryItem(id, itemId)}
                onDelete={(itemId) => deleteGroceryItem(id, itemId)}
              />
            )}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <Button
                title="Add Items from Recipe"
                onPress={handleAddRecipe}
                variant="outline"
                fullWidth
                style={styles.addRecipeButton}
                size="medium"
              />
            }
          />

          <View style={styles.inputContainer}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.nameInput}
                placeholder="Item name"
                value={newItemName}
                onChangeText={setNewItemName}
                returnKeyType="next"
              />
              <TextInput
                style={styles.quantityInput}
                placeholder="Qty"
                value={newItemQuantity}
                onChangeText={setNewItemQuantity}
                keyboardType="numeric"
                returnKeyType="next"
              />
              <TextInput
                style={styles.unitInput}
                placeholder="Unit"
                value={newItemUnit}
                onChangeText={setNewItemUnit}
                returnKeyType="done"
                onSubmitEditing={handleAddItem}
              />
            </View>
            <TouchableOpacity
              style={[
                styles.addButton,
                !newItemName.trim() && styles.addButtonDisabled,
              ]}
              onPress={handleAddItem}
              disabled={!newItemName.trim()}
            >
              <Plus size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </CardLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  addRecipeButton: {
    marginBottom: 16,
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    backgroundColor: Colors.background,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  nameInput: {
    flex: 3,
    height: 48,
    backgroundColor: Colors.gray[100],
    borderRadius: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    fontSize: 16,
    color: Colors.text,
  },
  quantityInput: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.gray[100],
    borderRadius: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
  },
  unitInput: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.gray[100],
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.text,
  },
  addButton: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: Colors.gray[300],
  },
  errorText: {
    fontSize: 18,
    color: Colors.text,
    textAlign: 'center',
  },
});
