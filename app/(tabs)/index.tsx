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
import { Plus, UtensilsCrossed } from 'lucide-react-native';
import { useRecipeStore } from '@/store/recipe-store';
import RecipeCard from '@/components/RecipeCard';
import EmptyState from '@/components/EmptyState';
import Colors from '@/constants/colors';
import { mockRecipes } from '@/mocks/recipes';

export default function RecipesScreen() {
  const router = useRouter();
  const { recipes, addRecipe } = useRecipeStore();

  // Add mock recipes on first load if no recipes exist
  useEffect(() => {
    if (recipes.length === 0) {
      mockRecipes.forEach((recipe) => {
        addRecipe(recipe);
      });
    }
  }, []);

  const handleAddRecipe = () => {
    router.push('/add-recipe');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.background}
      />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recipes</Text>
      </View>
      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RecipeCard recipe={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon={UtensilsCrossed}
            title="No recipes yet"
            message="Add your first recipe by tapping the + button"
          />
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddRecipe}
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
});
