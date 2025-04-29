<template>
  <div>
    <!-- Fetch recipe data based on route params -->
    <div v-if="pending">Loading...</div>

    <div v-else-if="error || !recipe">
      Error loading recipe or recipe not found.
    </div>

    <RecipeDetailView v-else :recipe="recipe" />

    <!-- Teleport Back button to the header -->
    <Teleport to="#header-left-action" v-if="isMounted">
      <UButton
        v-if="headerState.showLeftAction"
        icon="i-heroicons-arrow-left"
        variant="ghost"
        color="gray"
        aria-label="Back"
        @click="triggerLeftAction"
      />
    </Teleport>

    <!-- Teleport Context Menu Trigger to the header -->
    <Teleport to="#header-right-action" v-if="isMounted">
      <UButton
        v-if="headerState.showRightAction"
        ref="contextMenuTriggerRef"
        icon="i-heroicons-ellipsis-vertical"
        variant="ghost"
        color="gray"
        aria-label="Options"
        @click="triggerRightAction"
      />
    </Teleport>

    <!-- Teleport Context Menu to the body to avoid stacking context issues -->
    <Teleport to="body">
      <UContextMenu
        v-model="isContextMenuOpen"
        :virtual-element="virtualElement"
        :popper="{ placement: 'bottom-end' }"
        :ui="{ container: 'z-50 group' }"
      >
        <div class="p-1">
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
import { useHeaderState } from '~/composables/useHeaderState';
import { useRecipes } from '~/composables/useRecipes'; // Import the composable
import type { VirtualElement } from '@popperjs/core'; // Import type for virtualElement

const route = useRoute();
const router = useRouter(); // Import router
const { headerState, setHeader, resetHeader, defaultLeftAction } =
  useHeaderState();
const isMounted = ref(false);
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

// Handler to trigger the action stored in state
const triggerLeftAction = () => {
  if (headerState.value.leftActionHandler) {
    headerState.value.leftActionHandler();
  }
};

// Handler to trigger the right action (open context menu)
const triggerRightAction = () => {
  if (headerState.value.rightActionHandler) {
    headerState.value.rightActionHandler();
  }
};

// Function to open the context menu using mouse coordinates
const openContextMenu = () => {
  // Use mouse coordinates instead of button ref
  const top = unref(y) - unref(windowY);
  const left = unref(x);

  virtualElement.value.getBoundingClientRect = () => ({
    width: 0,
    height: 0,
    top,
    left,
    // Keep other properties for type correctness
    right: left,
    bottom: top,
    x: left,
    y: top,
    toJSON: () => JSON.stringify(this),
  });

  isContextMenuOpen.value = true;
};

const goBackToRecipes = () => {
  router.push('app/recipes');
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
    // Optional: Add a toast notification for success
    // await navigateTo('app/recipes'); // Navigate back to the list or another appropriate page
    router.back(); // Or simply go back
  }
};

// Fetching the specific recipe data
const {
  data: recipe,
  pending,
  error,
} = await useAsyncData<Recipe | undefined>(
  `recipe-${recipeId.value}`,
  async () => {
    console.log(`Fetching recipe with ID: ${recipeId.value}`);
    const foundRecipe = findRecipeById(recipeId.value);
    return foundRecipe;
  },
  {
    watch: [recipeId],
  }
);

onMounted(async () => {
  await nextTick();
  isMounted.value = true;

  // Initial header setup
  setHeader({
    title: recipe.value?.title || 'Loading Recipe...',
    showLeftAction: true,
    showRightAction: true, // Show the right action button
    leftActionHandler: goBackToRecipes,
    rightActionHandler: openContextMenu, // Set handler to open context menu
  });
});

// Watch for recipe data changes to update the header title
watch(
  recipe,
  (newRecipe) => {
    if (newRecipe) {
      setHeader({ title: newRecipe.title, showRightAction: true }); // Ensure right action is shown
    } else if (!pending.value) {
      setHeader({
        title: 'Recipe Not Found',
        showRightAction: false,
      }); // Hide if no recipe
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  resetHeader();
  isMounted.value = false;
});

useHead({
  title: computed(() =>
    recipe.value ? recipe.value.title : 'Recipe Details'
  ),
});
</script>
