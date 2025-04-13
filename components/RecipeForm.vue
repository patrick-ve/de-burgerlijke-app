<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import type { PropType } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import type { Recipe, Ingredient, Step, Utensil } from '~/types/recipe';

const props = defineProps({
  initialRecipe: {
    type: Object as PropType<Recipe | null>,
    default: null,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{ (e: 'submit', recipe: Recipe): void; (e: 'cancel'): void }>();

// Deep clone initial data or set default structure
const getDefaultFormData = (): Recipe => ({
  // Initialize with default/empty values, use null for optional fields
  id: null,
  title: '',
  description: null,
  prepTime: null,
  cookTime: null,
  cuisine: null,
  portions: 1,
  ingredients: [{ id: uuidv4(), quantity: null, unit: null, name: '', notes: null }],
  steps: [{ id: uuidv4(), description: '', order: 1 }],
  utensils: [{ id: uuidv4(), name: '' }],
  isFavorite: false,
  userId: null, // Should be set server-side or based on logged-in user
  householdId: null,
  sourceUrl: null,
  imageUrl: null,
});

// Use reactive for the form data object
const formData = reactive<Recipe>(getDefaultFormData());

// Watch for changes in initialRecipe prop to reset the form
watch(
  () => props.initialRecipe,
  (newInitialRecipe) => {
    // Deep copy to avoid mutating the prop
    const recipeToEdit = newInitialRecipe ? JSON.parse(JSON.stringify(newInitialRecipe)) : getDefaultFormData();
    // Ensure dynamic arrays have unique IDs if missing
    recipeToEdit.ingredients = recipeToEdit.ingredients.map((ing: Ingredient) => ({ ...ing, id: ing.id || uuidv4() }));
    recipeToEdit.steps = recipeToEdit.steps.map((step: Step) => ({ ...step, id: step.id || uuidv4() }));
    recipeToEdit.utensils = recipeToEdit.utensils.map((utensil: Utensil) => ({ ...utensil, id: utensil.id || uuidv4() }));
    // Update reactive formData
    Object.assign(formData, recipeToEdit);
  },
  { immediate: true, deep: true }
);

// --- Helper function to update nullable string fields ---
const updateNullableStringField = (field: 'description' | 'prepTime' | 'cookTime' | 'cuisine', value: string) => {
  formData[field] = value.trim() === '' ? null : value;
};

// --- Ingredient Management ---
const addIngredient = () => {
  formData.ingredients.push({ id: uuidv4(), quantity: null, unit: null, name: '', notes: null });
};

const removeIngredient = (index: number) => {
  if (formData.ingredients.length > 1) { // Keep at least one ingredient field
    formData.ingredients.splice(index, 1);
  }
};

const updateIngredientField = (index: number, field: keyof Ingredient, value: string | number) => {
  const ingredient = formData.ingredients[index];
  if (!ingredient) return;

  switch (field) {
    case 'quantity':
      const num = typeof value === 'string' ? parseFloat(value) : value;
      ingredient.quantity = isNaN(num) || value === '' ? null : num;
      break;
    case 'unit':
    case 'notes':
      // Ensure value is treated as string for trim() and assignment
      const strValue = String(value); 
      ingredient[field] = strValue.trim() === '' ? null : strValue;
      break;
    case 'name': // Name is required, should not be null
      ingredient.name = String(value); // Ensure value is string
      break;
    // id is handled internally
  }
};

// --- Step Management ---
const addStep = () => {
  const nextOrder = formData.steps.length > 0 ? Math.max(...formData.steps.map(s => s.order)) + 1 : 1;
  formData.steps.push({ id: uuidv4(), description: '', order: nextOrder });
};

const removeStep = (index: number) => {
  if (formData.steps.length > 1) { // Keep at least one step field
    formData.steps.splice(index, 1);
    // Re-order remaining steps
    formData.steps.forEach((step, i) => step.order = i + 1);
  }
};

// --- Utensil Management ---
const addUtensil = () => {
  formData.utensils.push({ id: uuidv4(), name: '' });
};

const removeUtensil = (index: number) => {
  // Allow removing all utensils
  formData.utensils.splice(index, 1);
};

// --- Submission and Cancellation ---
const handleSubmit = () => {
  // Perform basic validation or cleanup if needed before emitting
  // e.g., remove empty ingredient/step/utensil entries
  const cleanedData = JSON.parse(JSON.stringify(formData)); // Deep clone before potential modification

  cleanedData.ingredients = cleanedData.ingredients.filter((ing: Ingredient) => ing.name.trim() !== '');
  cleanedData.steps = cleanedData.steps.filter((step: Step) => step.description.trim() !== '');
  cleanedData.utensils = cleanedData.utensils.filter((utensil: Utensil) => utensil.name.trim() !== '');
  cleanedData.steps.forEach((step: Step, i: number) => step.order = i + 1); // Ensure order is sequential

  emit('submit', cleanedData);
};

const handleCancel = () => {
  emit('cancel');
};

const formTitle = computed(() => props.initialRecipe?.id ? 'Edit Recipe' : 'Create New Recipe');
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-xl font-semibold">{{ formTitle }}</h2>
    </template>

    <form @submit.prevent="handleSubmit">
      <div class="space-y-6">
        <!-- Basic Info -->
        <UFieldset legend="Basic Information" class="space-y-4">
           <UFormGroup label="Title" name="title" required>
             <UInput v-model="formData.title" name="title" placeholder="e.g., Chocolate Chip Cookies" required />
           </UFormGroup>

           <UFormGroup label="Description" name="description">
             <UTextarea
               :model-value="formData.description ?? ''"
               @update:model-value="value => updateNullableStringField('description', value)"
               name="description"
               placeholder="A short summary of the recipe"
               :rows="3"
              />
           </UFormGroup>

           <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
             <UFormGroup label="Prep Time" name="prepTime">
               <UInput
                 :model-value="formData.prepTime ?? ''"
                 @update:model-value="value => updateNullableStringField('prepTime', value)"
                 name="prepTime"
                 placeholder="e.g., 15 min"
               />
             </UFormGroup>
             <UFormGroup label="Cook Time" name="cookTime">
               <UInput
                 :model-value="formData.cookTime ?? ''"
                 @update:model-value="value => updateNullableStringField('cookTime', value)"
                 name="cookTime"
                 placeholder="e.g., 30 min"
               />
             </UFormGroup>
             <UFormGroup label="Cuisine" name="cuisine">
               <UInput
                 :model-value="formData.cuisine ?? ''"
                 @update:model-value="value => updateNullableStringField('cuisine', value)"
                 name="cuisine"
                 placeholder="e.g., Italian"
               />
             </UFormGroup>
           </div>

           <UFormGroup label="Portions" name="portions" required>
             <UInput v-model.number="formData.portions" type="number" name="portions" :min="1" required />
           </UFormGroup>
        </UFieldset>

        <!-- Ingredients -->
        <UFieldset legend="Ingredients" class="space-y-4">
          <div v-for="(ingredient, index) in formData.ingredients" :key="ingredient.id" class="ingredient-group grid grid-cols-1 sm:grid-cols-[1fr_1fr_2fr_auto] gap-2 items-end border-b border-gray-200 dark:border-gray-700 pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
            <UFormGroup label="Quantity" :name="`ingredient-quantity-${index}`" class="col-span-1 sm:col-span-1">
              <UInput
                :model-value="ingredient.quantity ?? ''"
                @update:model-value="value => updateIngredientField(index, 'quantity', value)"
                type="number"
                :name="`ingredient-quantity-${index}`"
                placeholder="e.g., 2"
                :min="0"
                step="any"
              />
            </UFormGroup>
            <UFormGroup label="Unit" :name="`ingredient-unit-${index}`" class="col-span-1 sm:col-span-1">
              <UInput
                :model-value="ingredient.unit ?? ''"
                @update:model-value="value => updateIngredientField(index, 'unit', value)"
                :name="`ingredient-unit-${index}`"
                placeholder="e.g., cups, tbsp"
              />
            </UFormGroup>
            <UFormGroup label="Name" :name="`ingredient-name-${index}`" class="col-span-full sm:col-span-1" required>
              <UInput
                v-model="ingredient.name" 
                :name="`ingredient-name-${index}`"
                placeholder="e.g., All-purpose Flour"
                required
               />
            </UFormGroup>
             <UFormGroup label="Notes (Optional)" :name="`ingredient-notes-${index}`" class="col-span-full sm:col-span-full">
               <UInput
                 :model-value="ingredient.notes ?? ''"
                 @update:model-value="value => updateIngredientField(index, 'notes', value)"
                 :name="`ingredient-notes-${index}`"
                 placeholder="e.g., sifted, finely chopped"
                />
             </UFormGroup>
            <UButton
              v-if="formData.ingredients.length > 1"
              icon="i-heroicons-trash"
              color="red"
              variant="soft"
              type="button"
              aria-label="Remove Ingredient"
              class="remove-item self-end mb-1"
              data-testid="remove-ingredient-button"
              @click="removeIngredient(index)"
            />
          </div>
          <UButton
            label="Add Ingredient"
            icon="i-heroicons-plus-circle"
            type="button"
            variant="outline"
            class="add-ingredient"
            data-testid="add-ingredient-button"
            @click="addIngredient"
          />
        </UFieldset>

        <!-- Steps -->
        <UFieldset legend="Steps" class="space-y-4">
          <div v-for="(step, index) in formData.steps" :key="step.id" class="step-group flex items-start gap-2 border-b border-gray-200 dark:border-gray-700 pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
            <span class="mt-2 font-medium text-gray-500 dark:text-gray-400">{{ index + 1 }}.</span>
            <UFormGroup :label="`Step ${index + 1}`" :name="`step-description-${index}`" class="flex-grow" required>
               <UTextarea
                 v-model="step.description"
                 :name="`step-description-${index}`"
                 placeholder="e.g., Mix dry ingredients"
                 required
                 :rows="2"
                />
            </UFormGroup>
            <UButton
              v-if="formData.steps.length > 1"
              icon="i-heroicons-trash"
              color="red"
              variant="soft"
              type="button"
              aria-label="Remove Step"
              class="remove-item self-start mt-1"
              data-testid="remove-step-button"
              @click="removeStep(index)"
            />
          </div>
          <UButton
            label="Add Step"
            icon="i-heroicons-plus-circle"
            type="button"
            variant="outline"
            class="add-step"
            data-testid="add-step-button"
            @click="addStep"
          />
        </UFieldset>

        <!-- Utensils -->
        <UFieldset legend="Utensils" class="space-y-4">
          <div v-for="(utensil, index) in formData.utensils" :key="utensil.id" class="utensil-group flex items-end gap-2 border-b border-gray-200 dark:border-gray-700 pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
            <UFormGroup label="Utensil Name" :name="`utensil-name-${index}`" class="flex-grow" required>
              <UInput
                v-model="utensil.name"
                :name="`utensil-name-${index}`"
                placeholder="e.g., Mixing bowl, Whisk"
                required
              />
            </UFormGroup>
            <UButton
              icon="i-heroicons-trash"
              color="red"
              variant="soft"
              type="button"
              aria-label="Remove Utensil"
              class="remove-item mb-1"
              data-testid="remove-utensil-button"
              @click="removeUtensil(index)"
            />
          </div>
          <UButton
            label="Add Utensil"
            icon="i-heroicons-plus-circle"
            type="button"
            variant="outline"
            class="add-utensil"
            data-testid="add-utensil-button"
            @click="addUtensil"
          />
        </UFieldset>

      </div>

      <!-- Actions -->
      <div class="mt-8 flex justify-end space-x-3">
        <UButton
          label="Cancel"
          color="gray"
          variant="ghost"
          type="button"
          data-testid="cancel-button"
          @click="handleCancel"
        />
        <UButton
          :label="formTitle === 'Edit Recipe' ? 'Update Recipe' : 'Create Recipe'"
          type="submit"
          :loading="isSubmitting"
          data-testid="submit-button"
        />
      </div>
    </form>
  </UCard>
</template> 