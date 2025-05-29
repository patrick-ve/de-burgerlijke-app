import { type Birthday } from '../entities/Birthday';

export interface IBirthdayRepository {
  findAll(): Promise<Birthday[]>;
  findById(id: string): Promise<Birthday | null>;
  findUpcoming(days: number): Promise<Birthday[]>;
  save(birthday: Birthday): Promise<void>;
  update(birthday: Birthday): Promise<void>;
  delete(id: string): Promise<void>;
}