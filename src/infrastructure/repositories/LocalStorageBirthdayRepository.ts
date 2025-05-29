import { type IBirthdayRepository } from '../../domain/interfaces/IBirthdayRepository';
import { Birthday } from '../../domain/entities/Birthday';

interface StoredBirthday {
  id: string;
  name: string;
  date: string;
  birthYear?: number;
  notes?: string;
  reminderDays: number;
  createdAt: string;
  updatedAt: string;
}

export class LocalStorageBirthdayRepository implements IBirthdayRepository {
  private readonly STORAGE_KEY = 'birthdays';

  async findAll(): Promise<Birthday[]> {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return [];

    try {
      const data: StoredBirthday[] = JSON.parse(stored);
      return data.map(item => new Birthday(
        item.id,
        item.name,
        new Date(item.date),
        item.birthYear,
        item.notes,
        item.reminderDays,
        new Date(item.createdAt),
        new Date(item.updatedAt)
      ));
    } catch (error) {
      console.error('Error parsing birthdays from localStorage:', error);
      return [];
    }
  }

  async findById(id: string): Promise<Birthday | null> {
    const birthdays = await this.findAll();
    return birthdays.find(b => b.id === id) || null;
  }

  async findUpcoming(days: number): Promise<Birthday[]> {
    const birthdays = await this.findAll();
    const today = new Date();
    
    return birthdays
      .filter(birthday => birthday.getDaysUntilBirthday(today) <= days)
      .sort((a, b) => a.getDaysUntilBirthday(today) - b.getDaysUntilBirthday(today));
  }

  async save(birthday: Birthday): Promise<void> {
    const birthdays = await this.findAll();
    birthdays.push(birthday);
    await this.saveAll(birthdays);
  }

  async update(birthday: Birthday): Promise<void> {
    const birthdays = await this.findAll();
    const index = birthdays.findIndex(b => b.id === birthday.id);
    
    if (index === -1) {
      throw new Error(`Birthday with id ${birthday.id} not found`);
    }
    
    birthdays[index] = birthday;
    await this.saveAll(birthdays);
  }

  async delete(id: string): Promise<void> {
    const birthdays = await this.findAll();
    const filtered = birthdays.filter(b => b.id !== id);
    
    if (filtered.length === birthdays.length) {
      throw new Error(`Birthday with id ${id} not found`);
    }
    
    await this.saveAll(filtered);
  }

  private async saveAll(birthdays: Birthday[]): Promise<void> {
    if (typeof window === 'undefined') return;
    
    const data: StoredBirthday[] = birthdays.map(birthday => ({
      id: birthday.id,
      name: birthday.name,
      date: birthday.date.toISOString(),
      birthYear: birthday.birthYear,
      notes: birthday.notes,
      reminderDays: birthday.reminderDays,
      createdAt: birthday.createdAt.toISOString(),
      updatedAt: birthday.updatedAt.toISOString()
    }));
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }
}