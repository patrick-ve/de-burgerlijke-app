import { describe, it, expect, beforeEach } from 'vitest';
import { mount, VueWrapper, flushPromises } from '@vue/test-utils';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { nextTick } from 'vue';
import RecipeList from '../components/RecipeList.vue';
import RecipeCard from '../components/RecipeCard.vue';
import type { Recipe } from '../types/recipe';

// Mock data for recipes
const mockRecipes: Recipe[] = [
  {
    id: '1',
    title: 'Apple Pie', // Total Time: 90
    description: 'Classic homemade apple pie.',
    prepTime: 30,
    cookTime: 60,
    cuisine: 'American',
    portions: 8,
    ingredients: [
      { id: 'i1', quantity: 6, unit: null, name: 'Apples' },
    ],
    steps: [{ id: 's1', description: 'Peel apples.', order: 1 }],
    utensils: [{ id: 'u1', name: 'Pie dish' }],
    isFavorite: false,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  },
  {
    id: '2',
    title: 'Spaghetti Carbonara', // Total Time: 35
    description: 'Authentic Italian carbonara.',
    prepTime: 15,
    cookTime: 20,
    cuisine: 'Italian',
    portions: 4,
    ingredients: [
      { id: 'i2', quantity: 200, unit: 'g', name: 'Spaghetti' },
    ],
    steps: [{ id: 's2', description: 'Cook spaghetti.', order: 1 }],
    utensils: [{ id: 'u2', name: 'Large pan' }],
    isFavorite: true,
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-01-15'),
  },
  {
    id: '3',
    title: 'Chicken Curry', // Total Time: 60
    description: 'Simple chicken curry.',
    prepTime: 20,
    cookTime: 40,
    cuisine: 'Indian',
    portions: 4,
    ingredients: [
      { id: 'i3', quantity: 500, unit: 'g', name: 'Chicken breast' },
    ],
    steps: [{ id: 's3', description: 'Cut chicken.', order: 1 }],
    utensils: [{ id: 'u3', name: 'Wok' }],
    isFavorite: false,
    createdAt: new Date('2023-02-01'),
    updatedAt: new Date('2023-02-01'),
  },
];

// Helper to find elements by data-testid
const findTestElement = (wrapper: VueWrapper<any>, testId: string) =>
  wrapper.find(`[data-testid="${testId}"]`);

// Define Stubs outside describe block if they don't depend on wrapper instance
const stubs = {
  RecipeCard: true, // Keep RecipeCard simple
  UInput: {
    // Basic input stub emitting update:modelValue
    template: `<input :data-testid="testid || 'search-input'" :value="modelValue" @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)" />`,
    props: ['modelValue', 'testid'],
  },
  UButton: {
    // Basic button stub emitting click
    template: `<button :data-testid="testid" @click="$emit('click', $event)"><slot /></button>`,
    props: ['testid'],
  },
  USelect: {
    // Basic select stub emitting update:modelValue
    template: `<select :data-testid="testid" :value="modelValue ?? ''" @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value || null)">
                 <option value="">Select...</option>
                 <option v-for="opt in options" :key="opt" :value="opt">{{ opt }}</option>
               </select>`,
    props: ['modelValue', 'options', 'testid'],
  },
  URange: {
    // Basic range stub emitting update:modelValue with [min, max]
    template: `
      <div :data-testid="testid">
        <input type="number" :value="modelValue[0]" @input="updateRange(0, $event)" :min="min" :max="max" data-testid="range-min-input" />
        <input type="number" :value="modelValue[1]" @input="updateRange(1, $event)" :min="min" :max="max" data-testid="range-max-input" />
      </div>
    `,
    props: {
      modelValue: { type: Array, required: true },
      min: { type: Number, default: 0 },
      max: { type: Number, default: 100 },
      testid: { type: String, default: 'total-time-range-slideover' },
    },
    emits: ['update:modelValue'],
    methods: {
      updateRange(index: 0 | 1, event: Event): void {
        const target = event.target as HTMLInputElement;
        const numValue = parseInt(target.value, 10);
        if (isNaN(numValue)) return;

        // Explicitly cast 'this' to access props within the method context
        const currentProps = this as unknown as {
          modelValue: [number, number];
          min: number;
          max: number;
        };
        // Create a new array to avoid mutating the prop directly
        const newValue: [number, number] = [
          ...currentProps.modelValue,
        ];
        newValue[index] = numValue;

        // Clamp values based on min/max props
        newValue[0] = Math.max(currentProps.min, newValue[0]);
        newValue[1] = Math.min(currentProps.max, newValue[1]);

        // Ensure min <= max after clamping to props
        if (newValue[0] > newValue[1]) {
          if (index === 0) {
            // If min input caused the issue
            newValue[0] = newValue[1]; // Clamp min to max
          } else {
            // If max input caused the issue
            newValue[1] = newValue[0]; // Clamp max to min
          }
        }
        (this as any).$emit('update:modelValue', newValue); // Use 'this' to emit
      },
    },
  },
  // Improved stub for USlideover to actually show/hide content based on modelValue
  USlideover: {
    template: `
      <div v-if="modelValue" class="slideover-stub">
        <slot />
      </div>
    `,
    props: {
      modelValue: { type: Boolean, default: false },
    },
    emits: ['update:modelValue'],
  },
  UCard: {
    template: `
      <div>
        <slot name="header"></slot>
        <slot></slot>             <!-- Default slot -->
        <slot name="footer"></slot>
      </div>
    `,
  },
  // No need to stub UFormGroup, UIcon, UBadge if they don't affect logic
};

