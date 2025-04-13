import { describe, it, expect, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import RecipeForm from '../components/RecipeForm.vue';
import type { Recipe, Ingredient, Step, Utensil } from '~/types/recipe'; // Assuming types/recipe.ts exists

// Mock Nuxt UI components used in RecipeForm
const UInput = { template: '<input :name="$attrs.name" :value="$attrs.modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />', inheritAttrs: false, emits: ['update:modelValue'] };
const UTextarea = { template: '<textarea :name="$attrs.name" :value="$attrs.modelValue" @input="$emit(\'update:modelValue\', $event.target.value)"></textarea>', inheritAttrs: false, emits: ['update:modelValue'] };
const UButton = {
  template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot />{{ label }}</button>',
  props: ['label'],
  emits: ['click'],
  inheritAttrs: false // Prevent attributes from rendering on the root if it's already the button
};
const UCard = { template: '<div><slot name="header" /><slot /></div>' };
const UFormGroup = { template: '<div><label><slot name="label" />{{ label }}</label><slot /></div>', props: ['label', 'name'] };
const UFieldset = { template: '<fieldset><legend><slot name="legend" />{{ legend }}</legend><slot /></fieldset>', props: ['legend'] };
const UIcon = { template: '<i class="icon"></i>' }; // Mock UIcon

describe('RecipeForm.vue', () => {
  let wrapper: VueWrapper<any>; // Use 'any' for now, replace with component instance type if needed

  const initialRecipeData: Recipe = {
    id: 'test-id',
    title: 'Test Recipe',
    description: 'Test Description',
    prepTime: '10 min',
    cookTime: '20 min',
    cuisine: 'Test Cuisine',
    portions: 4,
    ingredients: [
      { id: 'ing1', quantity: 1, unit: 'cup', name: 'Flour', notes: '' }
    ],
    steps: [
      { id: 'step1', description: 'Mix flour', order: 1 }
    ],
    utensils: [
      { id: 'ut1', name: 'Bowl' }
    ],
    isFavorite: false,
    userId: 'user1',
    householdId: null,
    sourceUrl: null,
    imageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mountComponent = (props = {}) => {
    return mount(RecipeForm, {
      props: {
        initialRecipe: { ...initialRecipeData },
        ...props,
      },
      global: {
        components: {
            UInput,
            UTextarea,
            UButton,
            UCard,
            UFormGroup,
            UFieldset,
            UIcon,
        }
      }
    });
  };

  beforeEach(() => {
    wrapper = mountComponent();
  });

  it('renders correctly with initial data', () => {
    expect(wrapper.exists()).toBe(true);
    // Cast element to specific types to access 'value'
    expect((wrapper.find('input[name="title"]').element as HTMLInputElement).value).toBe(initialRecipeData.title);
    expect((wrapper.find('textarea[name="description"]').element as HTMLTextAreaElement).value).toBe(initialRecipeData.description);
    expect((wrapper.find('input[name="prepTime"]').element as HTMLInputElement).value).toBe(initialRecipeData.prepTime);
    expect((wrapper.find('input[name="cookTime"]').element as HTMLInputElement).value).toBe(initialRecipeData.cookTime);
    expect((wrapper.find('input[name="cuisine"]').element as HTMLInputElement).value).toBe(initialRecipeData.cuisine);
    expect((wrapper.find('input[name="portions"]').element as HTMLInputElement).value).toBe(String(initialRecipeData.portions));
  });

  it('updates form data on input', async () => {
    const newTitle = 'Updated Test Recipe';
    const titleInput = wrapper.find('input[name="title"]');
    await titleInput.setValue(newTitle);
    expect(wrapper.vm.formData.title).toBe(newTitle);

    const newPortions = '6';
    const portionsInput = wrapper.find('input[name="portions"]');
    await portionsInput.setValue(newPortions);
    expect(wrapper.vm.formData.portions).toBe(parseInt(newPortions));
  });

  it('emits "submit" event with form data when submitted', async () => {
    const updatedTitle = 'Final Recipe Title';
    const titleInput = wrapper.find('input[name="title"]');
    await titleInput.setValue(updatedTitle);

    await wrapper.vm.handleSubmit();

    const emittedSubmit = wrapper.emitted('submit');
    expect(emittedSubmit).toBeTruthy();
    // Use non-null assertion after truthy check
    expect(emittedSubmit!.length).toBe(1);
    const emittedData = emittedSubmit![0][0] as Recipe;

    expect(emittedData.title).toBe(updatedTitle);
    expect(emittedData.description).toBe(initialRecipeData.description);
    expect(emittedData.portions).toBe(initialRecipeData.portions);
    expect(emittedData.ingredients.length).toBe(1);
    expect(emittedData.steps.length).toBe(1);
    expect(emittedData.utensils.length).toBe(1);
  });

  it('renders fields for ingredients', () => {
    const ingredientGroups = wrapper.findAll('.ingredient-group');
    expect(ingredientGroups.length).toBe(initialRecipeData.ingredients.length);

    const firstIngredientQtyInput = ingredientGroups[0].find('input[name^="ingredient-quantity-"]');
    expect(firstIngredientQtyInput.exists()).toBe(true);
    expect((firstIngredientQtyInput.element as HTMLInputElement).value).toBe(String(initialRecipeData.ingredients[0].quantity));
  });

   it('renders fields for steps', () => {
    const stepGroups = wrapper.findAll('.step-group');
    expect(stepGroups.length).toBe(initialRecipeData.steps.length);

    const firstStepTextarea = stepGroups[0].find('textarea[name^="step-description-"]');
    expect(firstStepTextarea.exists()).toBe(true);
    expect((firstStepTextarea.element as HTMLTextAreaElement).value).toBe(initialRecipeData.steps[0].description);
  });

  it('renders fields for utensils', () => {
    const utensilGroups = wrapper.findAll('.utensil-group');
    expect(utensilGroups.length).toBe(initialRecipeData.utensils.length);

    const firstUtensilInput = utensilGroups[0].find('input[name^="utensil-name-"]');
    expect(firstUtensilInput.exists()).toBe(true);
    expect((firstUtensilInput.element as HTMLInputElement).value).toBe(initialRecipeData.utensils[0].name);
  });

  // --- Tests for Adding/Removing Items --- 

  it('adds a new ingredient field when add ingredient button is clicked', async () => {
    const initialCount = wrapper.findAll('.ingredient-group').length;
    const addButton = wrapper.find('[data-testid="add-ingredient-button"]');
    await addButton.trigger('click');
    expect(wrapper.findAll('.ingredient-group').length).toBe(initialCount + 1);
    expect(wrapper.vm.formData.ingredients.length).toBe(initialCount + 1);
  });

  it('removes an ingredient field when remove button is clicked', async () => {
    // Ensure there's more than one ingredient to test removal
    await wrapper.find('[data-testid="add-ingredient-button"]').trigger('click');
    const initialCount = wrapper.findAll('.ingredient-group').length;
    expect(initialCount).toBeGreaterThan(1); // Make sure we have something to remove

    const removeButton = wrapper.find('[data-testid="remove-ingredient-button"]'); // Target the first remove button
    expect(removeButton.exists()).toBe(true); // Check if the button exists before clicking
    await removeButton.trigger('click');

    expect(wrapper.findAll('.ingredient-group').length).toBe(initialCount - 1);
    expect(wrapper.vm.formData.ingredients.length).toBe(initialCount - 1);
  });

  it('adds a new step field when add step button is clicked', async () => {
    const initialCount = wrapper.findAll('.step-group').length;
    const addButton = wrapper.find('[data-testid="add-step-button"]');
    await addButton.trigger('click');
    expect(wrapper.findAll('.step-group').length).toBe(initialCount + 1);
    expect(wrapper.vm.formData.steps.length).toBe(initialCount + 1);
  });

  it('removes a step field when remove button is clicked', async () => {
    // Ensure there's more than one step to test removal
    await wrapper.find('[data-testid="add-step-button"]').trigger('click');
    const initialCount = wrapper.findAll('.step-group').length;
    expect(initialCount).toBeGreaterThan(1); // Make sure we have something to remove

    const removeButton = wrapper.find('[data-testid="remove-step-button"]'); // Target the first remove button
    expect(removeButton.exists()).toBe(true); // Check if the button exists before clicking
    await removeButton.trigger('click');

    expect(wrapper.findAll('.step-group').length).toBe(initialCount - 1);
    expect(wrapper.vm.formData.steps.length).toBe(initialCount - 1);

  });

  it('adds a new utensil field when add utensil button is clicked', async () => {
    const initialCount = wrapper.findAll('.utensil-group').length;
    const addButton = wrapper.find('[data-testid="add-utensil-button"]');
    await addButton.trigger('click');
    expect(wrapper.findAll('.utensil-group').length).toBe(initialCount + 1);
    expect(wrapper.vm.formData.utensils.length).toBe(initialCount + 1);
  });

  it('removes a utensil field when remove button is clicked', async () => {
      // Add one to ensure removal is possible if initial state has 0 or 1
      await wrapper.find('[data-testid="add-utensil-button"]').trigger('click'); 
      const initialCount = wrapper.findAll('.utensil-group').length;
      expect(initialCount).toBeGreaterThan(0); // Make sure we have something to remove

      const removeButton = wrapper.find('[data-testid="remove-utensil-button"]'); // Target the first remove button
      expect(removeButton.exists()).toBe(true);
      await removeButton.trigger('click');

      expect(wrapper.findAll('.utensil-group').length).toBe(initialCount - 1);
      expect(wrapper.vm.formData.utensils.length).toBe(initialCount - 1);
    });

  // --- End Add/Remove Tests ---

  it('emits "cancel" event when cancel button is clicked', async () => {
    const cancelButton = wrapper.find('[data-testid="cancel-button"]');
    expect(cancelButton.exists()).toBe(true);
    await cancelButton.trigger('click');
    const emittedCancel = wrapper.emitted('cancel');
    expect(emittedCancel).toBeTruthy();
    expect(emittedCancel!.length).toBe(1);
  });

  // Add a test for the submit button
  it('emits "submit" event when submit button is clicked', async () => {
      const submitButton = wrapper.find('[data-testid="submit-button"]');
      expect(submitButton.exists()).toBe(true);

      // No need to call handleSubmit directly, trigger the form submission
      await wrapper.find('form').trigger('submit.prevent');

      const emittedSubmit = wrapper.emitted('submit');
      expect(emittedSubmit).toBeTruthy();
      expect(emittedSubmit!.length).toBe(1);
      const emittedData = emittedSubmit![0][0] as Recipe;
      expect(emittedData.title).toBe(initialRecipeData.title); // Check against initial (or modified) data
  });
}); 