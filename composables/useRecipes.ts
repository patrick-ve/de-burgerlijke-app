import { ref, computed } from 'vue';
import { useContainer } from '../src/container';
import { type Recipe } from '../src/domain/entities/Recipe';
import { type CreateRecipeDTO } from '../src/application/dto/CreateRecipeDTO';

export const useRecipes = () => {
  const { recipeRepository, createRecipe } = useContainer();
  const toast = useToast();
  
  // State
  const recipes = ref<Recipe[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const recipeCount = computed(() => recipes.value.length);
  
  const recipesByTag = computed(() => {
    const byTag = new Map<string, Recipe[]>();
    
    recipes.value.forEach(recipe => {
      recipe.tags.forEach(tag => {
        if (!byTag.has(tag)) {
          byTag.set(tag, []);
        }
        byTag.get(tag)!.push(recipe);
      });
    });
    
    return byTag;
  });

  // Actions
  const loadRecipes = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      recipes.value = await recipeRepository.findAll();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load recipes';
      toast.add({
        title: 'Error',
        description: error.value,
        color: 'red'
      });
    } finally {
      loading.value = false;
    }
  };

  const addRecipe = async (recipeData: CreateRecipeDTO) => {
    loading.value = true;
    error.value = null;
    
    try {
      const recipe = await createRecipe.execute(recipeData);
      recipes.value.push(recipe);
      
      toast.add({
        title: 'Success',
        description: `Recipe "${recipe.title}" has been added`,
        color: 'green'
      });
      
      return recipe;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to add recipe';
      toast.add({
        title: 'Error',
        description: error.value,
        color: 'red'
      });
      throw e;
    } finally {
      loading.value = false;
    }
  };

  const findRecipeById = (id: string): Recipe | undefined => {
    return recipes.value.find(recipe => recipe.id === id);
  };

  const searchRecipes = async (query: string): Promise<Recipe[]> => {
    loading.value = true;
    error.value = null;
    
    try {
      return await recipeRepository.search(query);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to search recipes';
      return [];
    } finally {
      loading.value = false;
    }
  };

  const deleteRecipe = async (id: string) => {
    loading.value = true;
    error.value = null;
    
    try {
      await recipeRepository.delete(id);
      recipes.value = recipes.value.filter(recipe => recipe.id !== id);
      
      toast.add({
        title: 'Success',
        description: 'Recipe has been deleted',
        color: 'green'
      });
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to delete recipe';
      toast.add({
        title: 'Error',
        description: error.value,
        color: 'red'
      });
      throw e;
    } finally {
      loading.value = false;
    }
  };

  // Initialize
  onMounted(() => {
    loadRecipes();
  });

  return {
    // State
    recipes: readonly(recipes),
    loading: readonly(loading),
    error: readonly(error),
    
    // Computed
    recipeCount,
    recipesByTag,
    
    // Actions
    loadRecipes,
    addRecipe,
    findRecipeById,
    searchRecipes,
    deleteRecipe
  };
};