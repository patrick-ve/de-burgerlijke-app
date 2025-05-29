import { type MealPlan } from '../../../domain/entities/MealPlan';
import { type IMealPlanRepository } from '../../../domain/interfaces/IMealPlanRepository';
import { type IRecipeRepository } from '../../../domain/interfaces/IRecipeRepository';
import { MealPlanner, type MealPlanningPreferences } from '../../../domain/services/MealPlanner';

export interface GenerateWeeklyMealPlanDTO {
  startDate: Date;
  preferences: {
    servingsPerMeal: number;
    avoidConsecutiveDuplicates?: boolean;
    preferredBreakfastTags?: string[];
    preferredLunchTags?: string[];
    preferredDinnerTags?: string[];
    maxRecipeRepetitions?: number;
  };
  recipeFilters?: {
    tags?: string[];
    maxCookTime?: number;
    excludeRecipeIds?: string[];
  };
}

export class GenerateWeeklyMealPlan {
  constructor(
    private readonly mealPlanRepository: IMealPlanRepository,
    private readonly recipeRepository: IRecipeRepository,
    private readonly mealPlanner: MealPlanner
  ) {}

  async execute(dto: GenerateWeeklyMealPlanDTO): Promise<MealPlan> {
    // Get available recipes
    let recipes = await this.recipeRepository.findAll();
    
    // Apply filters
    if (dto.recipeFilters) {
      if (dto.recipeFilters.tags && dto.recipeFilters.tags.length > 0) {
        recipes = await this.recipeRepository.findByTags(dto.recipeFilters.tags);
      }
      
      if (dto.recipeFilters.maxCookTime) {
        recipes = recipes.filter(r => 
          r.totalTime.minutes <= dto.recipeFilters!.maxCookTime!
        );
      }
      
      if (dto.recipeFilters.excludeRecipeIds && dto.recipeFilters.excludeRecipeIds.length > 0) {
        recipes = recipes.filter(r => 
          !dto.recipeFilters!.excludeRecipeIds!.includes(r.id)
        );
      }
    }
    
    if (recipes.length === 0) {
      throw new Error('No recipes available for meal planning');
    }
    
    // Prepare preferences
    const preferences: MealPlanningPreferences = {
      servingsPerMeal: dto.preferences.servingsPerMeal,
      avoidConsecutiveDuplicates: dto.preferences.avoidConsecutiveDuplicates ?? true,
      preferredMealTypes: {
        breakfast: dto.preferences.preferredBreakfastTags || ['ontbijt', 'breakfast', 'quick'],
        lunch: dto.preferences.preferredLunchTags || ['lunch', 'salade', 'sandwich'],
        dinner: dto.preferences.preferredDinnerTags || ['dinner', 'hoofdgerecht', 'avondeten']
      },
      maxRecipeRepetitions: dto.preferences.maxRecipeRepetitions ?? 2
    };
    
    // Generate the meal plan
    const mealPlan = this.mealPlanner.createWeeklyMealPlan(
      recipes,
      dto.startDate,
      preferences
    );
    
    // Save the meal plan
    await this.mealPlanRepository.save(mealPlan);
    
    return mealPlan;
  }
}