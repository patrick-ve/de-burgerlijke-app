import { type ITodoRepository } from '../../../domain/interfaces/ITodoRepository';

export interface SetTodoDueDateDTO {
  todoId: string;
  dueDate?: Date;
}

export class SetTodoDueDate {
  constructor(
    private readonly todoRepository: ITodoRepository
  ) {}

  async execute(dto: SetTodoDueDateDTO): Promise<void> {
    const todo = await this.todoRepository.findById(dto.todoId);
    
    if (!todo) {
      throw new Error(`Todo with id ${dto.todoId} not found`);
    }

    todo.setDueDate(dto.dueDate);
    await this.todoRepository.update(todo);
  }
}