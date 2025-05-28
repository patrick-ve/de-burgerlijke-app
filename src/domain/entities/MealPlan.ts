import { type ScheduledMeal } from './ScheduledMeal';

export class MealPlan {
  constructor(
    public readonly id: string,
    public name: string,
    public startDate: Date,
    public endDate: Date,
    public meals: ScheduledMeal[] = [],
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Meal plan must have a name');
    }
    
    if (this.startDate > this.endDate) {
      throw new Error('Start date must be before end date');
    }
  }

  addMeal(meal: ScheduledMeal): void {
    // Check if meal date is within plan period
    if (meal.scheduledDate < this.startDate || meal.scheduledDate > this.endDate) {
      throw new Error('Meal date must be within plan period');
    }
    
    // Check if there's already a meal scheduled at the same time
    const conflictingMeal = this.meals.find(m => 
      m.scheduledDate.getTime() === meal.scheduledDate.getTime() &&
      m.mealType === meal.mealType
    );
    
    if (conflictingMeal) {
      throw new Error(`A ${meal.mealType} is already scheduled for this date and time`);
    }
    
    this.meals.push(meal);
    this.updatedAt = new Date();
  }

  removeMeal(mealId: string): void {
    this.meals = this.meals.filter(m => m.id !== mealId);
    this.updatedAt = new Date();
  }

  updateMeal(mealId: string, updates: Partial<ScheduledMeal>): void {
    const mealIndex = this.meals.findIndex(m => m.id === mealId);
    
    if (mealIndex === -1) {
      throw new Error('Meal not found in plan');
    }
    
    Object.assign(this.meals[mealIndex], updates);
    this.updatedAt = new Date();
  }

  getMealsForDate(date: Date): ScheduledMeal[] {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return this.meals.filter(meal => 
      meal.scheduledDate >= startOfDay && meal.scheduledDate <= endOfDay
    );
  }

  getMealsByType(mealType: string): ScheduledMeal[] {
    return this.meals.filter(meal => meal.mealType === mealType);
  }

  getTotalServings(): number {
    return this.meals.reduce((total, meal) => total + meal.servings, 0);
  }

  getUniqueRecipeIds(): string[] {
    return [...new Set(this.meals.map(meal => meal.recipeId))];
  }

  extendPlan(days: number): void {
    const newEndDate = new Date(this.endDate);
    newEndDate.setDate(newEndDate.getDate() + days);
    this.endDate = newEndDate;
    this.updatedAt = new Date();
  }

  isActive(): boolean {
    const now = new Date();
    return now >= this.startDate && now <= this.endDate;
  }

  getDaysRemaining(): number {
    const now = new Date();
    if (now > this.endDate) return 0;
    
    const diffTime = this.endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  clone(newId: string, newName: string, newStartDate: Date): MealPlan {
    const duration = this.endDate.getTime() - this.startDate.getTime();
    const newEndDate = new Date(newStartDate.getTime() + duration);
    
    const clonedPlan = new MealPlan(
      newId,
      newName,
      newStartDate,
      newEndDate
    );
    
    // Clone meals with adjusted dates
    const dayOffset = newStartDate.getTime() - this.startDate.getTime();
    
    this.meals.forEach(meal => {
      const newMealDate = new Date(meal.scheduledDate.getTime() + dayOffset);
      clonedPlan.addMeal(
        new ScheduledMeal(
          meal.id + '_clone',
          meal.recipeId,
          meal.recipeName,
          newMealDate,
          meal.mealType,
          meal.servings,
          meal.notes
        )
      );
    });
    
    return clonedPlan;
  }
}