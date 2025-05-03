<script setup lang="ts">
import type {
  Recipe,
  Ingredient,
  Step,
  Utensil,
  IngredientCategory,
} from '~/types/recipe';
import { ingredientCategories } from '~/types/recipe';
import { ref, computed, watch } from 'vue';
import { v4 as uuidv4 } from 'uuid'; // Import uuid for temporary keys

const props = defineProps<{
  recipe: Recipe;
}>();

const emit = defineEmits(['save', 'cancel']);

// Helper to ensure value is not null/undefined for input binding
const safeModelValue = <
  T extends string | number | boolean | null | undefined,
>(
  value: T,
  defaultValue: T extends null | undefined ? NonNullable<T> : T
): NonNullable<T> => {
  return value === null || value === undefined
    ? defaultValue
    : (value as NonNullable<T>);
};

// Initialize editableRecipe directly from props, keeping nulls where they are
const editableRecipe = ref<Recipe>(
  JSON.parse(JSON.stringify(props.recipe))
);

// Create a mutable copy for the USelectMenu options
const categories = [...ingredientCategories];

// --- Computed Models for v-model binding ---

// String fields that can be null
const titleModel = computed({
  get: () => editableRecipe.value.title ?? '',
  set: (value) => {
    editableRecipe.value.title = value;
  }, // Title is required, so no null conversion needed
});

const descriptionModel = computed({
  get: () => editableRecipe.value.description ?? '',
  set: (value) => {
    editableRecipe.value.description = value || null;
  },
});

const cuisineModel = computed({
  get: () => editableRecipe.value.cuisine ?? '',
  set: (value) => {
    editableRecipe.value.cuisine = value || null;
  },
});

const sourceUrlModel = computed({
  get: () => editableRecipe.value.sourceUrl ?? '',
  set: (value) => {
    editableRecipe.value.sourceUrl = value || null;
  },
});

const youtubeUrlModel = computed({
  get: () => editableRecipe.value.youtubeUrl ?? '',
  set: (value) => {
    editableRecipe.value.youtubeUrl = value || null;
  },
});

const imageUrlModel = computed({
  get: () => editableRecipe.value.imageUrl ?? '',
  set: (value) => {
    editableRecipe.value.imageUrl = value || null;
  },
});

// Numeric fields that can be null
const prepTimeModel = computed({
  get: () => editableRecipe.value.prepTime ?? 0,
  // Ensure value is treated as number, convert back to null if 0 or empty during set if needed (handleSave does this)
  set: (value) => {
    editableRecipe.value.prepTime =
      typeof value === 'number' ? value : parseInt(value, 10) || null;
  },
});

const cookTimeModel = computed({
  get: () => editableRecipe.value.cookTime ?? 0,
  set: (value) => {
    editableRecipe.value.cookTime =
      typeof value === 'number' ? value : parseInt(value, 10) || null;
  },
});

// Numeric field (required, min 1)
const portionsModel = computed({
  get: () => editableRecipe.value.portions,
  set: (value) => {
    editableRecipe.value.portions =
      typeof value === 'number' && value >= 1 ? value : 1;
  },
});

// Watch for external changes to the prop and update the local copy
watch(
  () => props.recipe,
  (newRecipe) => {
    // Reset the entire editableRecipe ref when the prop changes
    editableRecipe.value = JSON.parse(JSON.stringify(newRecipe));
  },
  { deep: true }
);

// --- Tab Management ---
const selectedTab = ref('details'); // Start with details/metadata editing

const items = [
  {
    key: 'details',
    label: 'Details',
    icon: 'i-heroicons-information-circle',
  },
  {
    key: 'ingredients',
    label: 'Ingrediënten',
    icon: 'i-heroicons-list-bullet',
  },
  {
    key: 'instructions',
    label: 'Bereiding',
    icon: 'i-heroicons-book-open',
  },
];

