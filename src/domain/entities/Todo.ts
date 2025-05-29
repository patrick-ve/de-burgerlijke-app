import { type Priority } from '../value-objects/Priority';
import { type FileAttachment } from '../value-objects/FileAttachment';

export class Todo {
  constructor(
    public readonly id: string,
    public title: string,
    public description?: string,
    public completed: boolean = false,
    public priority: Priority = 'medium',
    public dueDate?: Date,
    public tags: string[] = [],
    public attachments: FileAttachment[] = [],
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.title || this.title.trim().length === 0) {
      throw new Error('Todo must have a title');
    }
    
    if (this.dueDate && this.dueDate < new Date()) {
      console.warn('Due date is in the past');
    }
  }

  complete(): void {
    this.completed = true;
    this.updatedAt = new Date();
  }

  uncomplete(): void {
    this.completed = false;
    this.updatedAt = new Date();
  }

  toggleCompleted(): void {
    this.completed = !this.completed;
    this.updatedAt = new Date();
  }

  updateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Todo must have a title');
    }
    this.title = title;
    this.updatedAt = new Date();
  }

  updateDescription(description?: string): void {
    this.description = description;
    this.updatedAt = new Date();
  }

  setPriority(priority: Priority): void {
    this.priority = priority;
    this.updatedAt = new Date();
  }

  setDueDate(dueDate?: Date): void {
    if (dueDate && dueDate < new Date()) {
      console.warn('Setting due date in the past');
    }
    this.dueDate = dueDate;
    this.updatedAt = new Date();
  }

  addTag(tag: string): void {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      this.updatedAt = new Date();
    }
  }

  removeTag(tag: string): void {
    this.tags = this.tags.filter(t => t !== tag);
    this.updatedAt = new Date();
  }

  addAttachment(attachment: FileAttachment): void {
    this.attachments.push(attachment);
    this.updatedAt = new Date();
  }

  removeAttachment(attachmentId: string): void {
    this.attachments = this.attachments.filter(a => a.id !== attachmentId);
    this.updatedAt = new Date();
  }

  isOverdue(): boolean {
    if (!this.dueDate || this.completed) return false;
    return this.dueDate < new Date();
  }

  isDueToday(): boolean {
    if (!this.dueDate || this.completed) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return this.dueDate >= today && this.dueDate < tomorrow;
  }

  isDueSoon(days: number = 3): boolean {
    if (!this.dueDate || this.completed) return false;
    
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + days);
    
    return this.dueDate <= deadline;
  }
}