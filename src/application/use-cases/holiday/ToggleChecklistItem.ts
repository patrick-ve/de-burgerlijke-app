import { type IHolidayChecklistRepository } from '../../../domain/interfaces/IHolidayChecklistRepository';
import { type HolidayChecklistItem } from '../../../domain/entities/HolidayChecklistItem';

export interface ToggleChecklistItemDTO {
  checklistId: string;
  itemId: string;
}

export class ToggleChecklistItem {
  constructor(
    private readonly holidayChecklistRepository: IHolidayChecklistRepository
  ) {}

  async execute(dto: ToggleChecklistItemDTO): Promise<HolidayChecklistItem> {
    const checklist = await this.holidayChecklistRepository.findById(dto.checklistId);
    
    if (!checklist) {
      throw new Error(`Holiday checklist with id ${dto.checklistId} not found`);
    }

    const item = checklist.getItem(dto.itemId);
    if (!item) {
      throw new Error(`Item with id ${dto.itemId} not found in checklist`);
    }

    item.toggle();
    
    await this.holidayChecklistRepository.update(checklist);
    
    return item;
  }
}