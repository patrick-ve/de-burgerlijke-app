import { type IHolidayChecklistRepository } from '../../../domain/interfaces/IHolidayChecklistRepository';
import { HolidayChecklist } from '../../../domain/entities/HolidayChecklistItem';
import { createId } from '@paralleldrive/cuid2';

export interface CreateHolidayChecklistDTO {
  name: string;
  tripDate?: Date;
  destination?: string;
}

export class CreateHolidayChecklist {
  constructor(
    private readonly holidayChecklistRepository: IHolidayChecklistRepository
  ) {}

  async execute(dto: CreateHolidayChecklistDTO): Promise<HolidayChecklist> {
    const checklist = new HolidayChecklist(
      createId(),
      dto.name,
      [],
      dto.tripDate,
      dto.destination
    );

    checklist.validate();
    await this.holidayChecklistRepository.save(checklist);
    
    return checklist;
  }
}