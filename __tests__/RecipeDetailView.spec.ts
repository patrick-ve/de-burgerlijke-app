import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { defineComponent } from 'vue'; // Import defineComponent
import RecipeDetailView from '~/components/RecipeDetailView.vue';
import type {
  Recipe,
  Ingredient,
  Step,
  Utensil,
} from '~/types/recipe'; // Assume Step type is defined

// Mock Nuxt UI and NuxtImg components used in RecipeDetailView
const UTabs = defineComponent({
  props: ['items'], // Accept items prop to simulate real component
  // Basic template that renders the default slot and ONLY the item slot for 'instructions'
  template: `
    <div>
      <!-- Default slot for potential headers/other elements -->
      <slot />
      <!-- Manually render item slot ONLY for instructions key -->
      <slot name="item" :item="{ key: 'instructions', label: 'Bereiding' }" :selected="true" />
    </div>
  `,
  // Minimal setup, returning an empty render function for compatibility
  setup() {
    return () => {};
  },
});
const UIcon = { template: '<i class="icon i-heroicons-mock"></i>' }; // Simple icon mock, added class for potential selection
const UCheckbox = {
  template:
    '<input type="checkbox" :checked="$attrs.modelValue" @change="$emit(\'update:modelValue\', ($event.target as HTMLInputElement).checked)" />',
  inheritAttrs: false,
  emits: ['update:modelValue'],
};
const NuxtImg = {
  template: '<img :src="src" :alt="alt" class="mock-nuxt-img" />', // Basic img mock with class
  props: ['src', 'alt'],
};

// Define a corrected mock recipe object
const mockRecipe: Recipe = {
  id: 'recipe-1',
  title: 'Test Recipe Title',
  description: 'A delicious test recipe description.', // Optional description
  prepTime: 15, // Use number
  cookTime: 30, // Use number
  portions: 4,
  imageUrl: 'test-image.jpg', // Added imageUrl
  ingredients: [
    { id: 'ing-1', name: 'Ingredient 1', quantity: 1, unit: 'cup' },
    { id: 'ing-2', name: 'Ingredient 2', quantity: 200, unit: 'g' },
    { id: 'ing-3', name: 'Ingredient 3', quantity: null, unit: null }, // Added ID
  ] as Ingredient[], // Assert type
  steps: [
    {
      id: 'step-1',
      order: 1,
      description: 'First test step.',
      isComplete: false,
    }, // Added ID and isComplete
    {
      id: 'step-2',
      order: 2,
      description: 'Second test step.',
      isComplete: true,
    }, // Added ID and isComplete
  ] as Step[], // Assert type
  utensils: [
    { id: 'uten-1', name: 'Spatula' },
    { id: 'uten-2', name: 'Mixing Bowl' },
  ] as Utensil[], // Corrected to Utensil objects
  isFavorite: false,
  // Removed createdAt, updatedAt, cuisineType as they aren't used directly in this component's template
};

