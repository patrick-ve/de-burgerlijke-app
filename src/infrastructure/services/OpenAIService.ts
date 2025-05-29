import { type IAIService, type GenerateRecipeInput, type GeneratedRecipeData } from '../../application/interfaces/IAIService';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

const recipeSchema = z.object({
  title: z.string(),
  description: z.string(),
  ingredients: z.array(z.object({
    name: z.string(),
    amount: z.number(),
    unit: z.string().optional(),
    notes: z.string().optional()
  })),
  instructions: z.array(z.string()),
  prepTime: z.string(),
  cookTime: z.string(),
  servings: z.number(),
  tags: z.array(z.string()).optional(),
  imageUrl: z.string().optional()
});

export class OpenAIService implements IAIService {
  constructor(private readonly apiKey: string) {}

  async generateRecipe(input: GenerateRecipeInput): Promise<GeneratedRecipeData> {
    const systemPrompt = `You are a professional chef assistant. Generate recipes based on user requests.
    ${input.servings ? `Make the recipe for ${input.servings} servings.` : ''}
    ${input.dietaryRestrictions?.length ? `Consider these dietary restrictions: ${input.dietaryRestrictions.join(', ')}` : ''}
    ${input.maxCookTime ? `Total cooking time should not exceed ${input.maxCookTime} minutes.` : ''}
    
    Important instructions:
    1. Translate all text to Dutch (title, description, ingredients, instructions)
    2. Use Dutch measurement units (ml, l, el, tl, kop, g, kg, stuk, teen, snuf, mespunt, plak, bol, takje, blaadje, scheut, handvol)
    3. Format times as "30min" or "1h 30min"
    4. Include relevant tags like "vegetarisch", "snel", "gezond", etc.
    5. Omit the word "Recept" from the title`;

    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: recipeSchema,
      system: systemPrompt,
      prompt: input.prompt,
    });

    return object as GeneratedRecipeData;
  }

  async generateRecipeImage(recipeTitle: string, description: string): Promise<string> {
    // For now, return a placeholder. In production, this would call DALL-E
    return `https://via.placeholder.com/800x600?text=${encodeURIComponent(recipeTitle)}`;
  }
}