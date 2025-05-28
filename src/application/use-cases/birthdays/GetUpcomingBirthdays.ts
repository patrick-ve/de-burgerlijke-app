import { type IBirthdayRepository } from '../../../domain/interfaces/IBirthdayRepository';
import { type Birthday } from '../../../domain/entities/Birthday';

export interface GetUpcomingBirthdaysDTO {
  days: number;
  includeReminders?: boolean;
}

export class GetUpcomingBirthdays {
  constructor(
    private readonly birthdayRepository: IBirthdayRepository
  ) {}

  async execute(dto: GetUpcomingBirthdaysDTO): Promise<Birthday[]> {
    const birthdays = await this.birthdayRepository.findUpcoming(dto.days);
    
    if (dto.includeReminders) {
      return birthdays.filter(birthday => birthday.shouldShowReminder());
    }
    
    return birthdays;
  }
}