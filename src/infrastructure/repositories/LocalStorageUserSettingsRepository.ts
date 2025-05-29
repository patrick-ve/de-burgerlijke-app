import { type IUserSettingsRepository } from '../../domain/interfaces/IUserSettingsRepository';
import { UserSettings, type SupermarketMode } from '../../domain/entities/UserSettings';

interface StoredUserSettings {
  id: string;
  supermarketMode: SupermarketMode;
  selectedSupermarkets: string[];
  hasCompletedOnboarding: boolean;
  language: string;
  theme: 'light' | 'dark' | 'system';
  createdAt: string;
  updatedAt: string;
}

export class LocalStorageUserSettingsRepository implements IUserSettingsRepository {
  private readonly STORAGE_KEY = 'userSettings';

  async get(): Promise<UserSettings | null> {
    if (typeof window === 'undefined') return null;
    
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return null;

    try {
      const data: StoredUserSettings = JSON.parse(stored);
      return new UserSettings(
        data.id,
        data.supermarketMode,
        data.selectedSupermarkets,
        data.hasCompletedOnboarding,
        data.language,
        data.theme,
        new Date(data.createdAt),
        new Date(data.updatedAt)
      );
    } catch (error) {
      console.error('Error parsing user settings from localStorage:', error);
      return null;
    }
  }

  async save(settings: UserSettings): Promise<void> {
    if (typeof window === 'undefined') return;
    
    const data: StoredUserSettings = {
      id: settings.id,
      supermarketMode: settings.supermarketMode,
      selectedSupermarkets: settings.selectedSupermarkets,
      hasCompletedOnboarding: settings.hasCompletedOnboarding,
      language: settings.language,
      theme: settings.theme,
      createdAt: settings.createdAt.toISOString(),
      updatedAt: settings.updatedAt.toISOString()
    };
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  async update(settings: UserSettings): Promise<void> {
    await this.save(settings);
  }
}