import { type IBirthdayRepository } from '../../../domain/interfaces/IBirthdayRepository';
import { type Birthday } from '../../../domain/entities/Birthday';

export interface UpdateBirthdayDTO {
  id: string;
  name?: string;
  date?: Date;
  birthYear?: number | null;
  notes?: string | null;
  reminderDays?: number;
}

export class UpdateBirthday {
  constructor(
    private readonly birthdayRepository: IBirthdayRepository
  ) {}

  async execute(dto: UpdateBirthdayDTO): Promise<Birthday> {
    const birthday = await this.birthdayRepository.findById(dto.id);
    
    if (!birthday) {
      throw new Error(`Birthday with id ${dto.id} not found`);
    }

    if (dto.name !== undefined) {
      birthday.updateName(dto.name);
    }

    if (dto.date !== undefined) {
      birthday.updateDate(dto.date);
    }

    if (dto.birthYear !== undefined) {
      birthday.setBirthYear(dto.birthYear === null ? undefined : dto.birthYear);
    }

    if (dto.notes !== undefined) {
      birthday.notes = dto.notes === null ? undefined : dto.notes;
      birthday.updatedAt = new Date();
    }

    if (dto.reminderDays !== undefined) {
      birthday.setReminderDays(dto.reminderDays);
    }

    birthday.validate();
    await this.birthdayRepository.update(birthday);
    
    return birthday;
  }
}