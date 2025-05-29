import { describe, it, expect } from 'vitest';
import { Recipe } from '../../src/domain/entities/Recipe';
import { RecipeIngredient } from '../../src/domain/value-objects/RecipeIngredient';
import { Duration } from '../../src/domain/value-objects/Duration';
import { Quantity } from '../../src/domain/value-objects/Quantity';
import { NutritionalInfo } from '../../src/domain/value-objects/NutritionalInfo';

describe('Recipe Domain Entity', () => {
  const createValidRecipe = () => {
    const ingredients = [
      new RecipeIngredient('Flour', new Quantity(500, 'g' as any)),
      new RecipeIngredient('Sugar', new Quantity(200, 'g' as any)),
      new RecipeIngredient('Eggs', new Quantity(3, undefined))
    ];
    
    const instructions = [
      'Mix dry ingredients',
      'Add eggs and mix well',
      'Bake at 180°C for 30 minutes'
    ];
    
    return new Recipe(
      'recipe-123',
      'Chocolate Cake',
      'Delicious chocolate cake',
      ingredients,
      instructions,
      new Duration(20),
      new Duration(30),
      8,
      ['dessert', 'chocolate']
    );
  };

  describe('constructor', () => {
    it('should create a valid recipe', () => {
      const recipe = createValidRecipe();
      
      expect(recipe.id).toBe('recipe-123');
      expect(recipe.title).toBe('Chocolate Cake');
      expect(recipe.description).toBe('Delicious chocolate cake');
      expect(recipe.ingredients).toHaveLength(3);
      expect(recipe.instructions).toHaveLength(3);
      expect(recipe.servings).toBe(8);
      expect(recipe.tags).toContain('dessert');
      expect(recipe.tags).toContain('chocolate');
    });

    it('should calculate total time correctly', () => {
      const recipe = createValidRecipe();
      expect(recipe.totalTime.minutes).toBe(50); // 20 + 30
    });
  });

  describe('validation', () => {
    it('should throw error for empty title', () => {
      expect(() => {
        const recipe = createValidRecipe();
        recipe.title = '';
        recipe.validate();
      }).toThrow('Recipe must have a title');
    });

    it('should throw error for empty ingredients', () => {
      expect(() => {
        new Recipe(
          'recipe-123',
          'Test Recipe',
          'Description',
          [],
          ['instruction'],
          new Duration(10),
          new Duration(20),
          4,
          []
        ).validate();
      }).toThrow('Recipe must have at least one ingredient');
    });

    it('should throw error for empty instructions', () => {
      expect(() => {
        const ingredients = [new RecipeIngredient('Flour', new Quantity(500, 'g' as any))];
        new Recipe(
          'recipe-123',
          'Test Recipe',
          'Description',
          ingredients,
          [],
          new Duration(10),
          new Duration(20),
          4,
          []
        ).validate();
      }).toThrow('Recipe must have at least one instruction');
    });

    it('should throw error for non-positive servings', () => {
      expect(() => {
        const recipe = createValidRecipe();
        recipe.servings = 0;
        recipe.validate();
      }).toThrow('Recipe must have positive number of servings');
    });
  });

  describe('updateServings', () => {
    it('should update servings and scale ingredients', () => {
      const recipe = createValidRecipe();
      recipe.updateServings(4); // Half the servings
      
      expect(recipe.servings).toBe(4);
      expect(recipe.ingredients[0].quantity.amount).toBe(250); // 500 / 2
      expect(recipe.ingredients[1].quantity.amount).toBe(100); // 200 / 2
      expect(recipe.ingredients[2].quantity.amount).toBe(1.5); // 3 / 2
    });

    it('should throw error for non-positive servings', () => {
      const recipe = createValidRecipe();
      expect(() => recipe.updateServings(0)).toThrow('Servings must be positive');
      expect(() => recipe.updateServings(-1)).toThrow('Servings must be positive');
    });

    it('should update updatedAt timestamp', () => {
      const recipe = createValidRecipe();
      const originalUpdatedAt = recipe.updatedAt;
      
      // Wait a bit to ensure timestamp changes
      setTimeout(() => {
        recipe.updateServings(10);
        expect(recipe.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 10);
    });
  });

  describe('tag management', () => {
    it('should add new tags', () => {
      const recipe = createValidRecipe();
      recipe.addTag('vegan');
      
      expect(recipe.tags).toContain('vegan');
      expect(recipe.tags).toHaveLength(3);
    });

    it('should not add duplicate tags', () => {
      const recipe = createValidRecipe();
      recipe.addTag('dessert'); // Already exists
      
      expect(recipe.tags).toHaveLength(2); // Should remain the same
    });

    it('should remove tags', () => {
      const recipe = createValidRecipe();
      recipe.removeTag('chocolate');
      
      expect(recipe.tags).not.toContain('chocolate');
      expect(recipe.tags).toHaveLength(1);
    });

    it('should update updatedAt when adding/removing tags', () => {
      const recipe = createValidRecipe();
      const originalUpdatedAt = recipe.updatedAt;
      
      setTimeout(() => {
        recipe.addTag('new-tag');
        expect(recipe.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 10);
    });
  });

  describe('update method', () => {
    it('should update recipe properties', () => {
      const recipe = createValidRecipe();
      
      recipe.update({
        title: 'Updated Chocolate Cake',
        description: 'Even more delicious',
        servings: 10
      });
      
      expect(recipe.title).toBe('Updated Chocolate Cake');
      expect(recipe.description).toBe('Even more delicious');
      expect(recipe.servings).toBe(10);
    });

    it('should validate after update', () => {
      const recipe = createValidRecipe();
      
      expect(() => {
        recipe.update({ title: '' });
      }).toThrow('Recipe must have a title');
    });
  });

  describe('with nutrition info', () => {
    it('should create recipe with nutritional information', () => {
      const recipe = createValidRecipe();
      const nutrition = new NutritionalInfo(250, 10, 35, 8, 2, 20, 150);
      
      const recipeWithNutrition = new Recipe(
        recipe.id,
        recipe.title,
        recipe.description,
        recipe.ingredients,
        recipe.instructions,
        recipe.prepTime,
        recipe.cookTime,
        recipe.servings,
        recipe.tags,
        undefined,
        undefined,
        nutrition
      );
      
      expect(recipeWithNutrition.nutrition).toBeDefined();
      expect(recipeWithNutrition.nutrition?.calories).toBe(250);
      expect(recipeWithNutrition.nutrition?.protein).toBe(10);
    });
  });
});