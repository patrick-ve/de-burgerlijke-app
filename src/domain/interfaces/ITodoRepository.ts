import { type Todo } from '../entities/Todo';
import { type Priority } from '../value-objects/Priority';

export interface ITodoRepository {
  findAll(): Promise<Todo[]>;
  findById(id: string): Promise<Todo | null>;
  findByCompleted(completed: boolean): Promise<Todo[]>;
  findByPriority(priority: Priority): Promise<Todo[]>;
  findByDueDate(startDate: Date, endDate: Date): Promise<Todo[]>;
  findByTags(tags: string[]): Promise<Todo[]>;
  save(todo: Todo): Promise<void>;
  update(todo: Todo): Promise<void>;
  delete(id: string): Promise<void>;
  search(query: string): Promise<Todo[]>;
}