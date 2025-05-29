import { MealPlan } from '../../../domain/entities/MealPlan';
import { type IMealPlanRepository } from '../../../domain/interfaces/IMealPlanRepository';
import { createId } from '@paralleldrive/cuid2';

export interface CreateMealPlanDTO {
  name: string;
  startDate: Date;
  endDate: Date;
}

export class CreateMealPlan {
  constructor(
    private readonly mealPlanRepository: IMealPlanRepository
  ) {}

  async execute(dto: CreateMealPlanDTO): Promise<MealPlan> {
    const mealPlan = new MealPlan(
      createId(),
      dto.name,
      dto.startDate,
      dto.endDate
    );

    await this.mealPlanRepository.save(mealPlan);
    return mealPlan;
  }
}