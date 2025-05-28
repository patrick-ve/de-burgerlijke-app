import { type IShoppingListRepository } from '../../../domain/interfaces/IShoppingListRepository';
import { type ITextStandardizationService } from '../../interfaces/ITextStandardizationService';
import { ShoppingItem } from '../../../domain/entities/ShoppingItem';

export interface CleanUpShoppingListDTO {
  listId?: string; // If not provided, use active list
  mergeStrategy?: 'sum' | 'max' | 'keep-separate';
}

export interface CleanUpResult {
  itemsMerged: number;
  itemsStandardized: number;
  duplicatesRemoved: number;
  categoriesAssigned: number;
}

export class CleanUpShoppingList {
  constructor(
    private readonly shoppingListRepository: IShoppingListRepository,
    private readonly textStandardizationService: ITextStandardizationService
  ) {}

  async execute(dto: CleanUpShoppingListDTO): Promise<CleanUpResult> {
    // Get the shopping list
    let list;
    if (dto.listId) {
      list = await this.shoppingListRepository.findById(dto.listId);
      if (!list) {
        throw new Error(`Shopping list with id ${dto.listId} not found`);
      }
    } else {
      list = await this.shoppingListRepository.findActive();
      if (!list) {
        throw new Error('No active shopping list found');
      }
    }

    const result: CleanUpResult = {
      itemsMerged: 0,
      itemsStandardized: 0,
      duplicatesRemoved: 0,
      categoriesAssigned: 0
    };

    // Standardize all item names and assign categories
    const itemTexts = list.items.map(item => item.name);
    const standardizedTexts = await this.textStandardizationService.standardizeTexts(
      itemTexts,
      'nl'
    );

    // Update items with standardized data
    for (let i = 0; i < list.items.length; i++) {
      const item = list.items[i];
      const standardized = standardizedTexts[i];
      
      if (item.name !== standardized.name) {
        item.name = standardized.name;
        result.itemsStandardized++;
      }
      
      if (!item.category && standardized.category) {
        item.category = standardized.category;
        result.categoriesAssigned++;
      }
    }

    // Group items by name for merging
    const itemGroups = new Map<string, ShoppingItem[]>();
    for (const item of list.items) {
      const key = item.name.toLowerCase();
      if (!itemGroups.has(key)) {
        itemGroups.set(key, []);
      }
      itemGroups.get(key)!.push(item);
    }

    // Merge duplicates based on strategy
    const mergedItems: ShoppingItem[] = [];
    for (const [name, items] of itemGroups) {
      if (items.length === 1) {
        mergedItems.push(items[0]);
        continue;
      }

      // Multiple items with same name - merge them
      result.itemsMerged += items.length - 1;
      result.duplicatesRemoved += items.length - 1;

      const mergeStrategy = dto.mergeStrategy || 'sum';
      
      if (mergeStrategy === 'keep-separate') {
        mergedItems.push(...items);
      } else {
        // Create a merged item
        const firstItem = items[0];
        let totalQuantity = 0;
        
        if (mergeStrategy === 'sum') {
          totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
        } else if (mergeStrategy === 'max') {
          totalQuantity = Math.max(...items.map(item => item.quantity));
        }
        
        // Keep the first item and update its quantity
        firstItem.quantity = totalQuantity;
        
        // Merge notes if different
        const allNotes = items
          .map(item => item.notes)
          .filter(notes => notes && notes.trim().length > 0)
          .join(', ');
        
        if (allNotes) {
          firstItem.notes = allNotes;
        }
        
        mergedItems.push(firstItem);
      }
    }

    // Update the list with cleaned items
    list.items = mergedItems;
    list.updatedAt = new Date();
    
    await this.shoppingListRepository.update(list);

    return result;
  }
}