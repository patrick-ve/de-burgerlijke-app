import { type IHolidayChecklistRepository } from '../../../domain/interfaces/IHolidayChecklistRepository';
import { type HolidayChecklist } from '../../../domain/entities/HolidayChecklistItem';
import { createId } from '@paralleldrive/cuid2';

export class CloneHolidayChecklist {
  constructor(
    private readonly holidayChecklistRepository: IHolidayChecklistRepository
  ) {}

  async execute(checklistId: string): Promise<HolidayChecklist> {
    const original = await this.holidayChecklistRepository.findById(checklistId);
    
    if (!original) {
      throw new Error(`Holiday checklist with id ${checklistId} not found`);
    }

    const cloned = original.clone();
    cloned.id = createId(); // Ensure new unique ID
    
    await this.holidayChecklistRepository.save(cloned);
    
    return cloned;
  }
}