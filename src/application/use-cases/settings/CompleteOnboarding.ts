import { type IUserSettingsRepository } from '../../../domain/interfaces/IUserSettingsRepository';
import { type UserSettings } from '../../../domain/entities/UserSettings';

export class CompleteOnboarding {
  constructor(
    private readonly userSettingsRepository: IUserSettingsRepository
  ) {}

  async execute(): Promise<UserSettings> {
    const settings = await this.userSettingsRepository.get();
    
    if (!settings) {
      throw new Error('User settings not found');
    }

    settings.completeOnboarding();
    settings.validate();
    
    await this.userSettingsRepository.update(settings);
    
    return settings;
  }
}