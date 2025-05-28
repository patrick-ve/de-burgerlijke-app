import { ref, computed } from 'vue';
import { useContainer } from '../src/container';
import { type ShoppingList } from '../src/domain/entities/ShoppingList';
import { type ShoppingItem } from '../src/domain/entities/ShoppingItem';
import { type AddItemDTO } from '../src/application/use-cases/shopping/AddItemToShoppingList';
import { type UpdateShoppingItemDTO } from '../src/application/use-cases/shopping/UpdateShoppingItem';

export const useShoppingList = () => {
  const { 
    shoppingListRepository, 
    addItemToShoppingList,
    updateShoppingItem,
    optimizeShoppingList,
    findCheapestPrices,
    cleanUpShoppingList
  } = useContainer();
  const toast = useToast();
  
  // State
  const lists = ref<ShoppingList[]>([]);
  const activeList = ref<ShoppingList | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const items = computed(() => activeList.value?.items || []);
  
  const itemCount = computed(() => items.value.length);
  
  const completedCount = computed(() => 
    items.value.filter(item => item.completed).length
  );
  
  const itemsByCategory = computed(() => {
    if (!activeList.value) return new Map();
    return activeList.value.groupByCategory();
  });
  
  const totalEstimatedCost = computed(() => 
    activeList.value?.totalEstimatedCost || null
  );
  
  const completionPercentage = computed(() => 
    activeList.value?.completionPercentage || 0
  );

  // Actions
  const loadLists = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      lists.value = await shoppingListRepository.findAll();
      activeList.value = await shoppingListRepository.findActive();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load shopping lists';
      toast.add({
        title: 'Error',
        description: error.value,
        color: 'red'
      });
    } finally {
      loading.value = false;
    }
  };

  const addItem = async (itemData: Omit<AddItemDTO, 'listId'>) => {
    loading.value = true;
    error.value = null;
    
    try {
      const dto: AddItemDTO = {
        ...itemData,
        listId: activeList.value?.id
      };
      
      const newItem = await addItemToShoppingList.execute(dto);
      
      // Reload active list to get updated data
      activeList.value = await shoppingListRepository.findActive();
      
      toast.add({
        title: 'Success',
        description: `${newItem.name} added to shopping list`,
        color: 'green'
      });
      
      return newItem;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to add item';
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

  const toggleItemCompleted = async (itemId: string) => {
    if (!activeList.value) return;
    
    const item = items.value.find(i => i.id === itemId);
    if (!item) return;
    
    try {
      const dto: UpdateShoppingItemDTO = {
        listId: activeList.value.id,
        itemId,
        completed: !item.completed
      };
      
      await updateShoppingItem.execute(dto);
      
      // Update local state
      activeList.value.toggleItemCompleted(itemId);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to update item';
      toast.add({
        title: 'Error',
        description: error.value,
        color: 'red'
      });
    }
  };

  const removeItem = async (itemId: string) => {
    if (!activeList.value) return;
    
    try {
      activeList.value.removeItem(itemId);
      await shoppingListRepository.update(activeList.value);
      
      toast.add({
        title: 'Success',
        description: 'Item removed from shopping list',
        color: 'green'
      });
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to remove item';
      toast.add({
        title: 'Error',
        description: error.value,
        color: 'red'
      });
    }
  };

  const clearCompleted = async () => {
    if (!activeList.value) return;
    
    try {
      activeList.value.clearCompleted();
      await shoppingListRepository.update(activeList.value);
      
      toast.add({
        title: 'Success',
        description: 'Completed items cleared',
        color: 'green'
      });
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to clear completed items';
      toast.add({
        title: 'Error',
        description: error.value,
        color: 'red'
      });
    }
  };

  const optimizeList = async (maxSupermarkets?: number) => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await optimizeShoppingList.execute({ maxSupermarkets });
      
      toast.add({
        title: 'Optimization Complete',
        description: `You can save ${result.totalSavings.toString()} by shopping at multiple stores`,
        color: 'green'
      });
      
      return result;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to optimize shopping list';
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

  const findCheapest = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await findCheapestPrices.execute({});
      
      toast.add({
        title: 'Price Comparison Complete',
        description: `Cheapest at ${result.cheapest.supermarket} (${result.cheapest.currency} ${result.cheapest.totalPrice})`,
        color: 'green'
      });
      
      return result;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to find cheapest prices';
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

  const cleanUp = async (mergeStrategy?: 'sum' | 'max' | 'keep-separate') => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await cleanUpShoppingList.execute({ mergeStrategy });
      
      // Reload active list to get cleaned data
      activeList.value = await shoppingListRepository.findActive();
      
      toast.add({
        title: 'Cleanup Complete',
        description: `${result.itemsMerged} duplicates merged, ${result.categoriesAssigned} categories assigned`,
        color: 'green'
      });
      
      return result;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to clean up shopping list';
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
    loadLists();
  });

  return {
    // State
    lists: readonly(lists),
    activeList: readonly(activeList),
    items: readonly(items),
    loading: readonly(loading),
    error: readonly(error),
    
    // Computed
    itemCount,
    completedCount,
    itemsByCategory,
    totalEstimatedCost,
    completionPercentage,
    
    // Actions
    loadLists,
    addItem,
    toggleItemCompleted,
    removeItem,
    clearCompleted,
    optimizeList,
    findCheapest,
    cleanUp
  };
};