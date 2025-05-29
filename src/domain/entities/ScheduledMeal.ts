export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';

export class ScheduledMeal {
  constructor(
    public readonly id: string,
    public recipeId: string,
    public recipeName: string,
    public scheduledDate: Date,
    public mealType: MealType,
    public servings: number = 1,
    public notes?: string,
    public isPrepared: boolean = false,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.recipeId || this.recipeId.trim().length === 0) {
      throw new Error('Scheduled meal must have a recipe ID');
    }
    
    if (!this.recipeName || this.recipeName.trim().length === 0) {
      throw new Error('Scheduled meal must have a recipe name');
    }
    
    if (this.servings <= 0) {
      throw new Error('Servings must be positive');
    }
  }

  markAsPrepared(): void {
    this.isPrepared = true;
    this.updatedAt = new Date();
  }

  markAsNotPrepared(): void {
    this.isPrepared = false;
    this.updatedAt = new Date();
  }

  updateServings(servings: number): void {
    if (servings <= 0) {
      throw new Error('Servings must be positive');
    }
    this.servings = servings;
    this.updatedAt = new Date();
  }

  updateNotes(notes?: string): void {
    this.notes = notes;
    this.updatedAt = new Date();
  }

  reschedule(newDate: Date): void {
    this.scheduledDate = newDate;
    this.updatedAt = new Date();
  }

  changeMealType(newType: MealType): void {
    this.mealType = newType;
    this.updatedAt = new Date();
  }

  isScheduledForToday(): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return this.scheduledDate >= today && this.scheduledDate < tomorrow;
  }

  isPast(): boolean {
    return this.scheduledDate < new Date();
  }

  getDayOfWeek(): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[this.scheduledDate.getDay()];
  }

  getTimeSlot(): string {
    const hour = this.scheduledDate.getHours();
    
    switch (this.mealType) {
      case 'breakfast':
        return 'Morning';
      case 'lunch':
        return 'Midday';
      case 'dinner':
        return 'Evening';
      case 'snack':
        return hour < 12 ? 'Morning Snack' : hour < 17 ? 'Afternoon Snack' : 'Evening Snack';
      case 'dessert':
        return 'After Dinner';
      default:
        return 'Other';
    }
  }
}