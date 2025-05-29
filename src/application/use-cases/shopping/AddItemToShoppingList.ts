import { ShoppingItem, type ItemCategory } from '../../../domain/entities/ShoppingItem';
import { type IShoppingListRepository } from '../../../domain/interfaces/IShoppingListRepository';
import { ShoppingList } from '../../../domain/entities/ShoppingList';
import { createId } from '@paralleldrive/cuid2';

export interface AddItemDTO {
  name: string;
  quantity?: number;
  unit?: string;
  category?: ItemCategory;
  notes?: string;
  listId?: string; // If not provided, add to active list
}

export class AddItemToShoppingList {
  constructor(
    private readonly shoppingListRepository: IShoppingListRepository
  ) {}

  async execute(dto: AddItemDTO): Promise<ShoppingItem> {
    let list: ShoppingList | null;
    
    if (dto.listId) {
      list = await this.shoppingListRepository.findById(dto.listId);
      if (!list) {
        throw new Error(`Shopping list with id ${dto.listId} not found`);
      }
    } else {
      list = await this.shoppingListRepository.findActive();
      if (!list) {
        // Create a new list if none exists
        list = new ShoppingList(
          createId(),
          'Boodschappenlijst',
          []
        );
        await this.shoppingListRepository.save(list);
        await this.shoppingListRepository.setActive(list.id);
      }
    }

    const item = new ShoppingItem(
      createId(),
      dto.name,
      dto.quantity || 1,
      dto.unit,
      dto.category,
      dto.notes
    );

    list.addItem(item);
    await this.shoppingListRepository.update(list);

    return item;
  }
}