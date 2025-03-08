import { z } from 'zod';

export const unitSchema = z
  .enum([
    'ml',
    'l',
    'el',
    'tl',
    'kop',
    'g',
    'kg',
    'stuk',
    'teen',
    'snuf',
    'mespunt',
    'plak',
    'bol',
    'takje',
    'blaadje',
    'scheut',
    'handvol',
  ])
  .describe('Dutch measurement units for ingredients');

export const ingredientSchema = z
  .object({
    amount: z
      .number()
      .positive()
      .describe('Amount of the ingredient (positive number)'),
    unit: unitSchema.describe(
      'Unit of measurement for the ingredient'
    ),
    name: z.string().describe('Name of the ingredient'),
  })
  .describe('Schema for an ingredient in the recipe');

export const instructionSchema = z
  .object({
    step: z
      .number()
      .positive()
      .describe('Sequence number of the preparation step'),
    text: z.string().describe('Description of the preparation step'),
    timer: z
      .number()
      .positive()
      .optional()
      .describe('Optional timer in minutes for this step'),
  })
  .describe('Schema for a preparation step in the recipe');

export const substitutionSchema = z
  .object({
    ingredient: z.string(),
    alternatives: z.array(z.string()),
  })
  .describe('Ingredient substitution suggestions');

export const aiEnhancementsSchema = z
  .object({
    tips: z.array(z.string()),
    substitutions: z.array(substitutionSchema),
    pairingsSuggestions: z.array(z.string()),
  })
  .describe('AI-generated enhancements for the recipe');

export const metadataSchema = z
  .object({
    servings: z
      .number()
      .positive()
      .describe('Number of servings this recipe yields'),
    cookingTime: z
      .number()
      .positive()
      .describe('Total cooking time in minutes'),
    cuisine: z
      .string()
      .describe('Type of cuisine (for example: Dutch, Italian)'),
  })
  .describe('Metadata about the recipe');

export const recipeSchema = z
  .object({
    title: z.string().describe('Title of the recipe'),
    description: z
      .string()
      .optional()
      .describe('Optional description of the recipe'),
    ingredients: z
      .array(ingredientSchema)
      .describe('List of ingredients'),
    instructions: z
      .array(instructionSchema)
      .describe('List of preparation steps'),
    metadata: metadataSchema.describe('Metadata about the recipe'),
  })
  .describe('Main schema for a complete recipe');

export type Recipe = z.infer<typeof recipeSchema>;
export type Ingredient = z.infer<typeof ingredientSchema>;
export type Instruction = z.infer<typeof instructionSchema>;
export type RecipeMetadata = z.infer<typeof metadataSchema>;
export type AiEnhancements = z.infer<typeof aiEnhancementsSchema>;
export type Substitution = z.infer<typeof substitutionSchema>;
