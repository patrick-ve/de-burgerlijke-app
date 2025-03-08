import { describe, it, expect } from 'vitest';
import { useRecipeParser } from '~/composables/useRecipeParser';

describe('Recipe Parser', () => {
  const { parseRecipeUrl, extractRecipeData } = useRecipeParser();

  describe('parseRecipeUrl', () => {
    it('should validate supported recipe URLs', () => {
      const validUrls = [
        'https://www.allrecipes.com/recipe/24074/almond-butter-cookies/',
        'https://www.foodnetwork.com/recipes/alton-brown/good-eats-meatloaf-recipe-1937673',
        'https://www.epicurious.com/recipes/food/views/classic-beef-meatballs',
      ];

      validUrls.forEach((url) => {
        expect(parseRecipeUrl(url).isValid).toBe(true);
      });
    });

    it('should reject unsupported URLs', () => {
      const invalidUrls = [
        'https://example.com/recipe',
        'not-a-url',
        'https://www.google.com',
      ];

      invalidUrls.forEach((url) => {
        expect(parseRecipeUrl(url).isValid).toBe(false);
      });
    });
  });

  describe('extractRecipeData', () => {
    it('should extract basic recipe information', async () => {
      const testUrl =
        'https://www.allrecipes.com/recipe/24074/almond-butter-cookies/';
      const result = await extractRecipeData(testUrl);

      expect(result).toMatchObject({
        title: expect.any(String),
        ingredients: expect.arrayContaining([expect.any(String)]),
        instructions: expect.arrayContaining([expect.any(String)]),
        servings: expect.any(Number),
        prepTime: expect.any(String),
        cookTime: expect.any(String),
      });
    });

    it('should handle recipe extraction errors gracefully', async () => {
      const invalidUrl =
        'https://www.allrecipes.com/nonexistent-recipe';

      await expect(extractRecipeData(invalidUrl)).rejects.toThrow();
    });

    it('should normalize ingredient measurements', async () => {
      const testUrl =
        'https://www.foodnetwork.com/recipes/alton-brown/good-eats-meatloaf-recipe-1937673';
      const result = await extractRecipeData(testUrl);

      expect(result.ingredients).toSatisfy(
        (ingredients: string[]) => {
          return ingredients.every((ingredient) => {
            // Check if measurements are standardized
            const hasStandardMeasurement =
              /\d+(\.\d+)?\s*(g|ml|cups?|tbsp|tsp|oz|lb)/i.test(
                ingredient
              );
            return hasStandardMeasurement || !/\d/.test(ingredient); // Allow ingredients without measurements
          });
        }
      );
    });
  });

  describe('AI Processing', () => {
    it('should enhance recipe instructions with AI suggestions', async () => {
      const testUrl =
        'https://www.epicurious.com/recipes/food/views/classic-beef-meatballs';
      const result = await extractRecipeData(testUrl);

      expect(result.aiSuggestions).toBeDefined();
      expect(result.aiSuggestions).toMatchObject({
        tips: expect.arrayContaining([expect.any(String)]),
        substitutions: expect.arrayContaining([expect.any(String)]),
        nutritionalInfo: expect.any(Object),
      });
    });
  });
});
