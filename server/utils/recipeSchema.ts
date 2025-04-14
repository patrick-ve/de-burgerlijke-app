import { z } from 'zod';

// Define the enum part
const specificUnits = z.enum([
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
]);

// Use union to explicitly allow string or null after preprocessing "null"
export const unitSchema = z
  .preprocess(
    (val) => (val === 'null' ? null : val),
    z.union([z.string(), z.null()]) // Allow string OR null
  )
  .describe('Unit for ingredient (string or null)');

export const ingredientSchema = z
  .object({
    quantity: z
      .number()
      .nullable()
      .describe('Amount of the ingredient (positive number or null)'),
    unit: unitSchema.describe(
      'Unit of measurement for the ingredient'
    ),
    name: z.string().describe('Name of the ingredient'),
    notes: z
      .string()
      .nullable()
      .optional()
      .describe('Optional notes for the ingredient'),
  })
  .describe('Schema for an ingredient in the recipe');

export const stepSchema = z
  .object({
    order: z
      .number()
      .describe('Sequence number of the preparation step'),
    description: z
      .string()
      .describe('Description of the preparation step'),
    timer: z
      .number()
      .nullable()
      .optional()
      .describe(
        'Optional timer in milliseconds for this step (can be null)'
      ),
    isComplete: z
      .boolean()
      .optional()
      .default(false)
      .describe('Whether the step is complete'),
  })
  .describe('Schema for a preparation step in the recipe');

export const recipeSchema = z
  .object({
    title: z.string().describe('Title of the recipe'),
    description: z
      .string()
      .nullable()
      .optional()
      .describe('Optional description of the recipe'),
    prepTime: z
      .number()
      .nullable()
      .optional()
      .describe('Optional preparation time in minutes'),
    cookTime: z
      .number()
      .nullable()
      .optional()
      .describe('Optional cooking time in minutes'),
    portions: z
      .number()
      .positive()
      .describe('Number of portions this recipe yields'),
    cuisine: z
      .string()
      .nullable()
      .optional()
      .describe('Optional type of cuisine (e.g., Dutch, Italian)'),
    ingredients: z
      .array(ingredientSchema)
      .describe('List of ingredients'),
    steps: z.array(stepSchema).describe('List of preparation steps'),
    sourceUrl: z
      .string()
      .url()
      .nullable()
      .optional()
      .describe('Optional source URL of the recipe'),
    youtubeUrl: z
      .string()
      .url()
      .nullable()
      .optional()
      .describe('Optional YouTube URL for the recipe'),
    imageUrl: z
      .string()
      .url()
      .nullable()
      .optional()
      .describe('Optional image URL for the recipe'),
  })
  .describe(
    'Main schema for a complete recipe, aligned with types/recipe.ts'
  );

export type AIRecipeDTO = z.infer<typeof recipeSchema>;
export type Ingredient = z.infer<typeof ingredientSchema>;
export type Step = z.infer<typeof stepSchema>;
