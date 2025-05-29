import { ShoppingList } from '../../domain/entities/ShoppingList';
import { ShoppingItem, type ItemCategory } from '../../domain/entities/ShoppingItem';
import { type IShoppingListRepository } from '../../domain/interfaces/IShoppingListRepository';
import { Money } from '../../domain/value-objects/Money';

interface StoredShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  category?: ItemCategory;
  notes?: string;
  completed: boolean;
  estimatedPrice?: {
    amount: number;
    currency: string;
  };
  supermarket?: string;
}

interface StoredShoppingList {
  id: string;
  name: string;
  items: StoredShoppingItem[];
  createdAt: string;
  updatedAt: string;
}

export class LocalStorageShoppingListRepository implements IShoppingListRepository {
  private readonly STORAGE_KEY = 'shoppingLists';
  private readonly ACTIVE_LIST_KEY = 'activeShoppingListId';

  private getStoredLists(): StoredShoppingList[] {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private saveStoredLists(lists: StoredShoppingList[]): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(lists));
  }

  private getActiveListId(): string | null {
    if (typeof window === 'undefined') return null;
    
    return localStorage.getItem(this.ACTIVE_LIST_KEY);
  }

  private setActiveListId(id: string | null): void {
    if (typeof window === 'undefined') return;
    
    if (id) {
      localStorage.setItem(this.ACTIVE_LIST_KEY, id);
    } else {
      localStorage.removeItem(this.ACTIVE_LIST_KEY);
    }
  }

  private toDomain(stored: StoredShoppingList): ShoppingList {
    const items = stored.items.map(item => 
      new ShoppingItem(
        item.id,
        item.name,
        item.quantity,
        item.unit,
        item.category,
        item.notes,
        item.completed,
        item.estimatedPrice ? new Money(
          item.estimatedPrice.amount,
          item.estimatedPrice.currency as any
        ) : undefined,
        item.supermarket
      )
    );

    return new ShoppingList(
      stored.id,
      stored.name,
      items,
      new Date(stored.createdAt),
      new Date(stored.updatedAt)
    );
  }

  private toStored(list: ShoppingList): StoredShoppingList {
    return {
      id: list.id,
      name: list.name,
      items: list.items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        notes: item.notes,
        completed: item.completed,
        estimatedPrice: item.estimatedPrice ? {
          amount: item.estimatedPrice.amount,
          currency: item.estimatedPrice.currency
        } : undefined,
        supermarket: item.supermarket
      })),
      createdAt: list.createdAt.toISOString(),
      updatedAt: list.updatedAt.toISOString()
    };
  }

  async findAll(): Promise<ShoppingList[]> {
    const stored = this.getStoredLists();
    return stored.map(s => this.toDomain(s));
  }

  async findById(id: string): Promise<ShoppingList | null> {
    const stored = this.getStoredLists();
    const found = stored.find(l => l.id === id);
    return found ? this.toDomain(found) : null;
  }

  async findActive(): Promise<ShoppingList | null> {
    const activeId = this.getActiveListId();
    if (!activeId) return null;
    
    return this.findById(activeId);
  }

  async save(shoppingList: ShoppingList): Promise<void> {
    const stored = this.getStoredLists();
    stored.push(this.toStored(shoppingList));
    this.saveStoredLists(stored);
    
    // If this is the first list, make it active
    if (stored.length === 1) {
      this.setActiveListId(shoppingList.id);
    }
  }

  async update(shoppingList: ShoppingList): Promise<void> {
    const stored = this.getStoredLists();
    const index = stored.findIndex(l => l.id === shoppingList.id);
    
    if (index === -1) {
      throw new Error(`Shopping list with id ${shoppingList.id} not found`);
    }
    
    stored[index] = this.toStored(shoppingList);
    this.saveStoredLists(stored);
  }

  async delete(id: string): Promise<void> {
    const stored = this.getStoredLists();
    const filtered = stored.filter(l => l.id !== id);
    this.saveStoredLists(filtered);
    
    // If we deleted the active list, clear the active ID
    if (this.getActiveListId() === id) {
      this.setActiveListId(null);
    }
  }

  async setActive(id: string): Promise<void> {
    const list = await this.findById(id);
    if (!list) {
      throw new Error(`Shopping list with id ${id} not found`);
    }
    
    this.setActiveListId(id);
  }
}