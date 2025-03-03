import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Trash2,
  Check,
  Circle,
  CircleDashed,
} from 'lucide-react-native';
import { useRecipeStore } from '@/store/recipe-store';
import Button from '@/components/Button';
import Colors from '@/constants/colors';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    getRecipeById,
    updateServings,
    deleteRecipe,
    toggleInstructionCompletion,
    updateRecipe,
  } = useRecipeStore();

  const recipe = getRecipeById(id);
  const [activeTab, setActiveTab] = useState<
    'ingredients' | 'instructions'
  >('ingredients');
  const [servings, setServings] = useState(recipe?.servings || 4);

  if (!recipe) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Recipe not found</Text>
        <Button
          title="Go Back"
          onPress={() => router.back()}
          style={{ marginTop: 16 }}
        />
      </View>
    );
  }

  const handleServingsChange = (newServings: number) => {
    if (newServings > 0) {
      setServings(newServings);
      updateServings(id, newServings);
    }
  };

  const handleAddToGroceryList = () => {
    router.push({
      pathname: '/add-recipe-to-grocery',
      params: { recipeId: id },
    });
  };

  const handleDeleteRecipe = () => {
    deleteRecipe(id);
    router.back();
  };

  const handleToggleInstructionCompletion = (index: number) => {
    if (recipe) {
      const isCompleted =
        recipe.completedInstructions?.includes(index) || false;

      // If trying to uncomplete a step, check if there are later completed steps
      if (isCompleted) {
        const hasLaterCompletedSteps =
          recipe.completedInstructions.some(
            (completedIndex) => completedIndex > index
          );

        if (hasLaterCompletedSteps) {
          // Show alert explaining why the step can't be uncompleted
          Alert.alert(
            "Can't Uncomplete Step",
            'You need to uncomplete later steps first before uncompleting this one.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      toggleInstructionCompletion(recipe.id, index);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: recipe.title,
          headerRight: () => (
            <TouchableOpacity
              onPress={handleDeleteRecipe}
              style={{ marginRight: 8 }}
            >
              <Trash2 size={20} color={Colors.error} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image
          source={{ uri: recipe.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />

        <View style={styles.content}>
          <Text style={styles.description}>{recipe.description}</Text>

          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Clock size={18} color={Colors.textLight} />
              <Text style={styles.metaText}>
                {recipe.prepTime + recipe.cookTime} min
              </Text>
            </View>

            <View style={styles.servingsContainer}>
              <TouchableOpacity
                onPress={() => handleServingsChange(servings - 1)}
                disabled={servings <= 1}
                style={[
                  styles.servingsButton,
                  servings <= 1 && styles.servingsButtonDisabled,
                ]}
              >
                <ChevronLeft
                  size={20}
                  color={
                    servings <= 1 ? Colors.gray[300] : Colors.primary
                  }
                />
              </TouchableOpacity>

              <View style={styles.servingsTextContainer}>
                <Users size={18} color={Colors.textLight} />
                <Text style={styles.metaText}>
                  {servings} servings
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => handleServingsChange(servings + 1)}
                style={styles.servingsButton}
              >
                <ChevronRight size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <Pressable
              style={[
                styles.tabButton,
                activeTab === 'ingredients' && styles.activeTabButton,
              ]}
              onPress={() => setActiveTab('ingredients')}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === 'ingredients' &&
                    styles.activeTabButtonText,
                ]}
              >
                Ingredients
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.tabButton,
                activeTab === 'instructions' &&
                  styles.activeTabButton,
              ]}
              onPress={() => setActiveTab('instructions')}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === 'instructions' &&
                    styles.activeTabButtonText,
                ]}
              >
                Instructions
              </Text>
            </Pressable>
          </View>

          {/* Tab Content */}
          {activeTab === 'ingredients' ? (
            <View style={styles.section}>
              <View style={styles.ingredientsList}>
                {recipe.ingredients.map((ingredient, index) => (
                  <View
                    key={ingredient.id}
                    style={[
                      styles.ingredientItem,
                      index === recipe.ingredients.length - 1 &&
                        styles.ingredientItemLast,
                    ]}
                  >
                    <Text style={styles.ingredientAmount}>
                      {ingredient.quantity > 0
                        ? `${
                            Number.isInteger(ingredient.quantity)
                              ? ingredient.quantity
                              : ingredient.quantity.toFixed(1)
                          } ${ingredient.unit}`
                        : ''}
                    </Text>
                    <Text style={styles.ingredientName}>
                      {ingredient.name}
                    </Text>
                  </View>
                ))}
              </View>

              <Button
                title="Add ingredients to shopping list"
                onPress={handleAddToGroceryList}
                fullWidth
                style={styles.addButton}
                variant="primary"
                size="large"
              />
            </View>
          ) : (
            <View style={styles.section}>
              {/* Progress indicator */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${
                          (recipe.completedInstructions.length /
                            recipe.instructions.length) *
                          100
                        }%`,
                      },
                    ]}
                  />
                </View>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressText}>
                    {recipe.completedInstructions.length} of{' '}
                    {recipe.instructions.length} steps completed
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      updateRecipe(recipe.id, {
                        completedInstructions: [],
                      });
                    }}
                    style={styles.resetButton}
                  >
                    <Text style={styles.resetButtonText}>Reset</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {recipe.instructions.map((instruction, index) => {
                const isCompleted =
                  recipe.completedInstructions?.includes(index) ||
                  false;

                const hasLaterCompletedSteps =
                  isCompleted &&
                  recipe.completedInstructions.some(
                    (completedIndex) => completedIndex > index
                  );

                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.instructionItem}
                    onPress={() =>
                      handleToggleInstructionCompletion(index)
                    }
                  >
                    <View
                      style={[
                        styles.instructionCheckbox,
                        isCompleted &&
                          styles.instructionCheckboxCompleted,
                        hasLaterCompletedSteps &&
                          styles.instructionCheckboxLocked,
                      ]}
                    >
                      {isCompleted ? (
                        <Check size={16} color="#FFFFFF" />
                      ) : (
                        <CircleDashed
                          size={16}
                          color={Colors.primary}
                        />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.instructionText,
                        isCompleted &&
                          styles.instructionTextCompleted,
                      ]}
                    >
                      {instruction}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  image: {
    width: '100%',
    height: 250,
  },
  content: {
    padding: 16,
  },
  description: {
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 16,
    lineHeight: 24,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 14,
    color: Colors.textLight,
    marginLeft: 6,
  },
  servingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servingsTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  servingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingsButtonDisabled: {
    opacity: 0.5,
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
  ingredientsList: {
    marginBottom: 24,
    paddingBottom: 8,
  },
  ingredientItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
    marginBottom: -1,
  },
  ingredientItemLast: {
    borderBottomWidth: 0,
    marginBottom: 0,
  },
  ingredientAmount: {
    width: 80,
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  ingredientName: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  instructionCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionCheckboxCompleted: {
    backgroundColor: Colors.primary,
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  instructionTextCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.gray[400],
  },
  instructionCheckboxLocked: {
    backgroundColor: Colors.gray[400],
    borderColor: Colors.gray[400],
  },
  addButton: {
    marginTop: 8,
    marginBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  errorText: {
    fontSize: 18,
    color: Colors.text,
    textAlign: 'center',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: Colors.gray[200],
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  progressText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'right',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: Colors.gray[200],
    borderRadius: 4,
  },
  resetButtonText: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: Colors.gray[100],
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTabButton: {
    backgroundColor: Colors.background,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textLight,
  },
  activeTabButtonText: {
    color: Colors.primary,
  },
});
