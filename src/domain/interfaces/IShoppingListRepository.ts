import { type ShoppingList } from '../entities/ShoppingList';

export interface IShoppingListRepository {
  findAll(): Promise<ShoppingList[]>;
  findById(id: string): Promise<ShoppingList | null>;
  findActive(): Promise<ShoppingList | null>;
  save(shoppingList: ShoppingList): Promise<void>;
  update(shoppingList: ShoppingList): Promise<void>;
  delete(id: string): Promise<void>;
  setActive(id: string): Promise<void>;
}