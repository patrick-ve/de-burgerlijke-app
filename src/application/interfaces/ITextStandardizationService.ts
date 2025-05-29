import { type ItemCategory } from '../../domain/entities/ShoppingItem';

export interface StandardizedText {
  name: string;
  quantity?: number;
  unit?: string;
  category?: ItemCategory;
}

export interface ITextStandardizationService {
  /**
   * Standardize raw text into structured shopping item data
   * Example: "2 liter melk" -> { name: "Melk", quantity: 2, unit: "l", category: "Zuivel & Eieren" }
   */
  standardizeText(text: string, language: string): Promise<StandardizedText>;
  
  /**
   * Batch standardize multiple texts
   */
  standardizeTexts(texts: string[], language: string): Promise<StandardizedText[]>;
}