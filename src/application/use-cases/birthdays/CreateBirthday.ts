import { type IBirthdayRepository } from '../../../domain/interfaces/IBirthdayRepository';
import { Birthday } from '../../../domain/entities/Birthday';
import { createId } from '@paralleldrive/cuid2';

export interface CreateBirthdayDTO {
  name: string;
  date: Date;
  birthYear?: number;
  notes?: string;
  reminderDays?: number;
}

export class CreateBirthday {
  constructor(
    private readonly birthdayRepository: IBirthdayRepository
  ) {}

  async execute(dto: CreateBirthdayDTO): Promise<Birthday> {
    const birthday = new Birthday(
      createId(),
      dto.name,
      dto.date,
      dto.birthYear,
      dto.notes,
      dto.reminderDays ?? 7
    );

    birthday.validate();
    await this.birthdayRepository.save(birthday);
    
    return birthday;
  }
}