import { mount, VueWrapper } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import RecipeCard from '../components/RecipeCard.vue'; // Adjust path as needed
import type { Recipe } from '../types/recipe'; // Corrected import path
import { computed } from 'vue'; // Import computed if needed for mocks

// Mock Nuxt components/features if necessary
const NuxtLinkStub = {
  template: '<a :href="to"><slot /></a>',
  props: ['to'],
};
const NuxtImgStub = {
  template: '<img :src="src" :alt="alt" />',
  props: ['src', 'alt'],
};
// Mock UIcon for simplicity in tests
const UIconStub = {
  template: '<span class="u-icon"></span>',
  props: ['name'],
};
// Basic UButton stub for the favorite button
const UButtonStub = {
  template:
    '<button :class="cssClass" @click="$emit(\'click\', $event)" :aria-label="ariaLabel"><slot /></button>',
  props: [
    'icon',
    'size',
    'color',
    'square',
    'variant',
    'class',
    'ariaLabel',
  ],
  computed: {
    cssClass(): string {
      // Simplified: just pass the class prop for testing existence
      // Use type assertion to access props on 'this'
      return (this as any).class;
    },
  },
};

// --- Fixtures ---
const mockRecipe: Recipe = {
  id: 'recipe-123',
  title: 'Classic Spaghetti Bolognese',
  description:
    'A rich and hearty classic Italian meat sauce served with spaghetti.', // Keep description in mock for other tests
  imageUrl: 'https://example.com/images/bolognese.jpg',
  portions: 4,
  prepTime: 15, // Use numbers for calculation
  cookTime: 45, // Use numbers for calculation
  cuisine: 'Italian',
  ingredients: [
    { id: 'i-1', quantity: 500, unit: 'g', name: 'Minced beef' },
    { id: 'i-2', quantity: 1, unit: null, name: 'Large onion' },
  ],
  steps: [
    { id: 's-1', order: 1, description: 'Heat oil in a large pan.' },
    {
      id: 's-2',
      order: 2,
      description: 'Add minced beef and cook until browned.',
    },
  ],
  utensils: [
    { id: 'u-1', name: 'Large pan' },
    { id: 'u-2', name: 'Wooden spoon' },
  ],
  isFavorite: false,
  createdAt: new Date('2023-10-26T10:00:00Z'),
  updatedAt: new Date('2023-10-27T11:30:00Z'),
};

const minimalRecipe: Recipe = {
  id: 'recipe-456',
  title: 'Simple Salad',
  portions: 2,
  ingredients: [
    { id: 'i-3', quantity: null, unit: null, name: 'Lettuce' },
  ],
  steps: [{ id: 's-3', order: 1, description: 'Wash lettuce.' }],
  utensils: [], // Add required utensils property
  isFavorite: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  // Optional fields are null/undefined
  prepTime: null,
  cookTime: undefined,
  description: undefined,
  imageUrl: undefined,
  cuisine: undefined,
};

// --- Test Suite ---
describe('RecipeCard.vue', () => {
  let wrapper: VueWrapper<any>;

  const mountComponent = (recipeData: Recipe) => {
    return mount(RecipeCard, {
      props: {
        recipe: recipeData,
      },
      // Use global stubs from vitest.setup.ts instead of local ones
    });
  };

  it('renders basic recipe information correctly', () => {
    wrapper = mountComponent(mockRecipe);

    // Check elements that *are* displayed
    expect(wrapper.find('.recipe-title').text()).toBe(
      mockRecipe.title
    );
    expect(wrapper.find('.recipe-portions').text()).toContain(
      mockRecipe.portions.toString()
    );
    // Calculate expected total time
    const expectedTotalTime =
      (mockRecipe.prepTime || 0) + (mockRecipe.cookTime || 0);
    expect(wrapper.find('.recipe-total-time').text()).toContain(
      expectedTotalTime.toString()
    );
    // Note: cuisine is not displayed in the RecipeCard component, so removing this check
    // Check image alt text (via stub)
    expect(wrapper.find('img').attributes('alt')).toBe(
      `Image of ${mockRecipe.title}`
    );

    // Verify elements that should NOT be directly displayed are absent
    expect(wrapper.find('.recipe-description').exists()).toBe(false);
    expect(wrapper.find('.recipe-prep-time').exists()).toBe(false);
    expect(wrapper.find('.recipe-cook-time').exists()).toBe(false);
  });

  it('renders correctly with minimal recipe data', () => {
    wrapper = mountComponent(minimalRecipe);

    expect(wrapper.find('.recipe-title').text()).toBe(
      minimalRecipe.title
    );
    expect(wrapper.find('.recipe-portions').text()).toContain(
      minimalRecipe.portions.toString()
    );
    // Optional fields check
    expect(wrapper.find('.recipe-description').exists()).toBe(false);
    expect(wrapper.find('.recipe-total-time').exists()).toBe(false); // prepTime/cookTime are null/undefined
    expect(wrapper.find('.recipe-cuisine').exists()).toBe(false);
    // Check placeholder icon is rendered (since imageUrl is missing)
    expect(wrapper.find('.u-icon').exists()).toBe(true);
    // Check favorite button exists even with minimal data
    expect(wrapper.find('.favorite-button').exists()).toBe(true);
  });

  it('displays favorite button when isFavorite is true', () => {
    wrapper = mountComponent({ ...mockRecipe, isFavorite: true });
    // Check if the favorite button *element* exists
    expect(wrapper.find('.favorite-button').exists()).toBe(true);
    // Optionally, you could check the icon prop if the stub passed it through,
    // but checking button existence is often enough for the toggle state.
  });

  it('displays favorite button when isFavorite is false', () => {
    wrapper = mountComponent({ ...mockRecipe, isFavorite: false });
    expect(wrapper.find('.favorite-button').exists()).toBe(true);
  });

  it('emits a "toggle-favorite" event with recipe ID when the favorite button is clicked', async () => {
    wrapper = mountComponent(mockRecipe);
    const favoriteButton = wrapper.find('.favorite-button');
    expect(favoriteButton.exists()).toBe(true); // Ensure button exists before clicking

    await favoriteButton.trigger('click');

    expect(wrapper.emitted()).toHaveProperty('toggle-favorite');
    expect(wrapper.emitted()['toggle-favorite']).toHaveLength(1);
    expect(wrapper.emitted()['toggle-favorite'][0]).toEqual([
      mockRecipe.id,
    ]);
  });

  it('links to the correct recipe details page', () => {
    wrapper = mountComponent(mockRecipe);
    const link = wrapper.find('a'); // Find the actual anchor tag rendered by NuxtLink stub
    expect(link.attributes('href')).toBe(`/recipes/${mockRecipe.id}`);
  });
});
