<template>
  <div>
    <!-- The h1 can be removed if the header title is sufficient -->
    <!-- <h1>Add New Recipe</h1> -->
    <RecipeForm @save="handleSave" ref="recipeFormRef" />
    <!-- Add a link back to the recipe list -->
    <!-- <NuxtLink to="/recipes">Back to Recipes</NuxtLink> -->
    <!-- Replaced by header back button -->

    <!-- Teleport buttons to the header -->
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

    <Teleport to="#header-right-action" v-if="isMounted">
      <UButton
        v-if="headerState.showRightAction"
        icon="i-heroicons-check"
        variant="ghost"
        color="primary"
        aria-label="Save"
        @click="triggerRightAction"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import type { Recipe } from '~/types/recipe'; // Assuming Recipe type exists
import { useHeaderState } from '~/composables/useHeaderState'; // Ensure correct path
import RecipeForm from '~/components/RecipeForm.vue'; // Assuming component exists

const router = useRouter();
const { headerState, setHeader, resetHeader, defaultLeftAction } =
  useHeaderState();
const recipeFormRef = ref<InstanceType<typeof RecipeForm> | null>(
  null
); // Ref to access form if needed
const isMounted = ref(false); // Flag to prevent teleporting before mount

// Local handlers for buttons, which will call the handlers stored in headerState
const triggerLeftAction = () => {
  if (headerState.value.leftActionHandler) {
    headerState.value.leftActionHandler();
  }
};

const triggerRightAction = () => {
  if (headerState.value.rightActionHandler) {
    headerState.value.rightActionHandler();
  }
};

// Placeholder for handling the save event from RecipeForm OR triggered by header
const handleSave = async (recipeData?: Recipe) => {
  // If called from header, recipeData might be undefined.
  // You might need to get data from the form ref or ensure RecipeForm emits data on change
  // For simplicity, let's assume RecipeForm keeps its state internally and we can trigger a save method or validation
  console.log('Attempting to save recipe...');

  // Example: Trigger validation or get data from form component
  // const isValid = await recipeFormRef.value?.validate();
  // if (!isValid) {
  //   alert('Please fill out the form correctly.');
  //   return;
  // }
  // const dataToSave = recipeFormRef.value?.formData; // Assuming form exposes its data

  // Simulate using data passed from event if available (e.g., if form emits on every change and save)
  const dataToSave = recipeData; // This line needs refinement based on how RecipeForm works
  if (!dataToSave) {
    // This check might be too strict if triggered from header button before form emits.
    // Needs adjustment based on RecipeForm implementation.
    // For now, let's assume we *expect* data here if the @save event fired.
    // If called from header, we'll rely on form state later.
    console.warn(
      'Recipe data not passed directly to handleSave. This might be expected if called from header.'
    );
    // alert('Recipe data is missing.'); // Avoid alerting prematurely
    // return;
  }

  console.log('Recipe data to save (if provided):', dataToSave);
  // Replace with actual API call to save the new recipe
  try {
    // Example: Fetch data from form ref if called from header
    // let finalData = dataToSave;
    // if (!finalData && recipeFormRef.value) {
    //    finalData = recipeFormRef.value.formData; // Replace with actual property/method
    // }
    // if (!finalData) throw new Error("Form data unavailable");

    // const savedRecipe = await $fetch('/api/recipes', { method: 'POST', body: finalData })
    // console.log('Recipe saved:', savedRecipe)
    // router.push(`/recipes/${savedRecipe.id}`) // Or router.push('/recipes')
    alert('Recipe saved (simulated)!');
    router.push('/recipes');
  } catch (error) {
    console.error('Error saving recipe:', error);
    alert('Failed to save recipe.');
  }
};

onMounted(async () => {
  // Ensure the DOM is ready before trying to teleport
  await nextTick();
  isMounted.value = true;

  setHeader({
    title: 'Add New Recipe',
    showLeftAction: true, // Controls visibility via v-if on the button
    showRightAction: true, // Controls visibility via v-if on the button
    leftActionHandler: defaultLeftAction, // Assign the actual logic
    rightActionHandler: () => handleSave(), // Assign the actual logic
  });
});

// Reset header when leaving the page
onUnmounted(() => {
  resetHeader();
  isMounted.value = false; // Reset mount status
});

useHead({
  // Title in browser tab can be different or same as header
  title: 'Add New Recipe Page',
});
</script>
