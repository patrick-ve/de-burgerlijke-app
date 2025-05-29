import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateRecipe } from '../../src/application/use-cases/recipes/CreateRecipe';
import { type IRecipeRepository } from '../../src/domain/interfaces/IRecipeRepository';
import { type CreateRecipeDTO } from '../../src/application/dto/CreateRecipeDTO';
import { Recipe } from '../../src/domain/entities/Recipe';

// Mock the cuid2 module
vi.mock('@paralleldrive/cuid2', () => ({
  createId: () => 'test-recipe-id'
}));

describe('CreateRecipe Use Case', () => {
  let mockRecipeRepository: IRecipeRepository;
  let createRecipe: CreateRecipe;

  beforeEach(() => {
    // Create mock repository
    mockRecipeRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      search: vi.fn(),
      findByTags: vi.fn()
    };

    createRecipe = new CreateRecipe(mockRecipeRepository);
  });

  const createValidDTO = (): CreateRecipeDTO => ({
    title: 'Chocolate Chip Cookies',
    description: 'Delicious homemade chocolate chip cookies',
    ingredients: [
      {
        name: 'All-purpose flour',
        amount: 2.25,
        unit: 'cup' as any,
        notes: 'sifted'
      },
      {
        name: 'Butter',
        amount: 1,
        unit: 'cup' as any,
        notes: 'softened'
      },
      {
        name: 'Chocolate chips',
        amount: 2,
        unit: 'cup' as any
      }
    ],
    instructions: [
      'Preheat oven to 375°F',
      'Mix dry ingredients',
      'Cream butter and sugar',
      'Add eggs and vanilla',
      'Combine wet and dry ingredients',
      'Fold in chocolate chips',
      'Drop onto baking sheet',
      'Bake for 9-11 minutes'
    ],
    prepTime: '15min',
    cookTime: '10min',
    servings: 48,
    tags: ['dessert', 'cookies', 'chocolate']
  });

  describe('execute', () => {
    it('should create a recipe successfully', async () => {
      const dto = createValidDTO();
      const recipe = await createRecipe.execute(dto);

      expect(recipe).toBeDefined();
      expect(recipe.id).toBe('test-recipe-id');
      expect(recipe.title).toBe('Chocolate Chip Cookies');
      expect(recipe.description).toBe('Delicious homemade chocolate chip cookies');
      expect(recipe.ingredients).toHaveLength(3);
      expect(recipe.instructions).toHaveLength(8);
      expect(recipe.servings).toBe(48);
      expect(recipe.tags).toContain('dessert');
      expect(recipe.tags).toContain('cookies');
      expect(recipe.tags).toContain('chocolate');
    });

    it('should parse time durations correctly', async () => {
      const dto = createValidDTO();
      const recipe = await createRecipe.execute(dto);

      expect(recipe.prepTime.minutes).toBe(15);
      expect(recipe.cookTime.minutes).toBe(10);
      expect(recipe.totalTime.minutes).toBe(25);
    });

    it('should handle complex time formats', async () => {
      const dto = createValidDTO();
      dto.prepTime = '1h 30min';
      dto.cookTime = '2h';

      const recipe = await createRecipe.execute(dto);

      expect(recipe.prepTime.minutes).toBe(90);
      expect(recipe.cookTime.minutes).toBe(120);
      expect(recipe.totalTime.minutes).toBe(210);
    });

    it('should save recipe to repository', async () => {
      const dto = createValidDTO();
      await createRecipe.execute(dto);

      expect(mockRecipeRepository.save).toHaveBeenCalledTimes(1);
      expect(mockRecipeRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Chocolate Chip Cookies',
          servings: 48
        })
      );
    });

    it('should create recipe with nutrition info', async () => {
      const dto = createValidDTO();
      dto.nutrition = {
        calories: 150,
        protein: 2,
        carbs: 20,
        fat: 8,
        fiber: 1,
        sugar: 12,
        sodium: 125
      };

      const recipe = await createRecipe.execute(dto);

      expect(recipe.nutrition).toBeDefined();
      expect(recipe.nutrition?.calories).toBe(150);
      expect(recipe.nutrition?.protein).toBe(2);
      expect(recipe.nutrition?.carbs).toBe(20);
      expect(recipe.nutrition?.fat).toBe(8);
      expect(recipe.nutrition?.fiber).toBe(1);
      expect(recipe.nutrition?.sugar).toBe(12);
      expect(recipe.nutrition?.sodium).toBe(125);
    });

    it('should handle optional fields', async () => {
      const dto: CreateRecipeDTO = {
        title: 'Simple Recipe',
        description: 'A simple recipe',
        ingredients: [
          {
            name: 'Ingredient',
            amount: 1
          }
        ],
        instructions: ['Do something'],
        prepTime: '5min',
        cookTime: '5min',
        servings: 1
      };

      const recipe = await createRecipe.execute(dto);

      expect(recipe.tags).toHaveLength(0);
      expect(recipe.imageUrl).toBeUndefined();
      expect(recipe.sourceUrl).toBeUndefined();
      expect(recipe.nutrition).toBeUndefined();
    });

    it('should throw error for invalid recipe data', async () => {
      const dto = createValidDTO();
      dto.title = ''; // Invalid title

      await expect(createRecipe.execute(dto)).rejects.toThrow('Recipe must have a title');
    });

    it('should throw error for recipe with no ingredients', async () => {
      const dto = createValidDTO();
      dto.ingredients = [];

      await expect(createRecipe.execute(dto)).rejects.toThrow('Recipe must have at least one ingredient');
    });

    it('should throw error for recipe with no instructions', async () => {
      const dto = createValidDTO();
      dto.instructions = [];

      await expect(createRecipe.execute(dto)).rejects.toThrow('Recipe must have at least one instruction');
    });

    it('should throw error for non-positive servings', async () => {
      const dto = createValidDTO();
      dto.servings = 0;

      await expect(createRecipe.execute(dto)).rejects.toThrow('Recipe must have positive number of servings');
    });

    it('should handle repository errors', async () => {
      const dto = createValidDTO();
      const error = new Error('Database connection failed');
      mockRecipeRepository.save = vi.fn().mockRejectedValue(error);

      await expect(createRecipe.execute(dto)).rejects.toThrow('Database connection failed');
    });

    it('should include image and source URLs when provided', async () => {
      const dto = createValidDTO();
      dto.imageUrl = 'https://example.com/cookies.jpg';
      dto.sourceUrl = 'https://example.com/recipe';

      const recipe = await createRecipe.execute(dto);

      expect(recipe.imageUrl).toBe('https://example.com/cookies.jpg');
      expect(recipe.sourceUrl).toBe('https://example.com/recipe');
    });
  });
});