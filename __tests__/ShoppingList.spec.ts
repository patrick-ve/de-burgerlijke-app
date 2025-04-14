import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ShoppingList from '../components/ShoppingList.vue'; // Import the actual component
import type { ShoppingListItem } from '~/types/shopping-list';

// Mock Nuxt UI components used within ShoppingList
const UCheckbox = {
  props: ['modelValue', 'ariaLabel', 'ui'],
  emits: ['update:modelValue'],
  template:
    '<input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
};

describe('ShoppingList.vue', () => {
  // Mock data using the actual ShoppingListItem interface
  const mockAggregatedItems: ShoppingListItem[] = [
    {
      id: 'agg-1',
      ingredientName: 'Onion',
      standardizedName: 'Onion',
      aggregatedQuantity: 3,
      unit: null,
      isChecked: false,
      recipeIds: ['recipe-1', 'recipe-4'],
      createdAt: new Date(),
      updatedAt: new Date(),
      priceInfo: [], // Added empty priceInfo array
    },
    {
      id: 'agg-2',
      ingredientName: 'Chicken Breast',
      standardizedName: 'Chicken Breast',
      aggregatedQuantity: 500,
      unit: 'g',
      isChecked: false,
      recipeIds: ['recipe-2'],
      createdAt: new Date(),
      updatedAt: new Date(),
      priceInfo: [], // Added empty priceInfo array
    },
    {
      id: 'agg-3',
      ingredientName: 'Milk',
      standardizedName: 'Milk',
      aggregatedQuantity: 1,
      unit: 'L',
      isChecked: true, // This item starts checked
      recipeIds: ['recipe-3'],
      createdAt: new Date(),
      updatedAt: new Date(),
      priceInfo: [], // Added empty priceInfo array
    },
    {
      id: 'agg-5',
      ingredientName: 'Flour',
      standardizedName: 'Flour',
      aggregatedQuantity: 250,
      unit: 'g',
      isChecked: false,
      recipeIds: ['recipe-5'],
      createdAt: new Date(),
      updatedAt: new Date(),
      priceInfo: [], // Added empty priceInfo array
    },
  ];

  const mountComponent = (items: ShoppingListItem[]) => {
    return mount(ShoppingList, {
      props: { items },
      global: {
        stubs: {
          UCheckbox: UCheckbox, // Stub UCheckbox
        },
      },
    });
  };

  it('renders the list of shopping items', () => {
    const wrapper = mountComponent(mockAggregatedItems);
    const listItems = wrapper.findAll(
      '[data-testid="shopping-list-item"]'
    );
    expect(listItems).toHaveLength(mockAggregatedItems.length);
  });

  it('displays the correct name, quantity, and unit for each item', () => {
    const wrapper = mountComponent(mockAggregatedItems);
    const listItems = wrapper.findAll(
      '[data-testid="shopping-list-item"]'
    );

    // Test first item (Onion)
    const firstItem = listItems[0];
    expect(firstItem.find('[data-testid="item-name"]').text()).toBe(
      'Onion'
    );
    expect(
      firstItem.find('[data-testid="item-details"]').text()
    ).toBe('3'); // Quantity only

    // Test second item (Chicken Breast)
    const secondItem = listItems[1];
    expect(secondItem.find('[data-testid="item-name"]').text()).toBe(
      'Chicken Breast'
    );
    expect(
      secondItem.find('[data-testid="item-details"]').text()
    ).toBe('500 g'); // Quantity and unit

    // Test third item (Milk)
    const thirdItem = listItems[2];
    expect(thirdItem.find('[data-testid="item-name"]').text()).toBe(
      'Milk'
    );
    expect(
      thirdItem.find('[data-testid="item-details"]').text()
    ).toBe('1 L'); // Quantity and unit
  });

  it('allows items to be checked off and emits an update event', async () => {
    const wrapper = mountComponent(mockAggregatedItems);
    const firstItemCheckbox = wrapper.find(
      '[data-testid="shopping-list-item"]:first-child [data-testid="item-checkbox"] input[type="checkbox"]'
    );

    // Ensure it's initially unchecked
    expect(
      (firstItemCheckbox.element as HTMLInputElement).checked
    ).toBe(false);

    // Simulate checking the box
    await firstItemCheckbox.setValue(true);

    // Verify the event was emitted with the correct payload
    expect(wrapper.emitted()).toHaveProperty('update:item');
    expect(wrapper.emitted('update:item')).toHaveLength(1);
    const emittedPayload = wrapper.emitted('update:item')![0][0];

    // Create expected payload (copy original item, update isChecked)
    const expectedPayload = {
      ...mockAggregatedItems[0],
      isChecked: true,
    };

    // Compare emitted payload with expected payload
    expect(emittedPayload).toEqual(expectedPayload);
  });

  it('visually indicates checked-off items', () => {
    const wrapper = mountComponent(mockAggregatedItems);
    const listItems = wrapper.findAll(
      '[data-testid="shopping-list-item"]'
    );

    // Third item (Milk) should be checked initially
    const checkedItemElement = listItems[2];
    expect(checkedItemElement.classes()).toContain('bg-gray-50');
    expect(checkedItemElement.classes()).toContain('opacity-70');
    expect(
      checkedItemElement.find('[data-testid="item-name"]').classes()
    ).toContain('line-through');
    expect(
      checkedItemElement
        .find('[data-testid="item-details"]')
        .classes()
    ).toContain('line-through');

    // First item (Onion) should be unchecked initially
    const uncheckedItemElement = listItems[0];
    expect(uncheckedItemElement.classes()).not.toContain(
      'bg-gray-50'
    );
    expect(uncheckedItemElement.classes()).not.toContain(
      'opacity-70'
    );
    expect(
      uncheckedItemElement.find('[data-testid="item-name"]').classes()
    ).not.toContain('line-through');
    expect(
      uncheckedItemElement
        .find('[data-testid="item-details"]')
        .classes()
    ).not.toContain('line-through');
  });

  it('displays an empty state message when no items are provided', () => {
    const wrapper = mountComponent([]);
    expect(
      wrapper.find('[data-testid="empty-list-message"]').exists()
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="shopping-list"]').exists()
    ).toBe(false);
    expect(wrapper.text()).toContain('Je boodschappenlijst is leeg.');
  });

  // Future tests to add:
  // - Displaying price information
  // - Manual item addition/editing
});
