export class NutritionalInfo {
  constructor(
    public readonly calories: number,
    public readonly protein: number, // in grams
    public readonly carbs: number, // in grams
    public readonly fat: number, // in grams
    public readonly fiber?: number, // in grams
    public readonly sugar?: number, // in grams
    public readonly sodium?: number // in mg
  ) {
    if (calories < 0 || protein < 0 || carbs < 0 || fat < 0) {
      throw new Error('Nutritional values cannot be negative');
    }
  }

  get totalMacros(): number {
    return this.protein + this.carbs + this.fat;
  }

  adjustForServings(originalServings: number, newServings: number): NutritionalInfo {
    const ratio = newServings / originalServings;
    
    return new NutritionalInfo(
      Math.round(this.calories * ratio),
      Math.round(this.protein * ratio * 10) / 10,
      Math.round(this.carbs * ratio * 10) / 10,
      Math.round(this.fat * ratio * 10) / 10,
      this.fiber ? Math.round(this.fiber * ratio * 10) / 10 : undefined,
      this.sugar ? Math.round(this.sugar * ratio * 10) / 10 : undefined,
      this.sodium ? Math.round(this.sodium * ratio) : undefined
    );
  }
}