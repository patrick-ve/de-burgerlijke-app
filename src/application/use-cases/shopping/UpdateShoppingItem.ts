import { type IShoppingListRepository } from '../../../domain/interfaces/IShoppingListRepository';
import { type ItemCategory } from '../../../domain/entities/ShoppingItem';

export interface UpdateShoppingItemDTO {
  listId: string;
  itemId: string;
  name?: string;
  quantity?: number;
  unit?: string;
  category?: ItemCategory;
  notes?: string;
  completed?: boolean;
}

export class UpdateShoppingItem {
  constructor(
    private readonly shoppingListRepository: IShoppingListRepository
  ) {}

  async execute(dto: UpdateShoppingItemDTO): Promise<void> {
    const list = await this.shoppingListRepository.findById(dto.listId);
    
    if (!list) {
      throw new Error(`Shopping list with id ${dto.listId} not found`);
    }

    const item = list.items.find(i => i.id === dto.itemId);
    
    if (!item) {
      throw new Error(`Item with id ${dto.itemId} not found in shopping list`);
    }

    // Update item properties
    if (dto.name !== undefined) item.name = dto.name;
    if (dto.quantity !== undefined) item.quantity = dto.quantity;
    if (dto.unit !== undefined) item.unit = dto.unit;
    if (dto.category !== undefined) item.category = dto.category;
    if (dto.notes !== undefined) item.notes = dto.notes;
    if (dto.completed !== undefined) item.completed = dto.completed;

    list.updatedAt = new Date();
    await this.shoppingListRepository.update(list);
  }
}