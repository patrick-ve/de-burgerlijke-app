import { type IUserSettingsRepository } from '../../../domain/interfaces/IUserSettingsRepository';
import { type UserSettings, type SupermarketMode } from '../../../domain/entities/UserSettings';

export interface UpdateUserSettingsDTO {
  supermarketMode?: SupermarketMode;
  selectedSupermarkets?: string[];
  language?: string;
  theme?: 'light' | 'dark' | 'system';
}

export class UpdateUserSettings {
  constructor(
    private readonly userSettingsRepository: IUserSettingsRepository
  ) {}

  async execute(dto: UpdateUserSettingsDTO): Promise<UserSettings> {
    const settings = await this.userSettingsRepository.get();
    
    if (!settings) {
      throw new Error('User settings not found');
    }

    if (dto.supermarketMode !== undefined) {
      settings.setSupermarketMode(dto.supermarketMode);
    }

    if (dto.selectedSupermarkets !== undefined) {
      settings.selectedSupermarkets = dto.selectedSupermarkets;
      settings.updatedAt = new Date();
    }

    if (dto.language !== undefined) {
      settings.setLanguage(dto.language);
    }

    if (dto.theme !== undefined) {
      settings.setTheme(dto.theme);
    }

    settings.validate();
    await this.userSettingsRepository.update(settings);
    
    return settings;
  }
}