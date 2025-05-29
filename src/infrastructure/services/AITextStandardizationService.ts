import { type ITextStandardizationService, type StandardizedText } from '../../application/interfaces/ITextStandardizationService';
import { type ItemCategory } from '../../domain/entities/ShoppingItem';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

const StandardizedItemSchema = z.object({
  name: z.string().describe('The standardized ingredient name in the target language'),
  quantity: z.number().nullable().describe('The extracted quantity, or null if not specified'),
  unit: z.string().nullable().describe('The standardized unit (e.g., g, kg, ml, l, stuk), or null if not applicable'),
  category: z.string().nullable().describe('The ingredient category from the predefined list')
});

export class AITextStandardizationService implements ITextStandardizationService {
  private readonly categories: ItemCategory[] = [
    'Groente & Fruit',
    'Vlees & Vis',
    'Zuivel & Eieren',
    'Brood & Bakkerij',
    'Kruidenierswaren',
    'Diepvries',
    'Dranken',
    'Huishouden',
    'Verzorging',
    'Overig'
  ];

  constructor(private readonly apiKey: string) {}

  async standardizeText(text: string, language: string): Promise<StandardizedText> {
    const systemPrompt = this.createSystemPrompt(language);
    
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: StandardizedItemSchema,
      system: systemPrompt,
      prompt: text,
    });

    return {
      name: object.name,
      quantity: object.quantity || undefined,
      unit: object.unit || undefined,
      category: this.validateCategory(object.category)
    };
  }

  async standardizeTexts(texts: string[], language: string): Promise<StandardizedText[]> {
    // For batch processing, we could optimize this with a single AI call
    // For now, process each text individually
    const results: StandardizedText[] = [];
    
    for (const text of texts) {
      try {
        const standardized = await this.standardizeText(text, language);
        results.push(standardized);
      } catch (error) {
        // If standardization fails, return basic result
        results.push({
          name: text,
          quantity: 1
        });
      }
    }
    
    return results;
  }

  private createSystemPrompt(language: string): string {
    const lang = language === 'nl' ? 'Dutch' : 'English';
    
    return `You are an AI assistant specialized in parsing shopping list entries.
    Parse the input text and extract structured information.
    
    Instructions:
    1. Extract the main ingredient name and standardize it in ${lang}
    2. Extract quantity if specified (return null if not found)
    3. Extract and standardize the unit using common ${lang} abbreviations:
       - Dutch: ml, l, el, tl, g, kg, stuk, teen, snuf, pak, blik, bos
       - English: ml, l, tbsp, tsp, g, kg, piece, clove, pinch, pack, can, bunch
    4. Determine the category from this list: ${this.categories.join(', ')}
    5. Return null for any field that is not applicable
    
    Examples:
    - "2 liter melk" -> { name: "Melk", quantity: 2, unit: "l", category: "Zuivel & Eieren" }
    - "Brood" -> { name: "Brood", quantity: null, unit: null, category: "Brood & Bakkerij" }
    - "500g kipfilet" -> { name: "Kipfilet", quantity: 500, unit: "g", category: "Vlees & Vis" }`;
  }

  private validateCategory(category: string | null): ItemCategory | undefined {
    if (!category) return undefined;
    
    return this.categories.includes(category as ItemCategory) 
      ? category as ItemCategory 
      : undefined;
  }
}