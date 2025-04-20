<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useShoppingList } from '~/composables/useShoppingList';
import type { ShoppingListItem } from '~/types/shopping-list';
import { useHeaderState } from '~/composables/useHeaderState';
import { consola } from 'consola';

// Interface for the single product object returned by the API
interface Product {
  id: string;
  name: string;
  price: number;
  amount: string | null;
  distance: number; // Represents similarity score from API
  standardized_price_per_unit: number | null; // Allow null
  standardized_unit: string | null; // Allow null
  supermarketName: string;
}

// Type for the actual API response
type ApiReturnType = Record<string, Product | null>;

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
  if (isLoadingPrices.value) return;

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

    // Explicitly type the expected response with the CORRECT type
    const results: ApiReturnType = await $fetch(
      '/api/shopping-list/find-cheapest',
      {
        method: 'POST',
        body: { ingredientNames },
      }
    );

    consola.success('Received cheapest products:', results);

    // Integrate results into the shopping list items
    let updateCount = 0;
    Object.entries(results).forEach(
      ([ingredientName, cheapestProduct]) => {
        // cheapestProduct is now the Product object itself, or null

        if (cheapestProduct) {
          const itemToUpdate = shoppingListItems.value.find(
            (item) =>
              item.ingredientName === ingredientName &&
              !item.isChecked
          );

          if (itemToUpdate) {
            updateItem({
              ...itemToUpdate,
              cheapestPrice: cheapestProduct.price,
              cheapestSupermarket: cheapestProduct.supermarketName,
              cheapestAmount: cheapestProduct.amount,
              // Optionally store standardized info if needed later
              // cheapestStandardizedPrice: cheapestProduct.standardized_price_per_unit,
              // cheapestStandardizedUnit: cheapestProduct.standardized_unit,
            });
            updateCount++;
          }
        }
      }
    );
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
        :is-loading="isLoadingPrices"
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
          label="Prijzen ophalen"
          icon="i-heroicons-currency-euro"
          class="ml-2"
          :loading="isLoadingPrices"
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