// Compute total time based on editable values
const totalTime = computed(() => {
  const prep = editableRecipe.value.prepTime ?? 0;
  const cook = editableRecipe.value.cookTime ?? 0;
  return prep + cook > 0 ? prep + cook : null;
});

// --- Step Management ---
const addStep = () => {
  editableRecipe.value.steps.push({
    id: `temp-${uuidv4()}`, // Temporary client-side ID
    description: '',
    order: editableRecipe.value.steps.length + 1,
    timer: null, // Initialize timer as null
  });
};

const removeStep = (index: number) => {
  editableRecipe.value.steps.splice(index, 1);
  // Re-order remaining steps
  editableRecipe.value.steps.forEach((step, i) => {
    step.order = i + 1;
  });
};

// --- Ingredient Management ---
const addIngredient = () => {
  editableRecipe.value.ingredients.push({
    id: `temp-${uuidv4()}`, // Temporary client-side ID
    name: '',
    quantity: null,
    unit: null,
    notes: null,
    category: null,
    isInStock: false, // Default value
  });
};

const removeIngredient = (index: number) => {
  editableRecipe.value.ingredients.splice(index, 1);
};

// --- Utensil Management ---
// Placeholder for add/remove utensil functions

// --- Event Handlers ---
const handleSave = () => {
  // Process steps (as before)
  const stepsToSave = editableRecipe.value.steps.map((step) => ({
    ...step,
    id: step.id.startsWith('temp-') ? undefined : step.id, // Send undefined for temp IDs if backend generates
    timer: step.timer || null,
  })) as unknown as Step[];

  // Process ingredients
  const ingredientsToSave = editableRecipe.value.ingredients
    .map((ing) => ({
      ...ing,
      id: ing.id.startsWith('temp-') ? undefined : ing.id,
      quantity: ing.quantity || null,
      unit: ing.unit || null,
      name: ing.name,
      notes: ing.notes || null,
      category: ing.category || null,
    }))
    .filter((ing) => ing.name) as unknown as Ingredient[];

  // Process utensils (placeholder)
  const utensilsToSave =
    (editableRecipe.value.utensils?.map((ut) => ({
      ...ut,
      id: ut.id.startsWith('temp-') ? undefined : ut.id, // Assuming utensils might also need temp IDs
    })) as unknown as Utensil[]) || [];

  const recipeToSave: Recipe = {
    ...editableRecipe.value,
    id: props.recipe.id,
    title: editableRecipe.value.title,
    description: editableRecipe.value.description || null,
    prepTime: editableRecipe.value.prepTime || null,
    cookTime: editableRecipe.value.cookTime || null,
    cuisine: editableRecipe.value.cuisine || null,
    portions: Math.max(1, editableRecipe.value.portions),
    sourceUrl: editableRecipe.value.sourceUrl || null,
    youtubeUrl: editableRecipe.value.youtubeUrl || null,
    imageUrl: editableRecipe.value.imageUrl || null,
    isFavorite: editableRecipe.value.isFavorite ?? false,
    isVegetarian: editableRecipe.value.isVegetarian ?? false,
    userId: editableRecipe.value.userId,
    householdId: editableRecipe.value.householdId,
    authorName: editableRecipe.value.authorName,
    youtubeVideoId: editableRecipe.value.youtubeVideoId,
    createdAt: editableRecipe.value.createdAt,
    updatedAt: new Date(),
    ingredients: ingredientsToSave,
    steps: stepsToSave,
    utensils: utensilsToSave,
  };

  console.log(
    'Recipe to save:',
    JSON.stringify(recipeToSave, null, 2)
  );
  emit('save', recipeToSave);
};

const handleCancel = () => {
  // Reset editableRecipe directly from the original prop
  editableRecipe.value = JSON.parse(JSON.stringify(props.recipe));
  emit('cancel');
};
</script>

