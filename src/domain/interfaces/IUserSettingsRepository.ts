import { type UserSettings } from '../entities/UserSettings';

export interface IUserSettingsRepository {
  get(): Promise<UserSettings | null>;
  save(settings: UserSettings): Promise<void>;
  update(settings: UserSettings): Promise<void>;
}