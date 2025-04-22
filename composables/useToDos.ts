import { ref, computed } from 'vue';
import { useStorage } from '@vueuse/core';
import { v4 as uuidv4 } from 'uuid';

// Define the structure of a To-Do item
export interface ToDo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Use useStorage to persist the To-Do list in localStorage
const toDos = useStorage<ToDo[]>('todos', []);

export function useToDos() {
  const items = computed(() => toDos.value);

  /**
   * Adds a new To-Do item to the list.
   */
  const addToDo = (text: string) => {
    if (!text || text.trim() === '') {
      return; // Don't add empty To-Dos
    }

    const newToDo: ToDo = {
      id: uuidv4(),
      text: text.trim(),
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    toDos.value.push(newToDo);
    console.log('ToDo Added:', newToDo);
  };

  /**
   * Toggles the completion status of a To-Do item.
   */
  const toggleToDo = (id: string) => {
    const index = toDos.value.findIndex((item) => item.id === id);
    if (index !== -1) {
      toDos.value[index].completed = !toDos.value[index].completed;
      toDos.value[index].updatedAt = new Date();
      console.log('ToDo Toggled:', toDos.value[index]);
    } else {
      console.warn('Attempted to toggle non-existent To-Do:', id);
    }
  };

  /**
   * Deletes a To-Do item from the list by its ID.
   */
  const deleteToDo = (id: string) => {
    const index = toDos.value.findIndex((item) => item.id === id);
    if (index !== -1) {
      toDos.value.splice(index, 1);
      console.log('ToDo Deleted:', id);
    } else {
      console.warn('Attempted to delete non-existent To-Do:', id);
    }
  };

  /**
   * Clears all completed To-Do items from the list.
   */
  const clearCompleted = () => {
    toDos.value = toDos.value.filter((item) => !item.completed);
    console.log('Completed To-Dos Cleared');
  };

  /**
   * Clears all To-Do items from the list.
   */
  const clearAll = () => {
    toDos.value = [];
    console.log('All To-Dos Cleared');
  };

  return {
    items,
    addToDo,
    toggleToDo,
    deleteToDo,
    clearCompleted,
    clearAll,
  };
}
