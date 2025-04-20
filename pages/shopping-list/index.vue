<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useShoppingList } from '~/composables/useShoppingList';
import type { ShoppingListItem } from '~/types/shopping-list';
import { useHeaderState } from '~/composables/useHeaderState';
import { consola } from 'consola';

// Add these interfaces near the top, after the imports
interface Product {
  id: string;
  name: string;
  price: number;
  link: string;
  amount: string | null; // Amount can be null based on the example
  supermarketId: string;
  distance: number;
  standardized_price_per_unit: number;
  standardized_unit: string;
  supermarketName: string;
}

interface CheapestProductResult {
  [ingredientName: string]: Product[];
}

// Use the composable to get shopping list state and actions
const {
  items: shoppingListItems,
  updateItem,
  deleteItem,
  clearList,
  replaceList,
} = useShoppingList();
const { headerState, setHeader } = useHeaderState();
const isMounted = ref(false);
const isClearConfirmationModalOpen = ref(false);
const isLoadingPrices = ref(false);
const isOptimizingList = ref(false);
const toast = useToast();

// Define Head for the page
useHead({
  title: 'Boodschappenlijst',
});

// Handle item updates (e.g., checking/unchecking)
const handleItemUpdate = (item: ShoppingListItem) => {
  updateItem(item);
};

// Handle item deletion
const handleItemDelete = (itemId: string) => {
  deleteItem(itemId);
};

// Handler to trigger the action stored in state
const triggerRightAction = () => {
  isClearConfirmationModalOpen.value = true;
};

const confirmClearList = () => {
  clearList();
  isClearConfirmationModalOpen.value = false;
};

// Function to fetch cheapest products
const fetchCheapestProducts = async () => {
  if (isLoadingPrices.value || isOptimizingList.value) return;

  isLoadingPrices.value = true;
  try {
    const itemsToFetch = shoppingListItems.value.filter(
      (item) => !item.isChecked
    );
    const ingredientNames = itemsToFetch.map(
      (item) => item.ingredientName
    );

    if (ingredientNames.length === 0) {
      consola.info(
        'No unchecked items in the shopping list to fetch prices for.'
      );
      toast.add({
        title: 'Geen items om prijzen voor op te halen',
        description: 'Vink items uit om prijzen op te halen.',
        color: 'orange',
      });
      isLoadingPrices.value = false;
      return;
    }

    consola.info('Fetching cheapest products for:', ingredientNames);

    // Explicitly type the expected response
    const results: CheapestProductResult = await $fetch(
      '/api/shopping-list/find-cheapest',
      {
        method: 'POST',
        body: { ingredientNames },
      }
    );

    consola.success('Received cheapest products:', results);

    // Integrate results into the shopping list items
    let updateCount = 0;
    Object.entries(results).forEach(([ingredientName, products]) => {
      const cheapestProduct = products[0]; // Assuming the first product is the cheapest

      if (cheapestProduct) {
        const itemToUpdate = shoppingListItems.value.find(
          (item) =>
            item.ingredientName === ingredientName && !item.isChecked
        );

        if (itemToUpdate) {
          updateItem({
            ...itemToUpdate,
            cheapestPrice: cheapestProduct.price,
            cheapestSupermarket: cheapestProduct.supermarketName,
            cheapestAmount: cheapestProduct.amount,
          });
          updateCount++;
        }
      }
    });
    if (updateCount > 0) {
      toast.add({
        title: `Prijzen bijgewerkt voor ${updateCount} item(s)`,
        color: 'green',
      });
    } else {
      toast.add({
        title: 'Geen nieuwe prijzen gevonden',
        color: 'orange',
      });
    }

    // TODO: Handle ingredients for which no prices were found (clear existing price?)
    // TODO: Update the ShoppingList component to display the cheapestPrice, cheapestSupermarket, and cheapestAmount fields.
  } catch (error) {
    consola.error('Error fetching cheapest products:', error);
    toast.add({
      title: 'Fout bij ophalen prijzen',
      description: 'Kon de productprijzen niet ophalen.',
      color: 'red',
    });
  } finally {
    isLoadingPrices.value = false;
  }
};

