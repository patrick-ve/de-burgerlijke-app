import { Todo } from '../../domain/entities/Todo';
import { type ITodoRepository } from '../../domain/interfaces/ITodoRepository';
import { type Priority } from '../../domain/value-objects/Priority';
import { FileAttachment } from '../../domain/value-objects/FileAttachment';

interface StoredTodo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: Priority;
  dueDate?: string;
  tags: string[];
  attachments: Array<{
    id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    url: string;
    uploadedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export class LocalStorageTodoRepository implements ITodoRepository {
  private readonly STORAGE_KEY = 'todos';

  private getStoredTodos(): StoredTodo[] {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private saveStoredTodos(todos: StoredTodo[]): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(todos));
  }

  private toDomain(stored: StoredTodo): Todo {
    const attachments = stored.attachments.map(att => 
      new FileAttachment(
        att.id,
        att.fileName,
        att.fileSize,
        att.mimeType,
        att.url,
        new Date(att.uploadedAt)
      )
    );

    return new Todo(
      stored.id,
      stored.title,
      stored.description,
      stored.completed,
      stored.priority,
      stored.dueDate ? new Date(stored.dueDate) : undefined,
      stored.tags,
      attachments,
      new Date(stored.createdAt),
      new Date(stored.updatedAt)
    );
  }

  private toStored(todo: Todo): StoredTodo {
    return {
      id: todo.id,
      title: todo.title,
      description: todo.description,
      completed: todo.completed,
      priority: todo.priority,
      dueDate: todo.dueDate?.toISOString(),
      tags: todo.tags,
      attachments: todo.attachments.map(att => ({
        id: att.id,
        fileName: att.fileName,
        fileSize: att.fileSize,
        mimeType: att.mimeType,
        url: att.url,
        uploadedAt: att.uploadedAt.toISOString()
      })),
      createdAt: todo.createdAt.toISOString(),
      updatedAt: todo.updatedAt.toISOString()
    };
  }

  async findAll(): Promise<Todo[]> {
    const stored = this.getStoredTodos();
    return stored.map(s => this.toDomain(s));
  }

  async findById(id: string): Promise<Todo | null> {
    const stored = this.getStoredTodos();
    const found = stored.find(t => t.id === id);
    return found ? this.toDomain(found) : null;
  }

  async findByCompleted(completed: boolean): Promise<Todo[]> {
    const stored = this.getStoredTodos();
    const filtered = stored.filter(t => t.completed === completed);
    return filtered.map(s => this.toDomain(s));
  }

  async findByPriority(priority: Priority): Promise<Todo[]> {
    const stored = this.getStoredTodos();
    const filtered = stored.filter(t => t.priority === priority);
    return filtered.map(s => this.toDomain(s));
  }

  async findByDueDate(startDate: Date, endDate: Date): Promise<Todo[]> {
    const stored = this.getStoredTodos();
    const filtered = stored.filter(t => {
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      return dueDate >= startDate && dueDate <= endDate;
    });
    return filtered.map(s => this.toDomain(s));
  }

  async findByTags(tags: string[]): Promise<Todo[]> {
    const stored = this.getStoredTodos();
    const filtered = stored.filter(t => 
      tags.some(tag => t.tags.includes(tag))
    );
    return filtered.map(s => this.toDomain(s));
  }

  async save(todo: Todo): Promise<void> {
    const stored = this.getStoredTodos();
    stored.push(this.toStored(todo));
    this.saveStoredTodos(stored);
  }

  async update(todo: Todo): Promise<void> {
    const stored = this.getStoredTodos();
    const index = stored.findIndex(t => t.id === todo.id);
    
    if (index === -1) {
      throw new Error(`Todo with id ${todo.id} not found`);
    }
    
    stored[index] = this.toStored(todo);
    this.saveStoredTodos(stored);
  }

  async delete(id: string): Promise<void> {
    const stored = this.getStoredTodos();
    const filtered = stored.filter(t => t.id !== id);
    this.saveStoredTodos(filtered);
  }

  async search(query: string): Promise<Todo[]> {
    const stored = this.getStoredTodos();
    const lowercaseQuery = query.toLowerCase();
    
    const filtered = stored.filter(t => 
      t.title.toLowerCase().includes(lowercaseQuery) ||
      t.description?.toLowerCase().includes(lowercaseQuery) ||
      t.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
    
    return filtered.map(s => this.toDomain(s));
  }
}