import { type HolidayChecklist } from '../entities/HolidayChecklistItem';

export interface IHolidayChecklistRepository {
  findAll(): Promise<HolidayChecklist[]>;
  findById(id: string): Promise<HolidayChecklist | null>;
  save(checklist: HolidayChecklist): Promise<void>;
  update(checklist: HolidayChecklist): Promise<void>;
  delete(id: string): Promise<void>;
}