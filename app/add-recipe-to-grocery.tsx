import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react-native';
import { useRecipeStore } from '@/store/recipe-store';
import { useGroceryStore } from '@/store/grocery-store';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Colors from '@/constants/colors';
import { ModalLayout } from '@/components/AnimatedLayout';

export default function AddRecipeToGroceryScreen() {
  const { recipeId, groceryListId } = useLocalSearchParams<{
    recipeId?: string;
    groceryListId?: string;
  }>();

  const router = useRouter();
  const { recipes, getRecipeById } = useRecipeStore();
  const { groceryLists, addIngredientsFromRecipe } =
    useGroceryStore();

  const [selectedRecipeId, setSelectedRecipeId] = useState(
    recipeId || ''
  );
  const [selectedListId, setSelectedListId] = useState(
    groceryListId || ''
  );
  const [servings, setServings] = useState(4);

  const selectedRecipe = selectedRecipeId
    ? getRecipeById(selectedRecipeId)
    : null;

  useEffect(() => {
    if (selectedRecipe) {
      setServings(selectedRecipe.servings);
    }
  }, [selectedRecipe]);

  const handleServingsChange = (newServings: number) => {
    if (newServings > 0) {
      setServings(newServings);
    }
  };

  const handleAddToGroceryList = () => {
    if (selectedRecipe && selectedListId) {
      addIngredientsFromRecipe(
        selectedListId,
        selectedRecipeId,
        selectedRecipe,
        servings
      );
      router.back();
    }
  };

  return (
    <ModalLayout>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={styles.title}>
              Add Recipe to Grocery List
            </Text>

            {!recipeId && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Select Recipe</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recipesContainer}
                >
                  {recipes.map((recipe) => (
                    <TouchableOpacity
                      key={recipe.id}
                      style={[
                        styles.recipeCard,
                        selectedRecipeId === recipe.id &&
                          styles.selectedRecipeCard,
                      ]}
                      onPress={() => setSelectedRecipeId(recipe.id)}
                    >
                      <Text
                        style={[
                          styles.recipeCardTitle,
                          selectedRecipeId === recipe.id &&
                            styles.selectedRecipeCardTitle,
                        ]}
                        numberOfLines={2}
                      >
                        {recipe.title}
                      </Text>
                      {selectedRecipeId === recipe.id && (
                        <View style={styles.checkIcon}>
                          <Check size={16} color="#FFFFFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {!groceryListId && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Select Grocery List
                </Text>
                {groceryLists.map((list) => (
                  <TouchableOpacity
                    key={list.id}
                    style={[
                      styles.listItem,
                      selectedListId === list.id &&
                        styles.selectedListItem,
                    ]}
                    onPress={() => setSelectedListId(list.id)}
                  >
                    <Text
                      style={[
                        styles.listItemTitle,
                        selectedListId === list.id &&
                          styles.selectedListItemTitle,
                      ]}
                    >
                      {list.name}
                    </Text>
                    {selectedListId === list.id && (
                      <Check size={20} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {selectedRecipe && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Adjust Servings
                </Text>
                <Card>
                  <View style={styles.servingsContainer}>
                    <TouchableOpacity
                      onPress={() =>
                        handleServingsChange(servings - 1)
                      }
                      disabled={servings <= 1}
                      style={[
                        styles.servingsButton,
                        servings <= 1 &&
                          styles.servingsButtonDisabled,
                      ]}
                    >
                      <ChevronLeft
                        size={20}
                        color={
                          servings <= 1
                            ? Colors.gray[300]
                            : Colors.primary
                        }
                      />
                    </TouchableOpacity>

                    <Text style={styles.servingsText}>
                      {servings} servings
                    </Text>

                    <TouchableOpacity
                      onPress={() =>
                        handleServingsChange(servings + 1)
                      }
                      style={styles.servingsButton}
                    >
                      <ChevronRight
                        size={20}
                        color={Colors.primary}
                      />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.servingsNote}>
                    Ingredient quantities will be adjusted accordingly
                  </Text>
                </Card>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <Button
                title="Cancel"
                onPress={() => router.back()}
                variant="outline"
                style={styles.cancelButton}
              />
              <Button
                title="Add to List"
                onPress={handleAddToGroceryList}
                disabled={!selectedRecipeId || !selectedListId}
                style={styles.submitButton}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ModalLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    color: Colors.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: Colors.text,
  },
  recipesContainer: {
    paddingBottom: 8,
  },
  recipeCard: {
    width: 150,
    height: 100,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  selectedRecipeCard: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  recipeCardTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  selectedRecipeCardTitle: {
    color: Colors.primary,
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  selectedListItem: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  selectedListItemTitle: {
    color: Colors.primary,
  },
  servingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  servingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingsButtonDisabled: {
    opacity: 0.5,
  },
  servingsText: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 16,
    color: Colors.text,
  },
  servingsNote: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  submitButton: {
    flex: 1,
    marginLeft: 8,
  },
});
