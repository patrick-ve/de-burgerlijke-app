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
} = useShoppingList();
const { headerState, setHeader } = useHeaderState();
const isMounted = ref(false);
const isClearConfirmationModalOpen = ref(false);
const isLoadingPrices = ref(false);

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
  isLoadingPrices.value = true;
  try {
    const itemsToFetch = shoppingListItems.value.filter(
      (item) => !item.isChecked
    ); // Only fetch for unchecked items
    const ingredientNames = itemsToFetch.map(
      (item) => item.ingredientName
    );

    if (ingredientNames.length === 0) {
      consola.info(
        'No unchecked items in the shopping list to fetch prices for.'
      );
      // Optionally reset prices for already fetched items if needed
      // shoppingListItems.value.forEach(item => {
      //   if (item.cheapestPrice) {
      //     updateItem({
      //       ...item,
      //       cheapestPrice: undefined,
      //       cheapestSupermarket: undefined,
      //       cheapestAmount: undefined,
      //     });
      //   }
      // });
      isLoadingPrices.value = false; // Ensure loading state is reset
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
          consola.info(
            `Updated price for ${ingredientName}: ${cheapestProduct.price} at ${cheapestProduct.supermarketName}`
          );
        } else {
          consola.warn(
            `Could not find corresponding item for ingredient: ${ingredientName} in the list or it was checked.`
          );
        }
      } else {
        consola.warn(
          `No product found for ingredient: ${ingredientName}`
        );
      }
    });

    // TODO: Handle ingredients for which no prices were found (clear existing price?)
    // TODO: Update the ShoppingList component to display the cheapestPrice, cheapestSupermarket, and cheapestAmount fields.
  } catch (error) {
    consola.error('Error fetching cheapest products:', error);
    // TODO: Show user-friendly error message (e.g., using UToast)
  } finally {
    isLoadingPrices.value = false;
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
        class="mt-6 flex justify-end"
      >
        <!-- <UButton label="Lijst legen" color="red" variant="outline" /> -->
        <UButton
          label="Prijzen ophalen"
          class="ml-2"
          :loading="isLoadingPrices"
          @click="fetchCheapestProducts"
        />
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
