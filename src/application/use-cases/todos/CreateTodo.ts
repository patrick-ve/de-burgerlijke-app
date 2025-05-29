import { Todo } from '../../../domain/entities/Todo';
import { type ITodoRepository } from '../../../domain/interfaces/ITodoRepository';
import { type Priority } from '../../../domain/value-objects/Priority';
import { createId } from '@paralleldrive/cuid2';

export interface CreateTodoDTO {
  title: string;
  description?: string;
  priority?: Priority;
  dueDate?: Date;
  tags?: string[];
}

export class CreateTodo {
  constructor(
    private readonly todoRepository: ITodoRepository
  ) {}

  async execute(dto: CreateTodoDTO): Promise<Todo> {
    const todo = new Todo(
      createId(),
      dto.title,
      dto.description,
      false, // New todos are not completed
      dto.priority || 'medium',
      dto.dueDate,
      dto.tags || []
    );

    await this.todoRepository.save(todo);
    return todo;
  }
}