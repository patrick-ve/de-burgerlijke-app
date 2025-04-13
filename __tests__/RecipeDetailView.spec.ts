import { describe, it, expect, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import RecipeDetailView from '~/components/RecipeDetailView.vue';
import type { Recipe } from '~/types/recipe'; // Import the Recipe type

// Mock Nuxt UI UCard component for testing
const UCard = {
  template: '<div><slot name="header" /><slot /><slot name="footer" /></div>',
};

// Define a mock recipe object based on the Recipe type
const mockRecipe: Recipe = {
  id: '1',
  title: 'Test Recipe Title',
  description: 'A delicious test recipe description.',
  prepTime: '15 mins',
  cookTime: '30 mins',
  cuisineType: 'Test Cuisine',
  portions: 4,
  ingredients: [
    { name: 'Ingredient 1', quantity: 1, unit: 'cup' },
    { name: 'Ingredient 2', quantity: 200, unit: 'g' },
    { name: 'Ingredient 3', quantity: null, unit: null }, // Test null quantity/unit
  ],
  steps: [
    { order: 1, description: 'First test step.' },
    { order: 2, description: 'Second test step.' },
  ],
  utensils: ['Spatula', 'Mixing Bowl'],
  isFavorite: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('RecipeDetailView.vue', () => {
  let wrapper: VueWrapper<any>;

  beforeEach(() => {
    wrapper = mount(RecipeDetailView, {
      props: {
        recipe: mockRecipe,
      },
      global: {
        stubs: {
          UCard, // Stub UCard
        },
      },
    });
  });

  it('mounts correctly', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('renders the recipe title', () => {
    expect(wrapper.find('h2').text()).toBe(mockRecipe.title);
  });

  it('renders the recipe description', () => {
    expect(wrapper.find('p').text()).toBe(mockRecipe.description);
  });

  it('renders the metadata (prep time, cook time, cuisine, portions)', () => {
    const metadataText = wrapper.findAll('div > div'); // Find divs within the grid
    expect(metadataText.some(el => el.text().includes(`Prep Time: ${mockRecipe.prepTime}`))).toBe(true);
    expect(metadataText.some(el => el.text().includes(`Cook Time: ${mockRecipe.cookTime}`))).toBe(true);
    expect(metadataText.some(el => el.text().includes(`Cuisine: ${mockRecipe.cuisineType}`))).toBe(true);
    expect(metadataText.some(el => el.text().includes(`Portions: ${mockRecipe.portions}`))).toBe(true);
  });

  it('renders the ingredients list correctly', () => {
    const ingredients = wrapper.findAll('ul').at(0)?.findAll('li'); // Find first ul
    expect(ingredients).toHaveLength(mockRecipe.ingredients.length);
    expect(ingredients?.at(0)?.text()).toBe('1 cup Ingredient 1');
    expect(ingredients?.at(1)?.text()).toBe('200 g Ingredient 2');
    expect(ingredients?.at(2)?.text()).toBe('null null Ingredient 3'); // Check null handling
  });

  it('renders the steps list correctly', () => {
    const steps = wrapper.find('ol').findAll('li');
    expect(steps).toHaveLength(mockRecipe.steps.length);
    expect(steps.at(0)?.text()).toBe(mockRecipe.steps[0].description);
    expect(steps.at(1)?.text()).toBe(mockRecipe.steps[1].description);
  });

  it('renders the utensils list correctly', () => {
    const utensils = wrapper.findAll('ul').at(1)?.findAll('li'); // Find second ul
    expect(utensils).toHaveLength(mockRecipe.utensils!.length);
    expect(utensils?.at(0)?.text()).toBe(mockRecipe.utensils![0]);
    expect(utensils?.at(1)?.text()).toBe(mockRecipe.utensils![1]);
  });

  it('does not render description if not provided', () => {
    const recipeWithoutDescription = { ...mockRecipe, description: undefined };
    wrapper = mount(RecipeDetailView, { props: { recipe: recipeWithoutDescription }, global: { stubs: { UCard } } });
    expect(wrapper.find('p').exists()).toBe(false);
  });

  it('does not render optional metadata if not provided', () => {
    const recipeWithoutOptionalMeta = {
      ...mockRecipe,
      prepTime: undefined,
      cookTime: undefined,
      cuisineType: undefined,
    };
    wrapper = mount(RecipeDetailView, { props: { recipe: recipeWithoutOptionalMeta }, global: { stubs: { UCard } } });
    const metadataText = wrapper.text();
    expect(metadataText).not.toContain('Prep Time:');
    expect(metadataText).not.toContain('Cook Time:');
    expect(metadataText).not.toContain('Cuisine:');
  });

  it('does not render utensils section if not provided or empty', () => {
    const recipeWithoutUtensils = { ...mockRecipe, utensils: undefined };
    wrapper = mount(RecipeDetailView, { props: { recipe: recipeWithoutUtensils }, global: { stubs: { UCard } } });
    expect(wrapper.findAll('h3').some(h => h.text() === 'Utensils')).toBe(false);

    const recipeWithEmptyUtensils = { ...mockRecipe, utensils: [] };
    wrapper = mount(RecipeDetailView, { props: { recipe: recipeWithEmptyUtensils }, global: { stubs: { UCard } } });
    expect(wrapper.findAll('h3').some(h => h.text() === 'Utensils')).toBe(false);
  });
});
