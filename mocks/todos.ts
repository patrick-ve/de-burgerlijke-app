import { Todo } from '@/types';

export const mockTodos: Todo[] = [
  {
    id: '1',
    title: 'Clean the kitchen',
    completed: false,
    createdAt: Date.now() - 86400000 * 2, // 2 days ago
  },
  {
    id: '2',
    title: 'Take out the trash',
    completed: true,
    createdAt: Date.now() - 86400000, // 1 day ago
    completedAt: Date.now() - 43200000, // 12 hours ago
  },
  {
    id: '3',
    title: 'Water the plants',
    completed: false,
    createdAt: Date.now() - 86400000 * 3, // 3 days ago
  },
  {
    id: '4',
    title: 'Pay electricity bill',
    completed: false,
    createdAt: Date.now() - 86400000 * 1.5, // 1.5 days ago
  },
  {
    id: '5',
    title: 'Call mom',
    completed: true,
    createdAt: Date.now() - 86400000 * 4, // 4 days ago
    completedAt: Date.now() - 86400000 * 2, // 2 days ago
  },
];