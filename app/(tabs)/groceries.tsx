import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, ShoppingCart } from 'lucide-react-native';
import { useGroceryStore } from '@/store/grocery-store';
import GroceryListCard from '@/components/GroceryListCard';
import EmptyState from '@/components/EmptyState';
import Colors from '@/constants/colors';
import { mockGroceryLists } from '@/mocks/groceryLists';

export default function GroceriesScreen() {
  const router = useRouter();
  const { groceryLists, addGroceryList } = useGroceryStore();

  // Add mock grocery lists on first load if no lists exist
  useEffect(() => {
    if (groceryLists.length === 0) {
      mockGroceryLists.forEach((list) => {
        // We need to manually add each list since our addGroceryList function
        // only takes a name parameter
        addGroceryList(list.name);

        // Update the last added list with the mock items
        const lastIndex = groceryLists.length;
        if (lastIndex > 0) {
          const lastList = groceryLists[lastIndex - 1];
          list.items.forEach((item) => {
            // This is a workaround since we don't have a direct way to add items with IDs
            useGroceryStore.getState().addGroceryItem(lastList.id, {
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
              checked: item.checked,
            });
          });
        }
      });
    }
  }, []);

  const handleAddGroceryList = () => {
    router.push('/add-grocery-list');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.background}
      />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Groceries</Text>
      </View>
      <FlatList
        data={groceryLists}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GroceryListCard groceryList={item} />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon={ShoppingCart}
            title="No grocery lists yet"
            message="Create your first grocery list by tapping the + button"
          />
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddGroceryList}
        activeOpacity={0.8}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
