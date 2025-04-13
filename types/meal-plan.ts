import type { Recipe } from './recipe';

export interface ScheduledMeal {
  id: string; // Unique identifier for the scheduled instance
  userId?: string;
  householdId?: string;
  recipeId: Recipe['id'];
  date: Date; // Specific date for the meal
  portions: number; // Portions for this specific meal instance
  createdAt: Date;
  updatedAt: Date;
} 