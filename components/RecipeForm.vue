<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import type { PropType } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import type { Recipe, Ingredient, Step, Utensil } from '~/types/recipe';
import { useFieldArray } from '~/composables/useFieldArray'; // Import the composable

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

// Define default structure for the main form data (excluding arrays)
const getDefaultBaseFormData = (): Omit<Recipe, 'ingredients' | 'steps' | 'utensils' | 'id' | 'createdAt' | 'updatedAt'> => ({
  title: '',
  description: null,
  prepTime: null,
  cookTime: null,
  cuisine: null,
  portions: 1,
  isFavorite: false,
  userId: null,
  householdId: null,
  sourceUrl: null,
  imageUrl: null,
});

// Use reactive for the base form data
const baseFormData = reactive(getDefaultBaseFormData());

// --- Use useFieldArray for dynamic sections --- 

const ingredientFactory = (): Omit<Ingredient, 'id'> => ({ quantity: null, unit: null, name: '', notes: null });
const { fields: ingredientFields, append: appendIngredient, remove: removeIngredient, replace: replaceIngredients } = useFieldArray<Ingredient>('ingredients', { itemFactory: ingredientFactory });

const stepFactory = (): Omit<Step, 'id'> => ({ description: '', order: 1 }); // Order will be recalculated
const { fields: stepFields, append: appendStep, remove: removeStep, replace: replaceSteps } = useFieldArray<Step>('steps', { itemFactory: stepFactory });

const utensilFactory = (): Omit<Utensil, 'id'> => ({ name: '' });
const { fields: utensilFields, append: appendUtensil, remove: removeUtensil, replace: replaceUtensils } = useFieldArray<Utensil>('utensils', { itemFactory: utensilFactory });

// --- Watch for initial data changes ---
watch(
  () => props.initialRecipe,
  (newInitialRecipe) => {
    if (newInitialRecipe) {
      // Deep copy to avoid mutating the prop
      const recipeToEdit = JSON.parse(JSON.stringify(newInitialRecipe));
      // Update base form data
      Object.assign(baseFormData, {
          title: recipeToEdit.title,
          description: recipeToEdit.description,
          prepTime: recipeToEdit.prepTime,
          cookTime: recipeToEdit.cookTime,
          cuisine: recipeToEdit.cuisine,
          portions: recipeToEdit.portions,
          isFavorite: recipeToEdit.isFavorite,
          userId: recipeToEdit.userId,
          householdId: recipeToEdit.householdId,
          sourceUrl: recipeToEdit.sourceUrl,
          imageUrl: recipeToEdit.imageUrl,
      });
      // Replace array data using composable's replace function
      // Provide a default item with ID if the initial array is null/empty
      replaceIngredients(recipeToEdit.ingredients && recipeToEdit.ingredients.length > 0 
        ? recipeToEdit.ingredients 
        : [{ ...ingredientFactory(), id: uuidv4() }]);
      replaceSteps(recipeToEdit.steps && recipeToEdit.steps.length > 0 
        ? recipeToEdit.steps 
        : [{ ...stepFactory(), id: uuidv4() }]);
      replaceUtensils(recipeToEdit.utensils || []); // Allow empty utensils
    } else {
      // Reset to defaults, ensuring at least one item with ID
      Object.assign(baseFormData, getDefaultBaseFormData());
      replaceIngredients([{ ...ingredientFactory(), id: uuidv4() }]);
      replaceSteps([{ ...stepFactory(), id: uuidv4() }]);
      replaceUtensils([]); // Start with no utensils on reset
    }
     // Ensure at least one item exists if arrays are empty after load/reset
     // This check is likely redundant now due to the logic above but kept for safety
     if (ingredientFields.value.length === 0) appendIngredient();
     if (stepFields.value.length === 0) appendStep();
     // Utensils can be empty

  },
  { immediate: true, deep: true }
);

// --- Helper function to update nullable string fields in baseFormData ---
const updateNullableStringField = (field: keyof typeof baseFormData, value: string) => {
  // Only update fields that exist in baseFormData
  if (field in baseFormData) {
     (baseFormData as any)[field] = value.trim() === '' ? null : value;
  }
};

// --- Specific Update Handlers for Array Fields ---
const updateIngredientField = (index: number, field: keyof Omit<Ingredient, 'id'>, value: string | number | null) => {
  const ingredient = ingredientFields.value[index];
  if (!ingredient) return;

  let processedValue: string | number | null = value;

  switch (field) {
    case 'quantity':
      const num = typeof value === 'string' && value.trim() !== '' ? parseFloat(value) : value;
      processedValue = (typeof num === 'number' && !isNaN(num)) ? num : null;
      break;
    case 'unit':
    case 'notes':
      processedValue = typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
      break;
    case 'name': // Name is required, trim but don't set to null
      processedValue = typeof value === 'string' ? value.trim() : '';
      break;
  }

  // Use spread operator to update the item reactively
  ingredientFields.value[index] = { ...ingredient, [field]: processedValue };
};

const updateStepDescription = (index: number, value: string) => {
  const step = stepFields.value[index];
  if (!step) return;
  stepFields.value[index] = { ...step, description: value.trim() }; // Update reactively
};

