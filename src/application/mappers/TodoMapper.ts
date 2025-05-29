import { Todo as DomainTodo } from '../../domain/entities/Todo';
import { Priority } from '../../domain/value-objects/Priority';
import { FileAttachment } from '../../domain/value-objects/FileAttachment';

export interface UITodo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority?: Priority;
  dueDate?: Date;
  tags?: string[];
  attachments?: FileAttachment[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class TodoMapper {
  static toDomain(uiTodo: UITodo): DomainTodo {
    return new DomainTodo(
      uiTodo.id,
      uiTodo.title,
      uiTodo.description,
      uiTodo.completed || false,
      uiTodo.priority || 'medium',
      uiTodo.dueDate,
      uiTodo.tags || [],
      uiTodo.attachments || [],
      uiTodo.createdAt || new Date(),
      uiTodo.updatedAt || new Date()
    );
  }

  static toUI(domainTodo: DomainTodo): UITodo {
    return {
      id: domainTodo.id,
      title: domainTodo.title,
      description: domainTodo.description,
      completed: domainTodo.completed,
      priority: domainTodo.priority,
      dueDate: domainTodo.dueDate,
      tags: domainTodo.tags,
      attachments: domainTodo.attachments,
      createdAt: domainTodo.createdAt,
      updatedAt: domainTodo.updatedAt
    };
  }
}