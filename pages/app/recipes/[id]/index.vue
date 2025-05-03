<template>
  <TheHeader :title="recipe?.title || 'Geen recept gevonden'">
    <template #left-action>
      <UButton
        icon="i-heroicons-arrow-left"
        variant="ghost"
        color="gray"
        aria-label="Back"
        @click="goBackToRecipes"
      />
    </template>
    <template #right-action>
      <UButton
        v-if="recipe"
        ref="contextMenuTriggerRef"
        icon="i-heroicons-ellipsis-vertical"
        variant="ghost"
        color="gray"
        aria-label="Options"
        @click="openContextMenu"
      />
    </template>
  </TheHeader>

  <div>
    <div class="p-4" v-if="pending">Laden...</div>

    <div v-else-if="fetchError || !recipe" class="p-4 space-y-4">
      <!-- Dit bericht wordt mogelijk niet vaak getoond als fetchError de foutpagina activeert -->
      <p>
        Fout bij het laden van het recept of recept niet gevonden.
      </p>

      <UButton class="font-bold" @click="goBackToRecipes"
        >Ga terug naar alle recepten</UButton
      >
    </div>

    <RecipeDetailView v-else :recipe="recipe" />

    <!-- Removed Teleports -->

    <Teleport to="body">
      <UContextMenu
        v-model="isContextMenuOpen"
        :virtual-element="virtualElement"
        :popper="{ placement: 'bottom-end' }"
        :ui="{ container: 'z-50 group' }"
      >
        <div class="p-1 space-y-1">
          <UButton
            v-if="isDev"
            label="Bewerk recept"
            color="gray"
            variant="ghost"
            icon="i-heroicons-pencil-square"
            @click="navigateToEdit"
          />
          <UDivider />
          <UButton
            label="Verwijder recept"
            color="red"
            variant="ghost"
            icon="i-heroicons-trash"
            @click="openConfirmationModal"
          />
        </div>
      </UContextMenu>
    </Teleport>

    <!-- Confirmation Modal -->
    <UModal
      v-model="isModalOpen"
      :ui="{
        overlay: {
          background: 'bg-black/40 backdrop-blur-sm',
        },
      }"
    >
      <UCard
        :ui="{
          ring: '',
          divide: 'divide-y divide-gray-100 dark:divide-gray-800',
        }"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <h3
              class="text-base font-semibold leading-6 text-gray-900 dark:text-white"
            >
              Recept verwijderen
            </h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark-20-solid"
              class="-my-1"
              @click="isModalOpen = false"
            />
          </div>
        </template>

        <p>
          Weet je zeker dat je het recept "{{ recipe?.title }}"
          permanent wilt verwijderen? Deze actie kan niet ongedaan
          worden gemaakt.
        </p>

        <template #footer>
          <div class="flex justify-end space-x-2">
            <UButton
              color="gray"
              variant="ghost"
              label="Annuleren"
              @click="isModalOpen = false"
            />
            <UButton
              color="red"
              label="Verwijderen"
              icon="i-heroicons-trash"
              @click="confirmDelete"
            />
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  nextTick,
  watch,
  unref, // Import unref
} from 'vue';
import { useMouse, useWindowScroll } from '@vueuse/core'; // Import mouse/scroll utils
import type { Recipe } from '~/types/recipe'; // Assuming Recipe type exists
import { useRecipes } from '~/composables/useRecipes'; // Import the composable
import type { VirtualElement } from '@popperjs/core'; // Import type for virtualElement

const route = useRoute();
const router = useRouter(); // Import router
const recipeId = computed(() => route.params.id as string);
const { findRecipeById, deleteRecipe } = useRecipes(); // Get functions

// Mouse and Scroll position for Context Menu
const { x, y } = useMouse();
const { y: windowY } = useWindowScroll();

// Context Menu State
const isContextMenuOpen = ref(false);
const contextMenuTriggerRef = ref<HTMLButtonElement | null>(null); // Ref for the trigger button
const virtualElement = ref<VirtualElement>({
  getBoundingClientRect: () => ({
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}), // Add dummy toJSON
  }),
});

// Modal State
const isModalOpen = ref(false);

// Function to open the context menu using mouse coordinates
const openContextMenu = () => {
  const top = unref(y) - unref(windowY);
  const left = unref(x);

  virtualElement.value.getBoundingClientRect = () => ({
    width: 0,
    height: 0,
    top,
    left,
    right: left,
    bottom: top,
    x: left,
    y: top,
    toJSON: () => JSON.stringify(this),
  });

  isContextMenuOpen.value = true;
};

const goBackToRecipes = () => {
  router.push('/app/recipes');
};

// Function to open the confirmation modal
const openConfirmationModal = () => {
  isContextMenuOpen.value = false; // Close context menu first
  isModalOpen.value = true;
};

// Function to handle the confirmed deletion
const confirmDelete = async () => {
  if (recipe.value) {
    deleteRecipe(recipe.value.id!);
    isModalOpen.value = false;
    router.back(); // Or simply go back
  }
};

const navigateToEdit = () => {
  if (recipeId.value) {
    isContextMenuOpen.value = false; // Close context menu
    router.push(`/app/recipes/${recipeId.value}/edit`);
  }
};

// Fetching the specific recipe data
const {
  data: recipe,
  pending,
  error: fetchError, // Rename error to avoid conflict with createError
} = await useAsyncData<Recipe | undefined>(
  `recipe-${recipeId.value}`,
  async () => {
    console.log(`Fetching recipe with ID: ${recipeId.value}`);
    const foundRecipe = findRecipeById(recipeId.value);

    // Check if the recipe was found
    if (!foundRecipe) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Recept niet gevonden',
        fatal: true, // Ensure it shows the error page
      });
    }

    return foundRecipe;
  },
  {
    watch: [recipeId],
  }
);

// Handle potential fetch errors that are not 404s (e.g., network issues)
// The error page will handle fatal errors thrown by createError
if (fetchError.value && !recipe.value) {
  // Log the error or handle it differently if needed
  console.error('Error fetching recipe:', fetchError.value);
  // Optionally, you could show a generic error message here without using the full error page,
  // but since we made the 404 fatal, other fetch errors might as well be fatal.
}

const isDev = import.meta.dev;

useHead({
  title: computed(() =>
    recipe.value ? recipe.value.title : 'Recipe Details'
  ),
});
</script>
