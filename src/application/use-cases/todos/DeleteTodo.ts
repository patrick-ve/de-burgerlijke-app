import { type ITodoRepository } from '../../../domain/interfaces/ITodoRepository';

export class DeleteTodo {
  constructor(
    private readonly todoRepository: ITodoRepository
  ) {}

  async execute(id: string): Promise<void> {
    const todo = await this.todoRepository.findById(id);
    
    if (!todo) {
      throw new Error(`Todo with id ${id} not found`);
    }

    await this.todoRepository.delete(id);
  }
}