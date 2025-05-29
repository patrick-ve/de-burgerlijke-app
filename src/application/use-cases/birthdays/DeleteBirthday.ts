import { type IBirthdayRepository } from '../../../domain/interfaces/IBirthdayRepository';

export class DeleteBirthday {
  constructor(
    private readonly birthdayRepository: IBirthdayRepository
  ) {}

  async execute(id: string): Promise<void> {
    const birthday = await this.birthdayRepository.findById(id);
    
    if (!birthday) {
      throw new Error(`Birthday with id ${id} not found`);
    }

    await this.birthdayRepository.delete(id);
  }
}