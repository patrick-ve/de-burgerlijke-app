export type SupermarketMode = 'overview' | 'cheapest';

export class UserSettings {
  constructor(
    public readonly id: string,
    public supermarketMode: SupermarketMode,
    public selectedSupermarkets: string[],
    public hasCompletedOnboarding: boolean,
    public language: string = 'nl',
    public theme: 'light' | 'dark' | 'system' = 'system',
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  selectSupermarket(supermarketId: string): void {
    if (!this.selectedSupermarkets.includes(supermarketId)) {
      this.selectedSupermarkets.push(supermarketId);
      this.updatedAt = new Date();
    }
  }

  deselectSupermarket(supermarketId: string): void {
    const index = this.selectedSupermarkets.indexOf(supermarketId);
    if (index > -1) {
      this.selectedSupermarkets.splice(index, 1);
      this.updatedAt = new Date();
    }
  }

  setSupermarketMode(mode: SupermarketMode): void {
    this.supermarketMode = mode;
    this.updatedAt = new Date();
  }

  completeOnboarding(): void {
    this.hasCompletedOnboarding = true;
    this.updatedAt = new Date();
  }

  resetOnboarding(): void {
    this.hasCompletedOnboarding = false;
    this.updatedAt = new Date();
  }

  setTheme(theme: 'light' | 'dark' | 'system'): void {
    this.theme = theme;
    this.updatedAt = new Date();
  }

  setLanguage(language: string): void {
    this.language = language;
    this.updatedAt = new Date();
  }

  validate(): boolean {
    if (this.supermarketMode === 'cheapest' && this.selectedSupermarkets.length === 0) {
      throw new Error('At least one supermarket must be selected when using cheapest mode');
    }

    if (!['nl', 'en'].includes(this.language)) {
      throw new Error('Language must be either nl or en');
    }

    return true;
  }
}