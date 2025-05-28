import { type IUserSettingsRepository } from '../../../domain/interfaces/IUserSettingsRepository';
import { type UserSettings } from '../../../domain/entities/UserSettings';

export interface SelectSupermarketsDTO {
  supermarketIds: string[];
  mode?: 'add' | 'replace';
}

export class SelectSupermarkets {
  constructor(
    private readonly userSettingsRepository: IUserSettingsRepository
  ) {}

  async execute(dto: SelectSupermarketsDTO): Promise<UserSettings> {
    const settings = await this.userSettingsRepository.get();
    
    if (!settings) {
      throw new Error('User settings not found');
    }

    if (dto.mode === 'replace' || dto.mode === undefined) {
      settings.selectedSupermarkets = dto.supermarketIds;
      settings.updatedAt = new Date();
    } else if (dto.mode === 'add') {
      dto.supermarketIds.forEach(id => settings.selectSupermarket(id));
    }

    settings.validate();
    await this.userSettingsRepository.update(settings);
    
    return settings;
  }
}