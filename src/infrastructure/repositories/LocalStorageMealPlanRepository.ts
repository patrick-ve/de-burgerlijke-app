import { MealPlan } from '../../domain/entities/MealPlan';
import { ScheduledMeal, type MealType } from '../../domain/entities/ScheduledMeal';
import { type IMealPlanRepository } from '../../domain/interfaces/IMealPlanRepository';

interface StoredScheduledMeal {
  id: string;
  recipeId: string;
  recipeName: string;
  scheduledDate: string;
  mealType: MealType;
  servings: number;
  notes?: string;
  isPrepared: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StoredMealPlan {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  meals: StoredScheduledMeal[];
  createdAt: string;
  updatedAt: string;
}

export class LocalStorageMealPlanRepository implements IMealPlanRepository {
  private readonly STORAGE_KEY = 'mealPlans';

  private getStoredMealPlans(): StoredMealPlan[] {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private saveStoredMealPlans(mealPlans: StoredMealPlan[]): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(mealPlans));
  }

  private toDomain(stored: StoredMealPlan): MealPlan {
    const meals = stored.meals.map(m => 
      new ScheduledMeal(
        m.id,
        m.recipeId,
        m.recipeName,
        new Date(m.scheduledDate),
        m.mealType,
        m.servings,
        m.notes,
        m.isPrepared,
        new Date(m.createdAt),
        new Date(m.updatedAt)
      )
    );

    const mealPlan = new MealPlan(
      stored.id,
      stored.name,
      new Date(stored.startDate),
      new Date(stored.endDate),
      [],
      new Date(stored.createdAt),
      new Date(stored.updatedAt)
    );

    // Add meals directly to bypass validation
    mealPlan.meals = meals;
    
    return mealPlan;
  }

  private toStored(mealPlan: MealPlan): StoredMealPlan {
    return {
      id: mealPlan.id,
      name: mealPlan.name,
      startDate: mealPlan.startDate.toISOString(),
      endDate: mealPlan.endDate.toISOString(),
      meals: mealPlan.meals.map(m => ({
        id: m.id,
        recipeId: m.recipeId,
        recipeName: m.recipeName,
        scheduledDate: m.scheduledDate.toISOString(),
        mealType: m.mealType,
        servings: m.servings,
        notes: m.notes,
        isPrepared: m.isPrepared,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString()
      })),
      createdAt: mealPlan.createdAt.toISOString(),
      updatedAt: mealPlan.updatedAt.toISOString()
    };
  }

  async findAll(): Promise<MealPlan[]> {
    const stored = this.getStoredMealPlans();
    return stored.map(s => this.toDomain(s));
  }

  async findById(id: string): Promise<MealPlan | null> {
    const stored = this.getStoredMealPlans();
    const found = stored.find(mp => mp.id === id);
    return found ? this.toDomain(found) : null;
  }

  async findActive(): Promise<MealPlan[]> {
    const stored = this.getStoredMealPlans();
    const now = new Date();
    
    const active = stored.filter(mp => {
      const startDate = new Date(mp.startDate);
      const endDate = new Date(mp.endDate);
      return now >= startDate && now <= endDate;
    });
    
    return active.map(s => this.toDomain(s));
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<MealPlan[]> {
    const stored = this.getStoredMealPlans();
    
    const inRange = stored.filter(mp => {
      const planStart = new Date(mp.startDate);
      const planEnd = new Date(mp.endDate);
      
      // Check if plan overlaps with date range
      return !(planEnd < startDate || planStart > endDate);
    });
    
    return inRange.map(s => this.toDomain(s));
  }

  async save(mealPlan: MealPlan): Promise<void> {
    const stored = this.getStoredMealPlans();
    stored.push(this.toStored(mealPlan));
    this.saveStoredMealPlans(stored);
  }

  async update(mealPlan: MealPlan): Promise<void> {
    const stored = this.getStoredMealPlans();
    const index = stored.findIndex(mp => mp.id === mealPlan.id);
    
    if (index === -1) {
      throw new Error(`Meal plan with id ${mealPlan.id} not found`);
    }
    
    stored[index] = this.toStored(mealPlan);
    this.saveStoredMealPlans(stored);
  }

  async delete(id: string): Promise<void> {
    const stored = this.getStoredMealPlans();
    const filtered = stored.filter(mp => mp.id !== id);
    this.saveStoredMealPlans(filtered);
  }
}