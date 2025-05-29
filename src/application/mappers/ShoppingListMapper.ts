import { ShoppingList as DomainShoppingList } from '../../domain/entities/ShoppingList';
import { ShoppingItem as DomainShoppingItem } from '../../domain/entities/ShoppingItem';
import { Money } from '../../domain/value-objects/Money';
import type { ShoppingListSimple as UIShoppingList, ShoppingItem as UIShoppingItem } from '../../../types/shopping-list';

export class ShoppingListMapper {
  static toDomain(uiList: UIShoppingList): DomainShoppingList {
    const items = uiList.items.map(item => ShoppingItemMapper.toDomain(item));
    
    return new DomainShoppingList(
      uiList.id,
      uiList.name || 'Shopping List',
      items,
      uiList.createdAt || new Date(),
      uiList.updatedAt || new Date()
    );
  }

  static toUI(domainList: DomainShoppingList): UIShoppingList {
    return {
      id: domainList.id,
      name: domainList.name,
      items: domainList.items.map(item => ShoppingItemMapper.toUI(item)),
      createdAt: domainList.createdAt,
      updatedAt: domainList.updatedAt
    };
  }
}

export class ShoppingItemMapper {
  static toDomain(uiItem: UIShoppingItem): DomainShoppingItem {
    let estimatedPrice: Money | undefined;
    if (uiItem.price) {
      estimatedPrice = new Money(uiItem.price, 'EUR');
    }

    return new DomainShoppingItem(
      uiItem.id,
      uiItem.name,
      uiItem.quantity || 1,
      uiItem.unit || undefined,
      uiItem.category as any || undefined,
      uiItem.notes || undefined,
      uiItem.checked || false,
      estimatedPrice,
      uiItem.supermarket || undefined
    );
  }

  static toUI(domainItem: DomainShoppingItem): UIShoppingItem {
    return {
      id: domainItem.id,
      name: domainItem.name,
      quantity: domainItem.quantity,
      unit: domainItem.unit,
      category: domainItem.category || 'Overig',
      notes: domainItem.notes,
      checked: domainItem.completed,
      recipeId: null,
      price: domainItem.estimatedPrice?.amount,
      supermarket: domainItem.supermarket,
      imageUrl: null
    };
  }
}