// Function to optimize the shopping list using AI
const handleOptimizeList = async () => {
  if (isLoadingPrices.value || isOptimizingList.value) return;
  if (shoppingListItems.value.length === 0) {
    toast.add({
      title: 'Lijst is al leeg',
      description: 'Er zijn geen items om te optimaliseren.',
      color: 'orange',
    });
    return;
  }

  isOptimizingList.value = true;
  consola.info('Optimizing shopping list...');
  try {
    const currentItems = JSON.parse(
      JSON.stringify(shoppingListItems.value)
    ); // Deep clone to avoid reactivity issues? Or pass ref directly? Pass value.
    const optimizedList: ShoppingListItem[] = await $fetch(
      '/api/shopping-list/clean-up',
      {
        method: 'POST',
        body: currentItems, // Send the current list
      }
    );

    replaceList(optimizedList); // Replace the list with the optimized one
    consola.success('Shopping list optimized successfully.');
    toast.add({
      title: 'Boodschappenlijst geoptimaliseerd!',
      icon: 'i-heroicons-sparkles',
      color: 'green',
    });
  } catch (error) {
    consola.error('Error optimizing shopping list:', error);
    toast.add({
      title: 'Fout bij optimaliseren',
      description: 'Kon de boodschappenlijst niet optimaliseren.',
      color: 'red',
    });
  } finally {
    isOptimizingList.value = false;
  }
};

onMounted(async () => {
  await nextTick();
  isMounted.value = true;

  setHeader({
    title: 'Boodschappenlijst',
    showLeftAction: true,
    showRightAction: true,
    rightActionHandler: clearList,
  });
});

const router = useRouter();
</script>

<template>
  <div>
    <UContainer>
      <!-- Pass items to the ShoppingList component and listen for updates -->
      <ShoppingList
        :items="shoppingListItems"
        @update:item="handleItemUpdate"
        @delete="handleItemDelete"
      />

      <!-- Placeholder for Actions -->
      <div
        v-if="shoppingListItems.length > 0"
        class="mt-6 flex flex-wrap justify-end gap-2"
      >
        <!-- <UButton label="Lijst legen" color="red" variant="outline" /> -->
        <UButton
          label="Lijst optimaliseren"
          icon="i-heroicons-sparkles"
          variant="outline"
          :loading="isOptimizingList"
          :disabled="isLoadingPrices"
          @click="handleOptimizeList"
        />
        <UButton
          label="Prijzen ophalen"
          icon="i-heroicons-currency-euro"
          class="ml-2"
          :loading="isLoadingPrices"
          :disabled="isOptimizingList"
          @click="fetchCheapestProducts"
        />
      </div>
      <div v-else class="mt-6 text-center text-gray-500">
        Je boodschappenlijst is leeg. Voeg items toe vanuit een
        recept!
      </div>
    </UContainer>

    <!-- Teleport Clear button to the header -->
    <Teleport to="#header-left-action" v-if="isMounted">
      <UButton
        color="gray"
        variant="ghost"
        icon="i-heroicons-arrow-left"
        aria-label="Ga terug naar home"
        @click="router.push('/')"
      />
    </Teleport>

    <Teleport to="#header-right-action" v-if="isMounted">
      <UButton
        v-if="
          headerState.showRightAction && shoppingListItems.length > 0
        "
        color="red"
        aria-label="Maak lijst leeg"
        label="Maak leeg"
        class="font-bold text-xs"
        @click="triggerRightAction"
      />
    </Teleport>

    <!-- Confirmation Modal -->
    <UModal
      v-model="isClearConfirmationModalOpen"
      :ui="{
        overlay: {
          background: 'bg-black/40 backdrop-blur-sm',
        },
      }"
    >
      <UCard
        :ui="{
          ring: '',
          divide: 'divide-y divide-gray-100',
        }"
      >
        <template #header>
          <h3 class="text-lg font-semibold">Weet je het zeker?</h3>
        </template>

        <p class="text-gray-600">
          Wil je de boodschappenlijst echt helemaal leegmaken? Deze
          actie kan niet ongedaan worden gemaakt.
        </p>

        <template #footer>
          <div class="flex justify-end space-x-3">
            <UButton
              label="Annuleren"
              color="gray"
              variant="ghost"
              @click="isClearConfirmationModalOpen = false"
            />
            <UButton
              label="Bevestigen"
              color="red"
              @click="confirmClearList"
            />
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>