const updateUtensilName = (index: number, value: string) => {
  const utensil = utensilFields.value[index];
  if (!utensil) return;
  utensilFields.value[index] = { ...utensil, name: value.trim() }; // Update reactively
};

// --- Submission and Cancellation ---
const handleSubmit = () => {
  // Construct the final Recipe object
  const finalRecipe: Recipe = {
    ...baseFormData,
    id: props.initialRecipe?.id || null, // Use existing ID or null for new
    ingredients: ingredientFields.value
        .map(ing => ({...ing, name: ing.name.trim()})) // Ensure name is trimmed
        .filter(ing => ing.name !== ''), // Filter out ingredients without a name
    steps: stepFields.value
        .map(step => ({...step, description: step.description.trim()})) // Ensure description is trimmed
        .filter(step => step.description !== '') // Filter out steps without description
        .map((step, i) => ({ ...step, order: i + 1 })), // Recalculate order
    utensils: utensilFields.value
        .map(ut => ({...ut, name: ut.name.trim()})) // Ensure name is trimmed
        .filter(ut => ut.name !== ''), // Filter out empty utensils
    // Timestamps should be handled server-side or just before submission if needed client-side
    createdAt: props.initialRecipe?.createdAt ?? new Date(), // Keep original or set new
    updatedAt: new Date(), // Always set update time
    userId: props.initialRecipe?.userId ?? baseFormData.userId, // Keep original user ID if editing
  };

  emit('submit', finalRecipe);
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
             <UInput v-model="baseFormData.title" name="title" placeholder="e.g., Chocolate Chip Cookies" required />
           </UFormGroup>

           <UFormGroup label="Description" name="description">
             <UTextarea
               :model-value="baseFormData.description ?? ''"
               @update:model-value="value => updateNullableStringField('description', value)"
               name="description"
               placeholder="A short summary of the recipe"
               :rows="3"
              />
           </UFormGroup>

           <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
             <UFormGroup label="Prep Time" name="prepTime">
               <UInput
                 :model-value="baseFormData.prepTime ?? ''"
                 @update:model-value="value => updateNullableStringField('prepTime', value)"
                 name="prepTime"
                 placeholder="e.g., 15 min"
               />
             </UFormGroup>
             <UFormGroup label="Cook Time" name="cookTime">
               <UInput
                 :model-value="baseFormData.cookTime ?? ''"
                 @update:model-value="value => updateNullableStringField('cookTime', value)"
                 name="cookTime"
                 placeholder="e.g., 30 min"
               />
             </UFormGroup>
             <UFormGroup label="Cuisine" name="cuisine">
               <UInput
                 :model-value="baseFormData.cuisine ?? ''"
                 @update:model-value="value => updateNullableStringField('cuisine', value)"
                 name="cuisine"
                 placeholder="e.g., Italian"
               />
             </UFormGroup>
           </div>

           <UFormGroup label="Portions" name="portions" required>
             <UInput v-model.number="baseFormData.portions" type="number" name="portions" :min="1" required />
           </UFormGroup>
        </UFieldset>

        <!-- Ingredients -->
        <UFieldset legend="Ingredients" class="space-y-4">
          <div v-for="(ingredient, index) in ingredientFields" :key="ingredient.id" class="ingredient-group grid grid-cols-1 sm:grid-cols-[1fr_1fr_2fr_auto] gap-2 items-end border-b border-gray-200 dark:border-gray-700 pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
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
                :model-value="ingredient.name"
                @update:model-value="value => updateIngredientField(index, 'name', value)"
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
              v-if="ingredientFields.length > 1"
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
            @click="appendIngredient()"
          />
        </UFieldset>

        <!-- Steps -->
        <UFieldset legend="Steps" class="space-y-4">
          <div v-for="(step, index) in stepFields" :key="step.id" class="step-group flex items-start gap-2 border-b border-gray-200 dark:border-gray-700 pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
            <span class="mt-2 font-medium text-gray-500 dark:text-gray-400">{{ index + 1 }}.</span>
            <UFormGroup :label="`Step ${index + 1}`" :name="`step-description-${index}`" class="flex-grow" required>
               <UTextarea
                 :model-value="step.description"
                 @update:model-value="value => updateStepDescription(index, value)"
                 :name="`step-description-${index}`"
                 placeholder="e.g., Mix dry ingredients"
                 required
                 :rows="2"
                />
            </UFormGroup>
            <UButton
              v-if="stepFields.length > 1"
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
            @click="appendStep()"
          />
        </UFieldset>

        <!-- Utensils -->
        <UFieldset legend="Utensils" class="space-y-4">
          <div v-for="(utensil, index) in utensilFields" :key="utensil.id" class="utensil-group flex items-end gap-2 border-b border-gray-200 dark:border-gray-700 pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
            <UFormGroup label="Utensil Name" :name="`utensil-name-${index}`" class="flex-grow" required>
              <UInput
                :model-value="utensil.name"
                @update:model-value="value => updateUtensilName(index, value)"
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
            @click="appendUtensil()"
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