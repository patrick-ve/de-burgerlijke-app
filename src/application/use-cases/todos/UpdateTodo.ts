import { type ITodoRepository } from '../../../domain/interfaces/ITodoRepository';
import { type Todo } from '../../../domain/entities/Todo';
import { type Priority } from '../../../domain/value-objects/Priority';

export interface UpdateTodoDTO {
  id: string;
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: Priority;
  dueDate?: Date | null;
  tags?: string[];
}

export class UpdateTodo {
  constructor(
    private readonly todoRepository: ITodoRepository
  ) {}

  async execute(dto: UpdateTodoDTO): Promise<Todo> {
    const todo = await this.todoRepository.findById(dto.id);
    
    if (!todo) {
      throw new Error(`Todo with id ${dto.id} not found`);
    }

    if (dto.title !== undefined) {
      todo.updateTitle(dto.title);
    }
    
    if (dto.description !== undefined) {
      todo.updateDescription(dto.description);
    }
    
    if (dto.completed !== undefined) {
      if (dto.completed) {
        todo.complete();
      } else {
        todo.uncomplete();
      }
    }
    
    if (dto.priority !== undefined) {
      todo.setPriority(dto.priority);
    }
    
    if (dto.dueDate !== undefined) {
      todo.setDueDate(dto.dueDate === null ? undefined : dto.dueDate);
    }
    
    if (dto.tags !== undefined) {
      // Replace all tags
      todo.tags = dto.tags;
      todo.updatedAt = new Date();
    }

    await this.todoRepository.update(todo);
    return todo;
  }
}