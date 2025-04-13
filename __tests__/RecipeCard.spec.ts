import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import RecipeCard from '../components/RecipeCard.vue'; // Adjust path as needed
import type { Recipe } from '../types/recipe'; // Corrected import path

// Mock Nuxt components/features if necessary (e.g., NuxtLink, NuxtImage)
// Example: Mocking NuxtLink
const NuxtLinkStub = {
  template: '<a :href="to"><slot /></a>',
  props: ['to'],
};

// Mock useFetch or other composables if the component uses them directly
// vi.mock('#app', () => ({
//   useFetch: vi.fn(() => ({ data: ref(null), pending: ref(false), error: ref(null) }))
// }));

// --- Fixtures ---
const mockRecipe: Recipe = {
  id: 'recipe-123',
  title: 'Classic Spaghetti Bolognese',
  description: 'A rich and hearty classic Italian meat sauce served with spaghetti.',
  imageUrl: 'https://example.com/images/bolognese.jpg',
  portions: 4,
  prepTime: '15 minutes',
  cookTime: '45 minutes',
  cuisineType: 'Italian',
  ingredients: [
    { quantity: 500, unit: 'g', name: 'Minced beef' },
    { quantity: 1, unit: null, name: 'Large onion' },
  ],
  steps: [
    { order: 1, description: 'Heat oil in a large pan.' },
    { order: 2, description: 'Add minced beef and cook until browned.' },
  ],
  utensils: ['Large pan', 'Wooden spoon'],
  isFavorite: false,
  createdAt: new Date('2023-10-26T10:00:00Z'),
  updatedAt: new Date('2023-10-27T11:30:00Z'),
};

const minimalRecipe: Recipe = {
  id: 'recipe-456',
  title: 'Simple Salad',
  portions: 2,
  ingredients: [{ quantity: null, unit: null, name: 'Lettuce' }],
  steps: [{ order: 1, description: 'Wash lettuce.' }],
  isFavorite: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  // Other fields are optional
};

// --- Test Suite ---
describe('RecipeCard.vue', () => {
  it('renders basic recipe information correctly', () => {
    const wrapper = mount(RecipeCard, {
      props: {
        recipe: mockRecipe,
      },
      global: {
        stubs: {
          NuxtLink: NuxtLinkStub, // Use stub for NuxtLink
          // NuxtImage: true, // Stub NuxtImage if used
        },
      },
    });

    expect(wrapper.find('.recipe-title').text()).toBe(mockRecipe.title);
    expect(wrapper.find('.recipe-description').text()).toBe(mockRecipe.description);
    expect(wrapper.find('.recipe-portions').text()).toContain(mockRecipe.portions.toString());
    expect(wrapper.find('.recipe-prep-time').text()).toContain(mockRecipe.prepTime);
    expect(wrapper.find('.recipe-cook-time').text()).toContain(mockRecipe.cookTime);
    // expect(wrapper.find('img').attributes('src')).toBe(mockRecipe.imageUrl); // If using standard img
    // or test NuxtImage props if using <NuxtImage>
  });

  it('renders correctly with minimal recipe data', () => {
    const wrapper = mount(RecipeCard, {
      props: {
        recipe: minimalRecipe,
      },
      global: {
        stubs: {
          NuxtLink: NuxtLinkStub,
        },
      },
    });

    expect(wrapper.find('.recipe-title').text()).toBe(minimalRecipe.title);
    expect(wrapper.find('.recipe-description').exists()).toBe(false); // Optional field
    expect(wrapper.find('.recipe-portions').text()).toContain(minimalRecipe.portions.toString());
    expect(wrapper.find('.recipe-prep-time').exists()).toBe(false);
    expect(wrapper.find('.recipe-cook-time').exists()).toBe(false);
  });

  it('displays a favorite icon when isFavorite is true', () => {
    const wrapper = mount(RecipeCard, {
      props: {
        recipe: { ...mockRecipe, isFavorite: true },
      },
      global: {
        stubs: {
          NuxtLink: NuxtLinkStub,
        },
      },
    });
    // Assuming you have an element (e.g., an icon) with class 'favorite-icon'
    expect(wrapper.find('.favorite-icon').exists()).toBe(true);
  });

  it('does not display a favorite icon when isFavorite is false', () => {
    const wrapper = mount(RecipeCard, {
      props: {
        recipe: { ...mockRecipe, isFavorite: false },
      },
      global: {
        stubs: {
          NuxtLink: NuxtLinkStub,
        },
      },
    });
    expect(wrapper.find('.favorite-icon').exists()).toBe(false);
  });

  it('emits a "toggle-favorite" event when the favorite button is clicked', async () => {
    const wrapper = mount(RecipeCard, {
      props: {
        recipe: mockRecipe,
      },
      global: {
        stubs: {
          NuxtLink: NuxtLinkStub,
        },
      },
    });

    // Assuming you have a button or clickable element with class 'favorite-button'
    const favoriteButton = wrapper.find('.favorite-button');
    if (favoriteButton.exists()) {
      await favoriteButton.trigger('click');
      expect(wrapper.emitted()).toHaveProperty('toggle-favorite');
      expect(wrapper.emitted()['toggle-favorite'][0]).toEqual([mockRecipe.id]);
    } else {
      // Fail the test if the button doesn't exist, makes debugging easier
      expect(true).toBe(false); // Or throw new Error('Favorite button not found');
    }
  });

  it('links to the correct recipe details page', () => {
    const wrapper = mount(RecipeCard, {
      props: {
        recipe: mockRecipe,
      },
      global: {
        stubs: {
          NuxtLink: NuxtLinkStub, // Crucial for testing navigation links
        },
      },
    });

    // Assuming the main card element or title is wrapped in NuxtLink
    const link = wrapper.findComponent(NuxtLinkStub);
    expect(link.props('to')).toBe(`/recipes/${mockRecipe.id}`);
  });

  // Add more tests as needed:
  // - Test rendering of cuisine type if displayed
  // - Test placeholder image if imageUrl is missing
  // - Test accessibility attributes (alt text for images etc.)
}); 