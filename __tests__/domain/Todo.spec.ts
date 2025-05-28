import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Todo } from '../../src/domain/entities/Todo';
import { FileAttachment } from '../../src/domain/value-objects/FileAttachment';

describe('Todo Domain Entity', () => {
  // Mock console.warn to avoid test output pollution
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createValidTodo = () => {
    return new Todo(
      'todo-123',
      'Complete project documentation',
      'Write comprehensive documentation for the new feature',
      false,
      'high',
      new Date('2024-12-31'),
      ['documentation', 'important']
    );
  };

  describe('constructor', () => {
    it('should create a valid todo', () => {
      const todo = createValidTodo();
      
      expect(todo.id).toBe('todo-123');
      expect(todo.title).toBe('Complete project documentation');
      expect(todo.description).toBe('Write comprehensive documentation for the new feature');
      expect(todo.completed).toBe(false);
      expect(todo.priority).toBe('high');
      expect(todo.dueDate).toEqual(new Date('2024-12-31'));
      expect(todo.tags).toContain('documentation');
      expect(todo.tags).toContain('important');
      expect(todo.attachments).toHaveLength(0);
    });

    it('should throw error for empty title', () => {
      expect(() => {
        new Todo('todo-123', '', undefined, false, 'medium');
      }).toThrow('Todo must have a title');
    });

    it('should warn for due date in the past', () => {
      const pastDate = new Date('2020-01-01');
      new Todo('todo-123', 'Past todo', undefined, false, 'medium', pastDate);
      
      expect(console.warn).toHaveBeenCalledWith('Due date is in the past');
    });

    it('should use default values', () => {
      const todo = new Todo('todo-123', 'Simple todo');
      
      expect(todo.description).toBeUndefined();
      expect(todo.completed).toBe(false);
      expect(todo.priority).toBe('medium');
      expect(todo.dueDate).toBeUndefined();
      expect(todo.tags).toHaveLength(0);
      expect(todo.attachments).toHaveLength(0);
    });
  });

  describe('completion management', () => {
    it('should complete todo', () => {
      const todo = createValidTodo();
      expect(todo.completed).toBe(false);
      
      todo.complete();
      expect(todo.completed).toBe(true);
    });

    it('should uncomplete todo', () => {
      const todo = createValidTodo();
      todo.complete();
      expect(todo.completed).toBe(true);
      
      todo.uncomplete();
      expect(todo.completed).toBe(false);
    });

    it('should toggle completion', () => {
      const todo = createValidTodo();
      expect(todo.completed).toBe(false);
      
      todo.toggleCompleted();
      expect(todo.completed).toBe(true);
      
      todo.toggleCompleted();
      expect(todo.completed).toBe(false);
    });
  });

  describe('update methods', () => {
    it('should update title', () => {
      const todo = createValidTodo();
      const originalUpdatedAt = todo.updatedAt;
      
      setTimeout(() => {
        todo.updateTitle('Updated documentation task');
        expect(todo.title).toBe('Updated documentation task');
        expect(todo.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 10);
    });

    it('should throw error for empty title update', () => {
      const todo = createValidTodo();
      expect(() => todo.updateTitle('')).toThrow('Todo must have a title');
    });

    it('should update description', () => {
      const todo = createValidTodo();
      todo.updateDescription('New description');
      expect(todo.description).toBe('New description');
      
      todo.updateDescription(undefined);
      expect(todo.description).toBeUndefined();
    });

    it('should set priority', () => {
      const todo = createValidTodo();
      todo.setPriority('low');
      expect(todo.priority).toBe('low');
    });

    it('should set due date', () => {
      const todo = createValidTodo();
      const newDate = new Date('2025-06-30');
      
      todo.setDueDate(newDate);
      expect(todo.dueDate).toEqual(newDate);
      
      todo.setDueDate(undefined);
      expect(todo.dueDate).toBeUndefined();
    });

    it('should warn when setting due date in the past', () => {
      const todo = createValidTodo();
      const pastDate = new Date('2020-01-01');
      
      todo.setDueDate(pastDate);
      expect(console.warn).toHaveBeenCalledWith('Setting due date in the past');
    });
  });

  describe('tag management', () => {
    it('should add tags', () => {
      const todo = createValidTodo();
      todo.addTag('urgent');
      
      expect(todo.tags).toContain('urgent');
      expect(todo.tags).toHaveLength(3);
    });

    it('should not add duplicate tags', () => {
      const todo = createValidTodo();
      todo.addTag('documentation'); // Already exists
      
      expect(todo.tags).toHaveLength(2); // Should remain the same
    });

    it('should remove tags', () => {
      const todo = createValidTodo();
      todo.removeTag('important');
      
      expect(todo.tags).not.toContain('important');
      expect(todo.tags).toHaveLength(1);
    });
  });

  describe('attachment management', () => {
    it('should add attachments', () => {
      const todo = createValidTodo();
      const attachment = new FileAttachment(
        'file-123',
        'document.pdf',
        'application/pdf',
        1024000,
        'https://example.com/document.pdf'
      );
      
      todo.addAttachment(attachment);
      
      expect(todo.attachments).toHaveLength(1);
      expect(todo.attachments[0].fileName).toBe('document.pdf');
    });

    it('should remove attachments', () => {
      const todo = createValidTodo();
      const attachment = new FileAttachment(
        'file-123',
        'document.pdf',
        'application/pdf',
        1024000,
        'https://example.com/document.pdf'
      );
      
      todo.addAttachment(attachment);
      expect(todo.attachments).toHaveLength(1);
      
      todo.removeAttachment('file-123');
      expect(todo.attachments).toHaveLength(0);
    });
  });

  describe('due date checks', () => {
    it('should identify overdue todos', () => {
      const todo = createValidTodo();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      todo.setDueDate(yesterday);
      expect(todo.isOverdue()).toBe(true);
      
      // Completed todos are not overdue
      todo.complete();
      expect(todo.isOverdue()).toBe(false);
    });

    it('should identify todos due today', () => {
      const todo = createValidTodo();
      const today = new Date();
      today.setHours(12, 0, 0, 0); // Set to noon today
      
      todo.setDueDate(today);
      expect(todo.isDueToday()).toBe(true);
      
      // Completed todos are not due today
      todo.complete();
      expect(todo.isDueToday()).toBe(false);
    });

    it('should identify todos due soon', () => {
      const todo = createValidTodo();
      
      // Due in 2 days
      const inTwoDays = new Date();
      inTwoDays.setDate(inTwoDays.getDate() + 2);
      todo.setDueDate(inTwoDays);
      expect(todo.isDueSoon()).toBe(true);
      expect(todo.isDueSoon(1)).toBe(false); // Not within 1 day
      
      // Due in 5 days
      const inFiveDays = new Date();
      inFiveDays.setDate(inFiveDays.getDate() + 5);
      todo.setDueDate(inFiveDays);
      expect(todo.isDueSoon(3)).toBe(false); // Not within 3 days
      expect(todo.isDueSoon(7)).toBe(true); // Within 7 days
    });

    it('should handle todos without due dates', () => {
      const todo = new Todo('todo-123', 'No due date');
      
      expect(todo.isOverdue()).toBe(false);
      expect(todo.isDueToday()).toBe(false);
      expect(todo.isDueSoon()).toBe(false);
    });
  });
});