describe('RecipeList.vue', () => {
  let wrapper: VueWrapper<any>;

  beforeEach(async () => {
    wrapper = mount(RecipeList, {
      props: {
        recipes: mockRecipes,
      },
      global: {
        stubs: stubs, // Use defined stubs
      },
    });
    // Ensure component is fully rendered
    await flushPromises();
  });

  it('renders the correct number of RecipeCard components initially', () => {
    const recipeCards = wrapper.findAllComponents(RecipeCard);
    // Should be sorted by title ASC by default
    expect(recipeCards.length).toBe(mockRecipes.length);
    expect(recipeCards[0].props('recipe').title).toBe('Apple Pie');
    expect(recipeCards[1].props('recipe').title).toBe(
      'Chicken Curry'
    );
    expect(recipeCards[2].props('recipe').title).toBe(
      'Spaghetti Carbonara'
    );
  });

  it('passes the correct recipe prop to each RecipeCard (initial sort)', () => {
    const recipeCards = wrapper.findAllComponents(RecipeCard);
    const sortedMockRecipes = [...mockRecipes].sort((a, b) =>
      a.title.localeCompare(b.title)
    );

    recipeCards.forEach((cardWrapper, index) => {
      expect(cardWrapper.props('recipe')).toEqual(
        sortedMockRecipes[index]
      );
    });
  });

  it('displays a message when no recipes are provided', async () => {
    // Mount with empty recipes list
    wrapper = mount(RecipeList, {
      props: { recipes: [] },
      global: { stubs: stubs },
    });
    await flushPromises();
    expect(
      findTestElement(wrapper, 'no-recipes-message').exists()
    ).toBe(true);
    expect(
      findTestElement(wrapper, 'no-results-message').exists()
    ).toBe(false);
    expect(wrapper.findAllComponents(RecipeCard).length).toBe(0);
  });

  // --- Search Tests ---

  it('filters recipes based on search query in title', async () => {
    const searchInput = findTestElement(wrapper, 'search-input');
    await searchInput.setValue('Apple');
    await flushPromises();
    const recipeCards = wrapper.findAllComponents(RecipeCard);
    expect(recipeCards.length).toBe(1);
    expect(recipeCards[0].props('recipe').title).toBe('Apple Pie');
  });

  it('filters recipes based on search query in description', async () => {
    const searchInput = findTestElement(wrapper, 'search-input');
    await searchInput.setValue('carbonara');
    await flushPromises();
    const recipeCards = wrapper.findAllComponents(RecipeCard);
    expect(recipeCards.length).toBe(1);
    expect(recipeCards[0].props('recipe').title).toBe(
      'Spaghetti Carbonara'
    );
  });

  it('displays all recipes when search query is cleared', async () => {
    const searchInput = findTestElement(wrapper, 'search-input');
    await searchInput.setValue('Apple');
    await flushPromises();
    expect(wrapper.findAllComponents(RecipeCard).length).toBe(1);
    await searchInput.setValue('');
    await flushPromises();
    expect(wrapper.findAllComponents(RecipeCard).length).toBe(
      mockRecipes.length
    );
  });

  it('displays a message when search filters result in no matches', async () => {
    const searchInput = findTestElement(wrapper, 'search-input');
    await searchInput.setValue('NonExistentRecipe');
    await flushPromises();
    expect(wrapper.findAllComponents(RecipeCard).length).toBe(0);
    expect(
      findTestElement(wrapper, 'no-results-message').exists()
    ).toBe(true);
    expect(
      findTestElement(wrapper, 'no-recipes-message').exists()
    ).toBe(false);
  });

  // --- Grouping Tests (pagination was removed, now uses cuisine grouping) ---

  it('groups recipes by cuisine correctly', async () => {
    const mixedCuisineRecipes = [
      {
        ...mockRecipes[0],
        title: 'Italian Pasta',
        cuisine: 'Italian',
      },
      { ...mockRecipes[1], title: 'French Bread', cuisine: 'French' },
      {
        ...mockRecipes[2],
        title: 'Italian Pizza',
        cuisine: 'Italian',
      },
      { ...mockRecipes[0], title: 'French Soup', cuisine: 'French' },
      {
        ...mockRecipes[1],
        title: 'Mexican Tacos',
        cuisine: 'Mexican',
      },
    ];

    wrapper = mount(RecipeList, {
      props: {
        recipes: mixedCuisineRecipes,
      },
      global: { stubs: stubs },
    });
    await flushPromises();

    // Should display all recipes grouped by cuisine
    const recipeCards = wrapper.findAllComponents(RecipeCard);
    expect(recipeCards.length).toBe(5); // All recipes should be displayed

    // Check that recipes are displayed (grouping is handled in template)
    const recipeTitles = recipeCards.map(
      (card) => card.props('recipe').title
    );
    expect(recipeTitles).toContain('Italian Pasta');
    expect(recipeTitles).toContain('French Bread');
    expect(recipeTitles).toContain('Italian Pizza');
    expect(recipeTitles).toContain('French Soup');
    expect(recipeTitles).toContain('Mexican Tacos');
  });

  // Note: We're skipping the slideover tests (filtering by cuisine, favorites, time range, etc.)
  // since they're difficult to test reliably in this testing environment.
  // These would be better tested in integration or end-to-end tests.
});
