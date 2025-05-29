import { type ITextStandardizationService } from '../../interfaces/ITextStandardizationService';
import { ShoppingItem, type ItemCategory } from '../../../domain/entities/ShoppingItem';
import { createId } from '@paralleldrive/cuid2';

export interface StandardizeShoppingTextDTO {
  text: string;
  language?: string;
}

export interface StandardizedItem {
  name: string;
  quantity: number;
  unit?: string;
  category?: ItemCategory;
}

export class StandardizeShoppingText {
  constructor(
    private readonly textStandardizationService: ITextStandardizationService
  ) {}

  async execute(dto: StandardizeShoppingTextDTO): Promise<StandardizedItem[]> {
    // Split text into lines and process each line
    const lines = dto.text
      .split(/[\n,]/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const standardizedItems: StandardizedItem[] = [];

    for (const line of lines) {
      try {
        const standardized = await this.textStandardizationService.standardizeText(
          line,
          dto.language || 'nl'
        );
        
        standardizedItems.push({
          name: standardized.name,
          quantity: standardized.quantity || 1,
          unit: standardized.unit,
          category: standardized.category
        });
      } catch (error) {
        // If standardization fails, add the raw text as an item
        standardizedItems.push({
          name: line,
          quantity: 1
        });
      }
    }

    return standardizedItems;
  }

  /**
   * Convert standardized items to ShoppingItem entities
   */
  toShoppingItems(standardizedItems: StandardizedItem[]): ShoppingItem[] {
    return standardizedItems.map(item => 
      new ShoppingItem(
        createId(),
        item.name,
        item.quantity,
        item.unit,
        item.category
      )
    );
  }
}