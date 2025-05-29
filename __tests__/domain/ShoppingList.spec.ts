import { describe, it, expect } from 'vitest';
import { ShoppingList } from '../../src/domain/entities/ShoppingList';
import { ShoppingItem } from '../../src/domain/entities/ShoppingItem';
import { Money } from '../../src/domain/value-objects/Money';

describe('ShoppingItem Domain Entity', () => {
  const createValidItem = () => {
    return new ShoppingItem(
      'item-123',
      'Apples',
      5,
      'kg',
      'Groente & Fruit',
      'Red apples',
      false,
      new Money(2.50, 'EUR'),
      'Albert Heijn'
    );
  };

  describe('constructor', () => {
    it('should create a valid shopping item', () => {
      const item = createValidItem();
      
      expect(item.id).toBe('item-123');
      expect(item.name).toBe('Apples');
      expect(item.quantity).toBe(5);
      expect(item.unit).toBe('kg');
      expect(item.category).toBe('Groente & Fruit');
      expect(item.notes).toBe('Red apples');
      expect(item.completed).toBe(false);
      expect(item.estimatedPrice?.amount).toBe(2.50);
      expect(item.supermarket).toBe('Albert Heijn');
    });

    it('should throw error for empty name', () => {
      expect(() => {
        new ShoppingItem('item-123', '', 1);
      }).toThrow('Shopping item must have a name');
    });

    it('should throw error for non-positive quantity', () => {
      expect(() => {
        new ShoppingItem('item-123', 'Apples', 0);
      }).toThrow('Quantity must be positive');

      expect(() => {
        new ShoppingItem('item-123', 'Apples', -1);
      }).toThrow('Quantity must be positive');
    });
  });

  describe('toggleCompleted', () => {
    it('should toggle completion status', () => {
      const item = createValidItem();
      expect(item.completed).toBe(false);
      
      item.toggleCompleted();
      expect(item.completed).toBe(true);
      
      item.toggleCompleted();
      expect(item.completed).toBe(false);
    });
  });

  describe('quantity management', () => {
    it('should increase quantity', () => {
      const item = createValidItem();
      item.increaseQuantity(3);
      expect(item.quantity).toBe(8);
      
      item.increaseQuantity(); // Default is 1
      expect(item.quantity).toBe(9);
    });

    it('should decrease quantity but not below 1', () => {
      const item = new ShoppingItem('item-123', 'Apples', 3);
      
      item.decreaseQuantity(1);
      expect(item.quantity).toBe(2);
      
      item.decreaseQuantity(5); // Try to decrease by more than current
      expect(item.quantity).toBe(1); // Should stop at 1
    });
  });

  describe('price calculations', () => {
    it('should calculate total price correctly', () => {
      const item = createValidItem();
      const totalPrice = item.totalPrice;
      
      expect(totalPrice).toBeDefined();
      expect(totalPrice?.amount).toBe(12.50); // 2.50 * 5
      expect(totalPrice?.currency).toBe('EUR');
    });

    it('should return null for total price when no estimated price', () => {
      const item = new ShoppingItem('item-123', 'Apples', 5);
      expect(item.totalPrice).toBeNull();
    });

    it('should update price', () => {
      const item = new ShoppingItem('item-123', 'Apples', 5);
      expect(item.estimatedPrice).toBeUndefined();
      
      item.updatePrice(new Money(3.00, 'EUR'));
      expect(item.estimatedPrice?.amount).toBe(3.00);
    });
  });

  describe('toString', () => {
    it('should format item with quantity and unit', () => {
      const item = createValidItem();
      expect(item.toString()).toBe('5 kg Apples (Red apples)');
    });

    it('should format item with quantity but no unit', () => {
      const item = new ShoppingItem('item-123', 'Bananas', 6);
      expect(item.toString()).toBe('6x Bananas');
    });

    it('should format item with quantity 1 and no unit', () => {
      const item = new ShoppingItem('item-123', 'Watermelon', 1);
      expect(item.toString()).toBe('Watermelon');
    });

    it('should include notes if present', () => {
      const item = new ShoppingItem('item-123', 'Milk', 2, 'L', undefined, 'Low fat');
      expect(item.toString()).toBe('2 L Milk (Low fat)');
    });
  });
});

