import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AddItemToShoppingList, type AddItemDTO } from '../../src/application/use-cases/shopping/AddItemToShoppingList';
import { type IShoppingListRepository } from '../../src/domain/interfaces/IShoppingListRepository';
import { ShoppingList } from '../../src/domain/entities/ShoppingList';
import { ShoppingItem } from '../../src/domain/entities/ShoppingItem';

// Mock the cuid2 module
vi.mock('@paralleldrive/cuid2', () => ({
  createId: vi.fn()
    .mockReturnValueOnce('new-list-id')
    .mockReturnValueOnce('new-item-id')
    .mockReturnValue('test-id')
}));

describe('AddItemToShoppingList Use Case', () => {
  let mockShoppingListRepository: IShoppingListRepository;
  let addItemToShoppingList: AddItemToShoppingList;
  let existingList: ShoppingList;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create existing list
    existingList = new ShoppingList(
      'list-123',
      'Weekly Shopping',
      []
    );

    // Create mock repository
    mockShoppingListRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(existingList),
      findAll: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn(),
      findActive: vi.fn().mockResolvedValue(existingList),
      setActive: vi.fn().mockResolvedValue(undefined)
    };

    addItemToShoppingList = new AddItemToShoppingList(mockShoppingListRepository);
  });

  describe('execute', () => {
    it('should add item to active list when no listId provided', async () => {
      const dto: AddItemDTO = {
        name: 'Milk',
        quantity: 2,
        unit: 'L',
        category: 'Zuivel & Eieren',
        notes: 'Low fat'
      };

      const item = await addItemToShoppingList.execute(dto);

      expect(item).toBeDefined();
      expect(item.name).toBe('Milk');
      expect(item.quantity).toBe(2);
      expect(item.unit).toBe('L');
      expect(item.category).toBe('Zuivel & Eieren');
      expect(item.notes).toBe('Low fat');
      expect(item.completed).toBe(false);
    });

    it('should add item to specific list when listId provided', async () => {
      const dto: AddItemDTO = {
        name: 'Bread',
        quantity: 1,
        listId: 'list-123'
      };

      const item = await addItemToShoppingList.execute(dto);

      expect(mockShoppingListRepository.findById).toHaveBeenCalledWith('list-123');
      expect(item.name).toBe('Bread');
      expect(mockShoppingListRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'list-123',
          items: expect.arrayContaining([
            expect.objectContaining({ name: 'Bread' })
          ])
        })
      );
    });

    it('should create new list if no active list exists', async () => {
      mockShoppingListRepository.findActive = vi.fn().mockResolvedValue(null);

      const dto: AddItemDTO = {
        name: 'Apples',
        quantity: 5
      };

      const item = await addItemToShoppingList.execute(dto);

      expect(mockShoppingListRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Boodschappenlijst',
          items: []
        })
      );
      expect(mockShoppingListRepository.setActive).toHaveBeenCalled();
      expect(item.name).toBe('Apples');
    });

    it('should use default quantity of 1 when not provided', async () => {
      const dto: AddItemDTO = {
        name: 'Banana'
      };

      const item = await addItemToShoppingList.execute(dto);

      expect(item.quantity).toBe(1);
    });

    it('should handle optional fields correctly', async () => {
      const dto: AddItemDTO = {
        name: 'Orange'
      };

      const item = await addItemToShoppingList.execute(dto);

      expect(item.name).toBe('Orange');
      expect(item.quantity).toBe(1);
      expect(item.unit).toBeUndefined();
      expect(item.category).toBeUndefined();
      expect(item.notes).toBeUndefined();
    });

    it('should throw error when specific list not found', async () => {
      mockShoppingListRepository.findById = vi.fn().mockResolvedValue(null);

      const dto: AddItemDTO = {
        name: 'Test Item',
        listId: 'non-existent-list'
      };

      await expect(addItemToShoppingList.execute(dto)).rejects.toThrow(
        'Shopping list with id non-existent-list not found'
      );
    });

    it('should merge items with same name and category', async () => {
      // Add existing item to list
      const existingItem = new ShoppingItem(
        'existing-item-id',
        'Apples',
        3,
        'kg',
        'Groente & Fruit'
      );
      existingList.addItem(existingItem);

      const dto: AddItemDTO = {
        name: 'Apples',
        quantity: 2,
        unit: 'kg',
        category: 'Groente & Fruit'
      };

      await addItemToShoppingList.execute(dto);

      expect(mockShoppingListRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              name: 'Apples',
              quantity: 5, // 3 + 2
              category: 'Groente & Fruit'
            })
          ])
        })
      );
    });

    it('should not merge items with same name but different categories', async () => {
      // Add existing item to list
      const existingItem = new ShoppingItem(
        'existing-item-id',
        'Sugar',
        1,
        'kg',
        'Kruidenierswaren'
      );
      existingList.addItem(existingItem);

      const dto: AddItemDTO = {
        name: 'Sugar',
        quantity: 1,
        unit: 'kg',
        category: 'Bakkerij'
      };

      await addItemToShoppingList.execute(dto);

      // Should have 2 separate items
      expect(existingList.items).toHaveLength(2);
    });

    it('should throw error for empty item name', async () => {
      const dto: AddItemDTO = {
        name: '',
        quantity: 1
      };

      await expect(addItemToShoppingList.execute(dto)).rejects.toThrow(
        'Shopping item must have a name'
      );
    });

    it('should throw error for non-positive quantity', async () => {
      const dto: AddItemDTO = {
        name: 'Test Item',
        quantity: 0
      };

      await expect(addItemToShoppingList.execute(dto)).rejects.toThrow(
        'Quantity must be positive'
      );
    });

    it('should handle repository update errors', async () => {
      mockShoppingListRepository.update = vi.fn().mockRejectedValue(
        new Error('Database error')
      );

      const dto: AddItemDTO = {
        name: 'Test Item'
      };

      await expect(addItemToShoppingList.execute(dto)).rejects.toThrow(
        'Database error'
      );
    });
  });
});