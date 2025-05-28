import { type MealPlan } from '../entities/MealPlan';

export interface IMealPlanRepository {
  findAll(): Promise<MealPlan[]>;
  findById(id: string): Promise<MealPlan | null>;
  findActive(): Promise<MealPlan[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<MealPlan[]>;
  save(mealPlan: MealPlan): Promise<void>;
  update(mealPlan: MealPlan): Promise<void>;
  delete(id: string): Promise<void>;
}