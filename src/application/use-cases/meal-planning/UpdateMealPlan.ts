import { type IMealPlanRepository } from '../../../domain/interfaces/IMealPlanRepository';
import { type MealPlan } from '../../../domain/entities/MealPlan';

export interface UpdateMealPlanDTO {
  id: string;
  name?: string;
  startDate?: Date;
  endDate?: Date;
}

export class UpdateMealPlan {
  constructor(
    private readonly mealPlanRepository: IMealPlanRepository
  ) {}

  async execute(dto: UpdateMealPlanDTO): Promise<MealPlan> {
    const mealPlan = await this.mealPlanRepository.findById(dto.id);
    
    if (!mealPlan) {
      throw new Error(`Meal plan with id ${dto.id} not found`);
    }

    if (dto.name !== undefined) {
      mealPlan.name = dto.name;
    }
    
    if (dto.startDate !== undefined) {
      mealPlan.startDate = dto.startDate;
    }
    
    if (dto.endDate !== undefined) {
      mealPlan.endDate = dto.endDate;
    }
    
    mealPlan.updatedAt = new Date();

    await this.mealPlanRepository.update(mealPlan);
    return mealPlan;
  }
}