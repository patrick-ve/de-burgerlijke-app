import { GroceryList } from '@/types';

export const mockGroceryLists: GroceryList[] = [
  {
    id: '1',
    name: 'Weekly Groceries',
    items: [
      { id: '1-1', name: 'Milk', quantity: 1, unit: 'gallon', checked: false },
      { id: '1-2', name: 'Eggs', quantity: 12, unit: '', checked: true },
      { id: '1-3', name: 'Bread', quantity: 1, unit: 'loaf', checked: false },
      { id: '1-4', name: 'Apples', quantity: 6, unit: '', checked: false },
      { id: '1-5', name: 'Chicken breast', quantity: 1, unit: 'lb', checked: true },
    ],
    createdAt: Date.now() - 86400000 * 2, // 2 days ago
  },
  {
    id: '2',
    name: 'Party Supplies',
    items: [
      { id: '2-1', name: 'Chips', quantity: 3, unit: 'bags', checked: false },
      { id: '2-2', name: 'Soda', quantity: 2, unit: 'liters', checked: false },
      { id: '2-3', name: 'Dip', quantity: 1, unit: 'container', checked: false },
      { id: '2-4', name: 'Paper plates', quantity: 1, unit: 'pack', checked: true },
      { id: '2-5', name: 'Napkins', quantity: 1, unit: 'pack', checked: true },
    ],
    createdAt: Date.now() - 86400000, // 1 day ago
  },
];