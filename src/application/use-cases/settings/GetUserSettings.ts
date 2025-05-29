import { type IUserSettingsRepository } from '../../../domain/interfaces/IUserSettingsRepository';
import { UserSettings } from '../../../domain/entities/UserSettings';
import { createId } from '@paralleldrive/cuid2';

export class GetUserSettings {
  constructor(
    private readonly userSettingsRepository: IUserSettingsRepository
  ) {}

  async execute(): Promise<UserSettings> {
    const settings = await this.userSettingsRepository.get();
    
    if (!settings) {
      // Create default settings if none exist
      const defaultSettings = new UserSettings(
        createId(),
        'overview',
        [],
        false,
        'nl',
        'system'
      );
      
      await this.userSettingsRepository.save(defaultSettings);
      return defaultSettings;
    }
    
    return settings;
  }
}