<template>
  <div class="p-4">
    <RecipeList :recipes="recipes" />

    <!-- Teleport Add button to the header -->
    <Teleport to="#header-right-action" v-if="isMounted">
      <UButton
        v-if="headerState.showRightAction"
        color="primary"
        aria-label="Voeg nieuw recept toe"
        label="Voeg toe"
        class="font-bold"
        @click="triggerRightAction"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import type { Recipe } from '~/types/recipe';
import { useHeaderState } from '~/composables/useHeaderState';

const router = useRouter();
const { headerState, setHeader, resetHeader } = useHeaderState();
const isMounted = ref(false);

// Action handler for the Add button
const navigateToAddRecipe = () => {
  router.push('/recipes/new');
};

// Handler to trigger the action stored in state
const triggerRightAction = () => {
  if (headerState.value.rightActionHandler) {
    headerState.value.rightActionHandler();
  }
};

// Placeholder for fetching recipes data
const recipes = ref<Recipe[]>([
  {
    id: '1',
    title: 'Spaghetti Carbonara',
    description: 'A classic Roman pasta dish.',
    prepTime: 10,
    cookTime: 15,
    cuisine: 'Italian',
    portions: 2,
    ingredients: [
      { id: 'i1', quantity: 200, unit: 'g', name: 'Spaghetti' },
      {
        id: 'i2',
        quantity: 100,
        unit: 'g',
        name: 'Guanciale or Pancetta',
      },
      { id: 'i3', quantity: 2, unit: null, name: 'Large Eggs' },
      {
        id: 'i4',
        quantity: 50,
        unit: 'g',
        name: 'Pecorino Romano Cheese',
        notes: 'grated',
      },
      { id: 'i5', quantity: null, unit: null, name: 'Black Pepper' },
    ],
    steps: [
      {
        id: 's1',
        order: 1,
        description: 'Cook pasta according to package directions.',
      },
      {
        id: 's2',
        order: 2,
        description: 'While pasta cooks, fry guanciale until crisp.',
      },
      {
        id: 's3',
        order: 3,
        description:
          'Whisk eggs and cheese. Temper with hot pasta water.',
      },
      {
        id: 's4',
        order: 4,
        description:
          'Drain pasta, reserving some water. Combine pasta, guanciale, egg mixture, and pepper. Add pasta water if needed.',
      },
    ],
    utensils: [
      { id: 'u1', name: 'Large Pot' },
      { id: 'u2', name: 'Frying Pan' },
      { id: 'u3', name: 'Whisk' },
      { id: 'u4', name: 'Colander' },
    ],
    isFavorite: true,
  },
  {
    id: '2',
    title: 'Chicken Stir-Fry',
    description: 'Quick and easy weeknight meal.',
    prepTime: 15,
    cookTime: 10,
    cuisine: 'Asian',
    portions: 3,
    ingredients: [
      {
        id: 'i6',
        quantity: 300,
        unit: 'g',
        name: 'Chicken Breast',
        notes: 'sliced',
      },
      {
        id: 'i7',
        quantity: 1,
        unit: null,
        name: 'Broccoli Head',
        notes: 'cut into florets',
      },
      {
        id: 'i8',
        quantity: 1,
        unit: null,
        name: 'Bell Pepper',
        notes: 'sliced',
      },
      { id: 'i9', quantity: 2, unit: 'tbsp', name: 'Soy Sauce' },
      { id: 'i10', quantity: 1, unit: 'tbsp', name: 'Sesame Oil' },
      {
        id: 'i11',
        quantity: 1,
        unit: 'clove',
        name: 'Garlic',
        notes: 'minced',
      },
      {
        id: 'i12',
        quantity: null,
        unit: null,
        name: 'Rice',
        notes: 'cooked, for serving',
      },
    ],
    steps: [
      {
        id: 's5',
        order: 1,
        description: 'Heat oil in a wok or large skillet.',
      },
      {
        id: 's6',
        order: 2,
        description: 'Add chicken and cook until browned.',
      },
      {
        id: 's7',
        order: 3,
        description:
          'Add vegetables and stir-fry until tender-crisp.',
      },
      {
        id: 's8',
        order: 4,
        description:
          'Stir in soy sauce, sesame oil, and garlic. Cook for 1 minute more.',
      },
      { id: 's9', order: 5, description: 'Serve over rice.' },
    ],
    utensils: [
      { id: 'u5', name: 'Wok or Large Skillet' },
      { id: 'u6', name: 'Knife' },
      { id: 'u7', name: 'Cutting Board' },
    ],
    isFavorite: false,
  },
]);

onMounted(async () => {
  await nextTick();
  isMounted.value = true;

  setHeader({
    title: 'Mijn recepten',
    showLeftAction: false, // No back button needed here usually
    showRightAction: true,
    rightActionHandler: navigateToAddRecipe,
  });
});

onUnmounted(() => {
  resetHeader();
  isMounted.value = false;
});

useHead({
  title: 'Recipes', // Browser tab title
});
</script>
