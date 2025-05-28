import {
  describe,
  it,
  expect,
  afterEach,
  beforeEach,
  vi,
} from 'vitest';
import {
  CreateTodo,
  type CreateTodoDTO,
} from '../../src/application/use-cases/todos/CreateTodo';
import { type ITodoRepository } from '../../src/domain/interfaces/ITodoRepository';
import { Todo } from '../../src/domain/entities/Todo';

// Mock the cuid2 module
vi.mock('@paralleldrive/cuid2', () => ({
  createId: () => 'test-todo-id',
}));

describe('CreateTodo Use Case', () => {
  let mockTodoRepository: ITodoRepository;
  let createTodo: CreateTodo;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock console.warn to avoid test output pollution
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Create mock repository
    mockTodoRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findByTag: vi.fn(),
      findByDueDate: vi.fn(),
      findOverdue: vi.fn(),
    };

    createTodo = new CreateTodo(mockTodoRepository);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('execute', () => {
    it('should create a simple todo successfully', async () => {
      const dto: CreateTodoDTO = {
        title: 'Buy groceries',
      };

      const todo = await createTodo.execute(dto);

      expect(todo).toBeDefined();
      expect(todo.id).toBe('test-todo-id');
      expect(todo.title).toBe('Buy groceries');
      expect(todo.description).toBeUndefined();
      expect(todo.completed).toBe(false);
      expect(todo.priority).toBe('medium');
      expect(todo.dueDate).toBeUndefined();
      expect(todo.tags).toHaveLength(0);
    });

    it('should create todo with all fields', async () => {
      const dueDate = new Date('2024-12-31');
      const dto: CreateTodoDTO = {
        title: 'Complete project',
        description: 'Finish the main feature implementation',
        priority: 'high',
        dueDate,
        tags: ['work', 'urgent', 'frontend'],
      };

      const todo = await createTodo.execute(dto);

      expect(todo.title).toBe('Complete project');
      expect(todo.description).toBe(
        'Finish the main feature implementation'
      );
      expect(todo.priority).toBe('high');
      expect(todo.dueDate).toEqual(dueDate);
      expect(todo.tags).toEqual(['work', 'urgent', 'frontend']);
    });

    it('should save todo to repository', async () => {
      const dto: CreateTodoDTO = {
        title: 'Test todo',
      };

      await createTodo.execute(dto);

      expect(mockTodoRepository.save).toHaveBeenCalledTimes(1);
      expect(mockTodoRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-todo-id',
          title: 'Test todo',
          completed: false,
        })
      );
    });

    it('should use default priority when not provided', async () => {
      const dto: CreateTodoDTO = {
        title: 'Default priority todo',
      };

      const todo = await createTodo.execute(dto);

      expect(todo.priority).toBe('medium');
    });

    it('should create todo with different priorities', async () => {
      const priorities: Array<'low' | 'medium' | 'high'> = [
        'low',
        'medium',
        'high',
      ];

      for (const priority of priorities) {
        const dto: CreateTodoDTO = {
          title: `${priority} priority todo`,
          priority,
        };

        const todo = await createTodo.execute(dto);
        expect(todo.priority).toBe(priority);
      }
    });

    it('should throw error for empty title', async () => {
      const dto: CreateTodoDTO = {
        title: '',
      };

      await expect(createTodo.execute(dto)).rejects.toThrow(
        'Todo must have a title'
      );
    });

    it('should throw error for whitespace-only title', async () => {
      const dto: CreateTodoDTO = {
        title: '   ',
      };

      await expect(createTodo.execute(dto)).rejects.toThrow(
        'Todo must have a title'
      );
    });

    it('should warn when creating todo with past due date', async () => {
      const pastDate = new Date('2020-01-01');
      const dto: CreateTodoDTO = {
        title: 'Past due todo',
        dueDate: pastDate,
      };

      await createTodo.execute(dto);

      expect(console.warn).toHaveBeenCalledWith(
        'Due date is in the past'
      );
    });

    it('should handle repository errors', async () => {
      mockTodoRepository.save = vi
        .fn()
        .mockRejectedValue(new Error('Database connection failed'));

      const dto: CreateTodoDTO = {
        title: 'Test todo',
      };

      await expect(createTodo.execute(dto)).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should create todo with empty tags array when not provided', async () => {
      const dto: CreateTodoDTO = {
        title: 'No tags todo',
      };

      const todo = await createTodo.execute(dto);

      expect(todo.tags).toBeDefined();
      expect(todo.tags).toHaveLength(0);
    });

    it('should create todo with multiple tags', async () => {
      const dto: CreateTodoDTO = {
        title: 'Multi-tag todo',
        tags: ['personal', 'health', 'exercise', 'morning'],
      };

      const todo = await createTodo.execute(dto);

      expect(todo.tags).toHaveLength(4);
      expect(todo.tags).toContain('personal');
      expect(todo.tags).toContain('health');
      expect(todo.tags).toContain('exercise');
      expect(todo.tags).toContain('morning');
    });

    it('should create todo with future due date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 days from now

      const dto: CreateTodoDTO = {
        title: 'Future todo',
        dueDate: futureDate,
      };

      const todo = await createTodo.execute(dto);

      expect(todo.dueDate).toEqual(futureDate);
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('should have proper timestamps', async () => {
      const dto: CreateTodoDTO = {
        title: 'Timestamped todo',
      };

      const before = new Date();
      const todo = await createTodo.execute(dto);
      const after = new Date();

      expect(todo.createdAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime()
      );
      expect(todo.createdAt.getTime()).toBeLessThanOrEqual(
        after.getTime()
      );
      expect(todo.updatedAt).toEqual(todo.createdAt);
    });
  });
});