describe('RecipeDetailView.vue', () => {
  let wrapper: VueWrapper<any>;

  // Helper function to find step elements reliably
  const findStepElements = () => {
    const steps = wrapper.findAll('.space-y-4.text-sm > li');
    return steps;
  };

  // Helper function to find ingredient elements reliably
  const findIngredientElements = () => {
    const ingredients = wrapper.findAll('.space-y-2 > li');
    return ingredients;
  };

  // Helper function to find utensil elements reliably
  const findUtensilElements = () => {
    // Find any list items within a grid class
    const utensils = wrapper.findAll('.grid.grid-cols-2 > li');
    return utensils;
  };

  beforeEach(() => {
    // Stub defineComponent if necessary (Vite/Vitest might handle it)
    // vi.stubGlobal('defineComponent', (comp: any) => comp);

    wrapper = mount(RecipeDetailView, {
      props: {
        recipe: JSON.parse(JSON.stringify(mockRecipe)), // Deep copy
      },
      global: {
        // Remove components object if no other local components are needed
        // components: {},
        // Stubs are now handled globally in vitest.setup.ts
        components: {
          // Use components for interactivity/slots
          UTabs,
          UIcon,
          UCheckbox,
          NuxtImg,
        },
        // stubs: { // Stub less critical/non-interactive components if needed
        // }
      },
    });
  });

  it('receives the recipe object as a prop', () => {
    expect(wrapper.props().recipe.id).toBe(mockRecipe.id);
    expect(wrapper.props().recipe.title).toBe(mockRecipe.title);
  });

  it('renders the recipe image if imageUrl is provided', () => {
    const img = wrapper.find('img.mock-nuxt-img');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe(mockRecipe.imageUrl);
    expect(img.attributes('alt')).toBe(mockRecipe.title);
  });

  it('does not render image if imageUrl is not provided', () => {
    const recipeWithoutImage = { ...mockRecipe, imageUrl: undefined };
    const localWrapper = mount(RecipeDetailView, {
      props: { recipe: recipeWithoutImage },
      global: { components: { UTabs, UIcon, UCheckbox, NuxtImg } },
    });
    expect(localWrapper.find('img.mock-nuxt-img').exists()).toBe(
      false
    );
  });

  it('renders the metadata (prep time, cook time, portions) correctly', () => {
    const metadataDiv = wrapper.find('div.grid.grid-cols-3'); // Find the metadata container
    expect(metadataDiv.exists()).toBe(true);
    const metadataText = metadataDiv.text();

    expect(metadataText).toContain(`${mockRecipe.prepTime} minuten`);
    expect(metadataText).toContain('Voorbereiding');
    expect(metadataText).toContain(`${mockRecipe.cookTime} minuten`);
    expect(metadataText).toContain('Kooktijd');
    expect(metadataText).toContain(`${mockRecipe.portions}`);
    expect(metadataText).toContain('Porties');
  });

  it('renders the ingredients list correctly', () => {
    const ingredients = findIngredientElements();
    expect(ingredients.length).toBe(mockRecipe.ingredients.length);
    expect(ingredients[0].text()).toContain('1 cup'); // Includes quantity and unit
    expect(ingredients[0].text()).toContain('Ingredient 1'); // Includes name
    expect(ingredients[1].text()).toContain('200 g Ingredient 2');
    expect(ingredients[2].text()).toContain('Ingredient 3'); // Handles null quantity/unit gracefully
    expect(ingredients[2].text().trim()).toBe('Ingredient 3'); // Should not render 'null null'
  });

  it('renders the steps list correctly with checkboxes', () => {
    // Find checkboxes directly
    const checkboxes = wrapper.findAll('input[type="checkbox"]');
    expect(checkboxes.length).toBe(mockRecipe.steps.length);

    // Get all step elements
    const steps = findStepElements();

    // Check first step text
    expect(steps[0].text()).toContain(
      mockRecipe.steps[0].description
    );

    // Check second step text
    expect(steps[1].text()).toContain(
      mockRecipe.steps[1].description
    );
  });

  it('toggles step completion state and applies styling when checkbox is clicked', async () => {
    const checkboxes = wrapper.findAll('input[type="checkbox"]');
    const firstCheckboxInput = checkboxes[0];

    // Find the parent li and its span for the first checkbox
    const steps = findStepElements();
    const firstStepLi = steps[0];
    const stepTextSpan = firstStepLi.find('span.flex-1');

    // Initial state - not completed
    expect(stepTextSpan.classes()).not.toContain('line-through');
    expect(stepTextSpan.classes()).not.toContain('text-gray-400');

    // Click checkbox input to mark complete
    await firstCheckboxInput.setValue(true);

    // Check that the styling has been applied
    expect(stepTextSpan.classes()).toContain('line-through');
    expect(stepTextSpan.classes()).toContain('text-gray-400');

    // Click again to uncheck
    await firstCheckboxInput.setValue(false);

    // Check styling has been removed
    expect(stepTextSpan.classes()).not.toContain('line-through');
    expect(stepTextSpan.classes()).not.toContain('text-gray-400');
  });

  it('renders the utensils list correctly if provided', () => {
    const utensils = findUtensilElements();
    expect(utensils.length).toBe(mockRecipe.utensils!.length);
    // Check for the name property of the utensil object
    expect(utensils[0].text()).toContain(
      mockRecipe.utensils![0].name
    );
    expect(utensils[1].text()).toContain(
      mockRecipe.utensils![1].name
    );
  });

  it('does not render optional metadata if not provided', () => {
    const recipeWithoutOptionalMeta = {
      ...mockRecipe,
      prepTime: undefined, // Test undefined
      cookTime: null, // Test null
    };
    const localWrapper = mount(RecipeDetailView, {
      props: { recipe: recipeWithoutOptionalMeta },
      global: { components: { UTabs, UIcon, UCheckbox, NuxtImg } }, // Use the improved UTabs mock
    });
    const metadataDiv = localWrapper.find('div.grid.grid-cols-3');
    const metadataText = metadataDiv.text(); // Get all text content

    // Check that the specific labels are NOT present in the overall text
    expect(metadataText).not.toContain('Voorbereiding');
    expect(metadataText).not.toContain('Kooktijd');
    expect(metadataText).not.toContain('minuten'); // Units should also be absent

    // Optionally, verify the specific icon elements are not rendered
    // Note: Adjust the icon class if the mock changes
    expect(metadataDiv.html()).not.toContain('i-heroicons-book-open'); // Prep time icon class from component
    expect(metadataDiv.html()).not.toContain('i-heroicons-clock'); // Cook time icon class from component
  });

  it('does not render utensils section content if not provided or empty', () => {
    const recipeWithoutUtensils = {
      ...mockRecipe,
      utensils: undefined,
    };
    const localWrapperNoUtensils = mount(RecipeDetailView, {
      props: { recipe: recipeWithoutUtensils },
      global: { components: { UTabs, UIcon, UCheckbox, NuxtImg } },
    });
    // No utensils should be found
    expect(
      localWrapperNoUtensils.findAll('.grid.grid-cols-2 > li').length
    ).toBe(0);

    const recipeWithEmptyUtensils = { ...mockRecipe, utensils: [] };
    const localWrapperEmptyUtensils = mount(RecipeDetailView, {
      props: { recipe: recipeWithEmptyUtensils },
      global: { components: { UTabs, UIcon, UCheckbox, NuxtImg } },
    });
    // No utensils should be found
    expect(
      localWrapperEmptyUtensils.findAll('.grid.grid-cols-2 > li')
        .length
    ).toBe(0);
  });
});
