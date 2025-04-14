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
const UTabs = {
  template: '<div><slot /></div>', // Basic container for tabs
};
const UIcon = { template: '<i class="icon"></i>' }; // Simple icon mock
const UCheckbox = {
  template:
    '<input type="checkbox" :checked="$attrs.modelValue" @change="$emit(\'update:modelValue\', ($event.target as HTMLInputElement).checked)" />',
  inheritAttrs: false,
  emits: ['update:modelValue'],
};
const NuxtImg = {
  template: '<img :src="src" :alt="alt" />', // Basic img mock
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
    // Find the div containing the ordered list for steps
    const instructionsContent = wrapper
      .findAll('div.mt-6.px-2.space-y-6 > div')
      .at(0);
    return instructionsContent
      ? instructionsContent.findAll('li')
      : [];
  };

  // Helper function to find ingredient elements reliably
  const findIngredientElements = () => {
    // Find the div containing the unordered list for ingredients
    const ingredientsContent = wrapper.find(
      'div.mt-6.px-2 > ul.space-y-2'
    );
    return ingredientsContent.exists()
      ? ingredientsContent.findAll('li')
      : [];
  };

  // Helper function to find utensil elements reliably
  const findUtensilElements = () => {
    // Find the div containing the grid for utensils
    const utensilsContent = wrapper.find(
      'div.mt-6.px-2.space-y-6 > div > ul.grid'
    );
    return utensilsContent.exists()
      ? utensilsContent.findAll('li')
      : [];
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
    const img = wrapper.findComponent(NuxtImg);
    expect(img.exists()).toBe(true);
    expect(img.props('src')).toBe(mockRecipe.imageUrl);
    expect(img.props('alt')).toBe(mockRecipe.title);
  });

  it('does not render image if imageUrl is not provided', () => {
    const recipeWithoutImage = { ...mockRecipe, imageUrl: undefined };
    const localWrapper = mount(RecipeDetailView, {
      props: { recipe: recipeWithoutImage },
      global: { components: { UTabs, UIcon, UCheckbox, NuxtImg } },
    });
    expect(localWrapper.findComponent(NuxtImg).exists()).toBe(false);
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
    const steps = findStepElements();
    expect(steps.length).toBe(mockRecipe.steps.length);

    // Check first step
    expect(steps[0].text()).toContain(
      mockRecipe.steps[0].description
    );
    const checkbox1 = steps[0].findComponent(UCheckbox);
    expect(checkbox1.exists()).toBe(true);
    expect(checkbox1.props('modelValue')).toBe(false); // Check initial state

    // Check second step
    expect(steps[1].text()).toContain(
      mockRecipe.steps[1].description
    );
    const checkbox2 = steps[1].findComponent(UCheckbox);
    expect(checkbox2.exists()).toBe(true);
    expect(checkbox2.props('modelValue')).toBe(true); // Check initial state (isComplete: true)
  });

  it('toggles step completion state and applies styling when checkbox is clicked', async () => {
    const steps = findStepElements();
    const firstStepElement = steps[0];
    const checkbox = firstStepElement.find('input[type="checkbox"]');
    const stepTextSpan = firstStepElement.find('span.flex-1'); // Target the description span

    // Initial state
    expect(
      firstStepElement.findComponent(UCheckbox).props('modelValue')
    ).toBe(false);
    expect(stepTextSpan.classes()).not.toContain('line-through');
    expect(stepTextSpan.classes()).not.toContain('text-gray-400');

    // Click checkbox
    await checkbox.setValue(true); // Simulate check

    // Check updated state and style
    expect(
      firstStepElement.findComponent(UCheckbox).props('modelValue')
    ).toBe(true);
    expect(stepTextSpan.classes()).toContain('line-through');
    expect(stepTextSpan.classes()).toContain('text-gray-400'); // Check for style change

    // Click again to uncheck
    await checkbox.setValue(false);
    expect(
      firstStepElement.findComponent(UCheckbox).props('modelValue')
    ).toBe(false);
    expect(stepTextSpan.classes()).not.toContain('line-through');
    expect(stepTextSpan.classes()).not.toContain('text-gray-400'); // Style reverted
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
      global: { components: { UTabs, UIcon, UCheckbox, NuxtImg } },
    });
    const metadataDiv = localWrapper.find('div.grid.grid-cols-3');
    const metadataText = metadataDiv.text();

    // Check that the specific divs containing the times are not rendered or are empty
    expect(
      metadataDiv
        .findAll('div.flex.items-center.justify-center.gap-2')
        .at(0)
        ?.text()
    ).not.toContain('minuten');
    expect(
      metadataDiv
        .findAll('div.flex.items-center.justify-center.gap-2')
        .at(1)
        ?.text()
    ).not.toContain('minuten');
    expect(metadataText).not.toContain('Voorbereiding'); // Label might still be there if div exists but content is empty
    expect(metadataText).not.toContain('Kooktijd');
  });

  it('does not render utensils section content if not provided or empty', () => {
    const recipeWithoutUtensils = {
      ...mockRecipe,
      utensils: undefined,
    };
    const wrapperNoUtensils = mount(RecipeDetailView, {
      props: { recipe: recipeWithoutUtensils },
      global: { components: { UTabs, UIcon, UCheckbox, NuxtImg } },
    });
    expect(findUtensilElements().length).toBe(0); // Utensils list should be empty or not exist

    const recipeWithEmptyUtensils = { ...mockRecipe, utensils: [] };
    const wrapperEmptyUtensils = mount(RecipeDetailView, {
      props: { recipe: recipeWithEmptyUtensils },
      global: { components: { UTabs, UIcon, UCheckbox, NuxtImg } },
    });
    expect(findUtensilElements().length).toBe(0); // Utensils list should be empty
  });
});
