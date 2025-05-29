import { type IRecipeRepository } from '../../../domain/interfaces/IRecipeRepository';
import { type IMealPlanRepository } from '../../../domain/interfaces/IMealPlanRepository';
import { MealPlanner, type MealSuggestion, type MealPlanningPreferences } from '../../../domain/services/MealPlanner';
import { type MealType } from '../../../domain/entities/ScheduledMeal';

export interface GetMealSuggestionsDTO {
  mealPlanId: string;
  mealType: MealType;
  date: Date;
  preferences?: {
    servingsPerMeal?: number;
    avoidConsecutiveDuplicates?: boolean;
    maxRecipeRepetitions?: number;
  };
  limit?: number;
}

export class GetMealSuggestions {
  constructor(
    private readonly mealPlanRepository: IMealPlanRepository,
    private readonly recipeRepository: IRecipeRepository,
    private readonly mealPlanner: MealPlanner
  ) {}

  async execute(dto: GetMealSuggestionsDTO): Promise<MealSuggestion[]> {
    // Get the meal plan
    const mealPlan = await this.mealPlanRepository.findById(dto.mealPlanId);
    if (!mealPlan) {
      throw new Error(`Meal plan with id ${dto.mealPlanId} not found`);
    }

    // Get all available recipes
    const recipes = await this.recipeRepository.findAll();
    
    // Default preferences
    const preferences: MealPlanningPreferences = {
      servingsPerMeal: dto.preferences?.servingsPerMeal ?? 4,
      avoidConsecutiveDuplicates: dto.preferences?.avoidConsecutiveDuplicates ?? true,
      preferredMealTypes: {
        breakfast: ['ontbijt', 'breakfast', 'quick'],
        lunch: ['lunch', 'salade', 'sandwich'],
        dinner: ['dinner', 'hoofdgerecht', 'avondeten']
      },
      maxRecipeRepetitions: dto.preferences?.maxRecipeRepetitions ?? 2
    };

    // Get existing meals to consider for variety
    const suggestions = this.mealPlanner.generateMealSuggestions(
      recipes,
      dto.mealType,
      mealPlan.meals,
      preferences
    );

    // Limit results if requested
    if (dto.limit && dto.limit > 0) {
      return suggestions.slice(0, dto.limit);
    }

    return suggestions;
  }
}