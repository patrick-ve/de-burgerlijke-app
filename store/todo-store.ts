import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Todo } from '@/types';

interface TodoState {
  todos: Todo[];
  addTodo: (title: string) => void;
  updateTodo: (id: string, title: string) => void;
  deleteTodo: (id: string) => void;
  toggleTodo: (id: string) => void;
}

export const useTodoStore = create<TodoState>()(
  persist(
    (set) => ({
      todos: [],
      addTodo: (title) => set((state) => ({
        todos: [
          {
            id: Date.now().toString(),
            title,
            completed: false,
            createdAt: Date.now(),
          },
          ...state.todos,
        ]
      })),
      updateTodo: (id, title) => set((state) => ({
        todos: state.todos.map((todo) => 
          todo.id === id ? { ...todo, title } : todo
        )
      })),
      deleteTodo: (id) => set((state) => ({
        todos: state.todos.filter((todo) => todo.id !== id)
      })),
      toggleTodo: (id) => set((state) => ({
        todos: state.todos.map((todo) => 
          todo.id === id 
            ? { 
                ...todo, 
                completed: !todo.completed,
                completedAt: !todo.completed ? Date.now() : undefined
              } 
            : todo
        )
      })),
    }),
    {
      name: 'todo-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);