<template>
  <section class="pb-24">
    <!-- Padding for potential fixed bottom bar -->

    <!-- Title Input -->
    <div class="p-4">
      <label
        for="recipe-title"
        class="block text-sm font-medium text-gray-700 mb-1"
        >Titel</label
      >
      <UInput
        id="recipe-title"
        v-model="titleModel"
        placeholder="Recept titel"
        size="xl"
        class="w-full text-lg font-semibold"
        data-testid="recipe-title-input"
      />
    </div>

    <!-- Image/Video URL Input -->
    <div class="p-4 border-t border-b border-gray-200">
      <label
        for="recipe-image-url"
        class="block text-sm font-medium text-gray-700 mb-1"
        >Afbeelding URL (Optioneel)</label
      >
      <UInput
        id="recipe-image-url"
        v-model="imageUrlModel"
        placeholder="https://voorbeeld.com/afbeelding.jpg"
        data-testid="recipe-image-url-input"
      />
      <label
        for="recipe-youtube-url"
        class="block text-sm font-medium text-gray-700 mt-3 mb-1"
        >YouTube URL (Optioneel)</label
      >
      <UInput
        id="recipe-youtube-url"
        v-model="youtubeUrlModel"
        placeholder="https://www.youtube.com/watch?v=..."
        data-testid="recipe-youtube-url-input"
      />
    </div>

    <!-- Description Input -->
    <div class="p-4">
      <label
        for="recipe-description"
        class="block text-sm font-medium text-gray-700 mb-1"
        >Beschrijving (Optioneel)</label
      >
      <UTextarea
        id="recipe-description"
        v-model="descriptionModel"
        placeholder="Korte beschrijving van het recept"
        :rows="3"
        data-testid="recipe-description-input"
      />
    </div>

    <!-- Simplified Tabs for Editing -->
    <div class="px-4 pt-4 bg-white shadow-sm">
      <!-- Tab headers -->
      <div
        class="flex justify-between bg-gray-50 p-1 rounded-lg w-full mb-6"
      >
        <button
          v-for="item in items"
          :key="item.key"
          @click="selectedTab = item.key"
          class="flex flex-1 justify-center items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150"
          :class="[
            selectedTab === item.key
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-500 hover:bg-gray-100',
          ]"
        >
          <UIcon
            :name="item.icon"
            class="w-5 h-5 mr-2"
            :class="
              selectedTab === item.key
                ? 'text-primary-500'
                : 'text-gray-400'
            "
          />
          {{ item.label }}
        </button>
      </div>

      <!-- Tab Content -->
      <!-- Details Tab Content -->
      <div
        v-show="selectedTab === 'details'"
        class="space-y-4"
        data-testid="details-tab-content"
      >
        <!-- Metadata Inputs -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label
              for="prep-time"
              class="block text-sm font-medium text-gray-700 mb-1"
              >Voorbereiding (min)</label
            >
            <UInput
              id="prep-time"
              type="number"
              v-model.number="prepTimeModel"
              placeholder="0"
              data-testid="prep-time-input"
            />
          </div>
          <div>
            <label
              for="cook-time"
              class="block text-sm font-medium text-gray-700 mb-1"
              >Bereiding (min)</label
            >
            <UInput
              id="cook-time"
              type="number"
              v-model.number="cookTimeModel"
              placeholder="0"
              data-testid="cook-time-input"
            />
          </div>
          <div>
            <label
              for="portions"
              class="block text-sm font-medium text-gray-700 mb-1"
              >Porties</label
            >
            <UInput
              id="portions"
              type="number"
              v-model.number="portionsModel"
              placeholder="bv. 4"
              min="1"
              data-testid="portions-input"
            />
          </div>
          <div>
            <label
              for="cuisine"
              class="block text-sm font-medium text-gray-700 mb-1"
              >Keuken (Optioneel)</label
            >
            <UInput
              id="cuisine"
              v-model="cuisineModel"
              placeholder="bv. Italiaans"
              data-testid="cuisine-input"
            />
          </div>
        </div>
        <div>
          <label
            for="source-url"
            class="block text-sm font-medium text-gray-700 mb-1"
            >Bron URL (Optioneel)</label
          >
          <UInput
            id="source-url"
            v-model="sourceUrlModel"
            placeholder="https://bronwebsite.nl/recept"
            data-testid="source-url-input"
          />
        </div>
        <div class="flex items-center space-x-3 mt-4">
          <UCheckbox
            id="vegetarian-checkbox"
            v-model="editableRecipe.isVegetarian"
            label="Vegetarisch"
            data-testid="vegetarian-checkbox"
          />
          <UCheckbox
            id="favorite-checkbox"
            v-model="editableRecipe.isFavorite"
            label="Favoriet"
            data-testid="favorite-checkbox"
          />
        </div>
      </div>

      <!-- Ingredients Tab Content -->
      <div
        v-show="selectedTab === 'ingredients'"
        class="mt-6 px-2"
        data-testid="ingredients-tab-content-edit"
      >
        <h3 class="text-lg font-semibold text-gray-800 mb-4">
          Ingrediënten
        </h3>

        <div class="space-y-6">
          <div
            v-for="(ingredient, index) in editableRecipe.ingredients"
            :key="ingredient.id || `ing-${index}`"
            class="p-4 border border-gray-200 rounded-lg shadow-sm space-y-3 relative"
            data-testid="ingredient-edit-item"
          >
            <UButton
              icon="i-heroicons-x-mark"
              color="red"
              variant="ghost"
              size="xs"
              class="absolute top-2 right-2"
              aria-label="Verwijder ingrediënt"
              @click="removeIngredient(index)"
              data-testid="remove-ingredient-button"
            />

            <!-- Row 1: Quantity, Unit, Name -->
            <div
              class="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,3fr)] gap-3"
            >
              <div>
                <label
                  :for="`ing-qty-${index}`"
                  class="block text-sm font-medium text-gray-700 mb-1"
                  >Hvh.</label
                >
                <UInput
                  :id="`ing-qty-${index}`"
                  type="number"
                  :value="ingredient.quantity ?? undefined"
                  @input="
                    (event: Event) =>
                      (ingredient.quantity = (
                        event.target as HTMLInputElement
                      ).value
                        ? parseFloat(
                            (event.target as HTMLInputElement).value
                          )
                        : null)
                  "
                  placeholder="0"
                  min="0"
                  step="0.1"
                  data-testid="ingredient-quantity-input"
                />
              </div>
              <div>
                <label
                  :for="`ing-unit-${index}`"
                  class="block text-sm font-medium text-gray-700 mb-1"
                  >Eenheid</label
                >
                <UInput
                  :id="`ing-unit-${index}`"
                  :value="ingredient.unit ?? ''"
                  @input="
                    (event: Event) =>
                      (ingredient.unit =
                        (event.target as HTMLInputElement).value ||
                        null)
                  "
                  placeholder="bv. gr, ml, stuks"
                  data-testid="ingredient-unit-input"
                />
              </div>
              <div class="sm:col-span-1">
                <label
                  :for="`ing-name-${index}`"
                  class="block text-sm font-medium text-gray-700 mb-1"
                  >Naam*</label
                >
                <UInput
                  :id="`ing-name-${index}`"
                  v-model="ingredient.name"
                  placeholder="Naam van ingrediënt"
                  required
                  data-testid="ingredient-name-input"
                />
              </div>
            </div>

            <!-- Row 2: Notes, Category -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  :for="`ing-notes-${index}`"
                  class="block text-sm font-medium text-gray-700 mb-1"
                  >Notities</label
                >
                <UInput
                  :id="`ing-notes-${index}`"
                  :value="ingredient.notes ?? ''"
                  @input="
                    (event: Event) =>
                      (ingredient.notes =
                        (event.target as HTMLInputElement).value ||
                        null)
                  "
                  placeholder="Optionele notities"
                  data-testid="ingredient-notes-input"
                />
              </div>
              <div>
                <label
                  :for="`ing-cat-${index}`"
                  class="block text-sm font-medium text-gray-700 mb-1"
                  >Categorie</label
                >
                <USelectMenu
                  :id="`ing-cat-${index}`"
                  :model-value="ingredient.category ?? undefined"
                  @update:model-value="
                    (value: IngredientCategory | undefined) =>
                      (ingredient.category = value ?? null)
                  "
                  :options="categories"
                  placeholder="Selecteer categorie"
                  searchable
                  clear-search-on-close
                  searchable-placeholder="Zoek categorie..."
                  nullable
                  data-testid="ingredient-category-select"
                />
              </div>
            </div>
          </div>
        </div>

        <UButton
          label="Ingrediënt toevoegen"
          icon="i-heroicons-plus-circle"
          variant="outline"
          @click="addIngredient"
          data-testid="add-ingredient-button"
          class="mt-6"
        />
      </div>

      <!-- Instructions Tab Content -->
      <div
        v-show="selectedTab === 'instructions'"
        class="mt-6 px-2 space-y-6"
        data-testid="instructions-tab-content-edit"
      >
        <h3 class="text-lg font-semibold text-gray-800 mb-4">
          Bereidingsstappen
        </h3>

        <div class="space-y-6">
          <div
            v-for="(step, index) in editableRecipe.steps"
            :key="step.id || `step-${index}`"
            class="flex items-start gap-4 p-4 border border-gray-200 rounded-lg shadow-sm"
            data-testid="step-edit-item"
          >
            <span class="font-semibold text-gray-500 pt-2"
              >{{ index + 1 }}.</span
            >
            <div class="flex-1 space-y-3">
              <div>
                <label
                  :for="`step-desc-${index}`"
                  class="block text-sm font-medium text-gray-700 mb-1"
                  >Beschrijving</label
                >
                <UTextarea
                  :id="`step-desc-${index}`"
                  v-model="step.description"
                  placeholder="Beschrijf deze stap..."
                  :rows="3"
                  data-testid="step-description-input"
                />
              </div>
              <div>
                <label
                  :for="`step-timer-${index}`"
                  class="block text-sm font-medium text-gray-700 mb-1"
                  >Timer (min, optioneel)</label
                >
                <UInput
                  :id="`step-timer-${index}`"
                  type="number"
                  :value="step.timer ?? undefined"
                  @input="
                    (event: Event) =>
                      (step.timer = (event.target as HTMLInputElement)
                        .value
                        ? parseInt(
                            (event.target as HTMLInputElement).value,
                            10
                          )
                        : null)
                  "
                  placeholder="0"
                  min="0"
                  data-testid="step-timer-input"
                />
              </div>
            </div>
            <UButton
              icon="i-heroicons-trash"
              color="red"
              variant="ghost"
              size="sm"
              class="mt-1"
              aria-label="Verwijder stap"
              @click="removeStep(index)"
              data-testid="remove-step-button"
            />
          </div>
        </div>

        <UButton
          label="Stap toevoegen"
          icon="i-heroicons-plus-circle"
          variant="outline"
          @click="addStep"
          data-testid="add-step-button"
          class="mt-6"
        />

        <!-- Utensil list editing UI will go here -->
        <p
          class="text-gray-500 italic mt-8 pt-4 border-t border-gray-200"
        >
          Bewerkbare keukengerei lijst komt hier...
        </p>
      </div>
    </div>

    <!-- Fixed Bottom Action Bar (Example) -->
    <div
      class="fixed bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-200 z-10 flex gap-4"
    >
      <UButton
        variant="outline"
        color="gray"
        size="lg"
        label="Annuleren"
        @click="handleCancel"
        class="flex-1 font-bold"
        data-testid="cancel-button"
      />
      <UButton
        size="lg"
        label="Opslaan"
        @click="handleSave"
        class="flex-1 font-bold"
        data-testid="save-button"
      />
    </div>
  </section>
</template>

<style scoped>
/* Add any specific styles for the edit view if needed */
</style>
