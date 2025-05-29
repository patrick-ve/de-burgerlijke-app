import { ScheduledMeal, type MealType } from '../../../domain/entities/ScheduledMeal';
import { type IMealPlanRepository } from '../../../domain/interfaces/IMealPlanRepository';
import { type IRecipeRepository } from '../../../domain/interfaces/IRecipeRepository';
import { createId } from '@paralleldrive/cuid2';

export interface ScheduleMealDTO {
  mealPlanId: string;
  recipeId: string;
  scheduledDate: Date;
  mealType: MealType;
  servings: number;
  notes?: string;
}

export class ScheduleMeal {
  constructor(
    private readonly mealPlanRepository: IMealPlanRepository,
    private readonly recipeRepository: IRecipeRepository
  ) {}

  async execute(dto: ScheduleMealDTO): Promise<ScheduledMeal> {
    // Get the meal plan
    const mealPlan = await this.mealPlanRepository.findById(dto.mealPlanId);
    if (!mealPlan) {
      throw new Error(`Meal plan with id ${dto.mealPlanId} not found`);
    }

    // Get the recipe to get its name
    const recipe = await this.recipeRepository.findById(dto.recipeId);
    if (!recipe) {
      throw new Error(`Recipe with id ${dto.recipeId} not found`);
    }

    // Create the scheduled meal
    const scheduledMeal = new ScheduledMeal(
      createId(),
      dto.recipeId,
      recipe.title,
      dto.scheduledDate,
      dto.mealType,
      dto.servings,
      dto.notes
    );

    // Add to meal plan
    mealPlan.addMeal(scheduledMeal);
    
    // Save the updated meal plan
    await this.mealPlanRepository.update(mealPlan);

    return scheduledMeal;
  }
}