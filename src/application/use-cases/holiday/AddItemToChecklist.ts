import { type IHolidayChecklistRepository } from '../../../domain/interfaces/IHolidayChecklistRepository';
import { HolidayChecklistItem, type HolidayItemCategory } from '../../../domain/entities/HolidayChecklistItem';
import { createId } from '@paralleldrive/cuid2';

export interface AddItemToChecklistDTO {
  checklistId: string;
  name: string;
  category: HolidayItemCategory;
  quantity?: number;
  notes?: string;
}

export class AddItemToChecklist {
  constructor(
    private readonly holidayChecklistRepository: IHolidayChecklistRepository
  ) {}

  async execute(dto: AddItemToChecklistDTO): Promise<HolidayChecklistItem> {
    const checklist = await this.holidayChecklistRepository.findById(dto.checklistId);
    
    if (!checklist) {
      throw new Error(`Holiday checklist with id ${dto.checklistId} not found`);
    }

    const item = new HolidayChecklistItem(
      createId(),
      dto.name,
      dto.category,
      false,
      dto.quantity ?? 1,
      dto.notes
    );

    item.validate();
    checklist.addItem(item);
    
    await this.holidayChecklistRepository.update(checklist);
    
    return item;
  }
}