describe('ShoppingList Domain Entity', () => {
  const createValidList = () => {
    return new ShoppingList(
      'list-123',
      'Weekly Shopping'
    );
  };

  describe('constructor', () => {
    it('should create a valid shopping list', () => {
      const list = createValidList();
      
      expect(list.id).toBe('list-123');
      expect(list.name).toBe('Weekly Shopping');
      expect(list.items).toHaveLength(0);
      expect(list.createdAt).toBeDefined();
      expect(list.updatedAt).toBeDefined();
    });
  });

  describe('addItem', () => {
    it('should add new item to list', () => {
      const list = createValidList();
      const item = new ShoppingItem('item-1', 'Apples', 5, 'kg');
      
      list.addItem(item);
      
      expect(list.items).toHaveLength(1);
      expect(list.items[0].name).toBe('Apples');
    });

    it('should merge items with same name and category', () => {
      const list = createValidList();
      const item1 = new ShoppingItem('item-1', 'Apples', 3, 'kg', 'Groente & Fruit');
      const item2 = new ShoppingItem('item-2', 'Apples', 2, 'kg', 'Groente & Fruit');
      
      list.addItem(item1);
      list.addItem(item2);
      
      expect(list.items).toHaveLength(1);
      expect(list.items[0].quantity).toBe(5); // 3 + 2
    });

    it('should not merge items with same name but different categories', () => {
      const list = createValidList();
      const item1 = new ShoppingItem('item-1', 'Sugar', 1, 'kg', 'Kruidenierswaren');
      const item2 = new ShoppingItem('item-2', 'Sugar', 1, 'kg', 'Bakkerij');
      
      list.addItem(item1);
      list.addItem(item2);
      
      expect(list.items).toHaveLength(2);
    });

    it('should update updatedAt timestamp', () => {
      const list = createValidList();
      const originalUpdatedAt = list.updatedAt;
      
      setTimeout(() => {
        list.addItem(new ShoppingItem('item-1', 'Apples', 5));
        expect(list.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 10);
    });
  });

  describe('removeItem', () => {
    it('should remove item from list', () => {
      const list = createValidList();
      const item = new ShoppingItem('item-1', 'Apples', 5);
      
      list.addItem(item);
      expect(list.items).toHaveLength(1);
      
      list.removeItem('item-1');
      expect(list.items).toHaveLength(0);
    });

    it('should handle removing non-existent item', () => {
      const list = createValidList();
      list.removeItem('non-existent');
      expect(list.items).toHaveLength(0);
    });
  });

  describe('toggleItemCompleted', () => {
    it('should toggle item completion status', () => {
      const list = createValidList();
      const item = new ShoppingItem('item-1', 'Apples', 5);
      
      list.addItem(item);
      expect(list.items[0].completed).toBe(false);
      
      list.toggleItemCompleted('item-1');
      expect(list.items[0].completed).toBe(true);
    });
  });

  describe('clearCompleted', () => {
    it('should remove all completed items', () => {
      const list = createValidList();
      const item1 = new ShoppingItem('item-1', 'Apples', 5);
      const item2 = new ShoppingItem('item-2', 'Bananas', 3);
      const item3 = new ShoppingItem('item-3', 'Oranges', 2);
      
      list.addItem(item1);
      list.addItem(item2);
      list.addItem(item3);
      
      list.toggleItemCompleted('item-1');
      list.toggleItemCompleted('item-3');
      
      list.clearCompleted();
      
      expect(list.items).toHaveLength(1);
      expect(list.items[0].name).toBe('Bananas');
    });
  });

  describe('calculations', () => {
    it('should calculate total estimated cost', () => {
      const list = createValidList();
      const item1 = new ShoppingItem('item-1', 'Apples', 5, 'kg', undefined, undefined, false, new Money(2.50, 'EUR'));
      const item2 = new ShoppingItem('item-2', 'Bananas', 3, 'kg', undefined, undefined, false, new Money(1.50, 'EUR'));
      const item3 = new ShoppingItem('item-3', 'Oranges', 2); // No price
      
      list.addItem(item1);
      list.addItem(item2);
      list.addItem(item3);
      
      const total = list.totalEstimatedCost;
      expect(total).toBeDefined();
      expect(total?.amount).toBe(17.00); // (2.50 * 5) + (1.50 * 3)
      expect(total?.currency).toBe('EUR');
    });

    it('should return null for total cost when no items have prices', () => {
      const list = createValidList();
      list.addItem(new ShoppingItem('item-1', 'Apples', 5));
      
      expect(list.totalEstimatedCost).toBeNull();
    });

    it('should calculate completion counts', () => {
      const list = createValidList();
      const item1 = new ShoppingItem('item-1', 'Apples', 5);
      const item2 = new ShoppingItem('item-2', 'Bananas', 3);
      const item3 = new ShoppingItem('item-3', 'Oranges', 2);
      
      list.addItem(item1);
      list.addItem(item2);
      list.addItem(item3);
      
      expect(list.completedItemsCount).toBe(0);
      expect(list.pendingItemsCount).toBe(3);
      expect(list.completionPercentage).toBe(0);
      
      list.toggleItemCompleted('item-1');
      list.toggleItemCompleted('item-3');
      
      expect(list.completedItemsCount).toBe(2);
      expect(list.pendingItemsCount).toBe(1);
      expect(list.completionPercentage).toBe(67); // 2/3 * 100 rounded
    });
  });

  describe('groupByCategory', () => {
    it('should group items by category', () => {
      const list = createValidList();
      const item1 = new ShoppingItem('item-1', 'Apples', 5, 'kg', 'Groente & Fruit');
      const item2 = new ShoppingItem('item-2', 'Bananas', 3, 'kg', 'Groente & Fruit');
      const item3 = new ShoppingItem('item-3', 'Milk', 2, 'L', 'Zuivel & Eieren');
      const item4 = new ShoppingItem('item-4', 'Bread', 1); // No category
      
      list.addItem(item1);
      list.addItem(item2);
      list.addItem(item3);
      list.addItem(item4);
      
      const grouped = list.groupByCategory();
      
      expect(grouped.size).toBe(3);
      expect(grouped.get('Groente & Fruit')).toHaveLength(2);
      expect(grouped.get('Zuivel & Eieren')).toHaveLength(1);
      expect(grouped.get('Overig')).toHaveLength(1);
    });
  });
});