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
  dueDate?: Date | null; // Add optional dueDate property
  attachment?: {
    name: string;
    type: string;
    size: number;
    data: string; // Base64 encoded file data
  } | null; // Add optional attachment property
}

// Use useStorage to persist the To-Do list in localStorage
const toDos = useStorage<ToDo[]>('todos', []);

export function useToDos() {
  // Computed property for sorted pending To-Dos
  const sortedPendingTodos = computed(() => {
    return toDos.value
      .filter((todo) => !todo.completed)
      .sort((a, b) => {
        // Items without due date go to the bottom
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;

        // Sort by due date (closest first)
        return (
          new Date(a.dueDate).getTime() -
          new Date(b.dueDate).getTime()
        );
      });
  });

  // Computed property for completed To-Dos (order maintained)
  const completedTodos = computed(() => {
    return toDos.value.filter((todo) => todo.completed);
  });

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
      dueDate: null, // Initialize dueDate as null
      attachment: null, // Initialize attachment as null
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

  /**
   * Sets the due date for a specific To-Do item.
   */
  const setDueDate = (id: string, dueDate: Date | null) => {
    const index = toDos.value.findIndex((item) => item.id === id);
    if (index !== -1) {
      toDos.value[index].dueDate = dueDate;
      toDos.value[index].updatedAt = new Date();
      console.log('ToDo Due Date Set:', toDos.value[index]);
    } else {
      console.warn(
        'Attempted to set due date for non-existent To-Do:',
        id
      );
    }
  };

  /**
   * Attaches a file to a specific To-Do item.
   * Converts the file to a Base64 string for storage.
   * Note: Large files might exceed localStorage limits.
   */
  const attachFileToToDo = (id: string, file: File) => {
    const index = toDos.value.findIndex((item) => item.id === id);
    if (index === -1) {
      console.warn(
        'Attempted to attach file to non-existent To-Do:',
        id
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        // Check file size (example: limit to 2MB)
        const maxSize = 2 * 1024 * 1024; // 2MB in bytes
        if (file.size > maxSize) {
          console.error(
            `File size exceeds the limit of ${maxSize / 1024 / 1024}MB. File not attached.`
          );
          // Optionally, provide user feedback here (e.g., using a toast notification)
          return;
        }

        toDos.value[index].attachment = {
          name: file.name,
          type: file.type,
          size: file.size,
          data: result, // Base64 string
        };
        toDos.value[index].updatedAt = new Date();
        console.log('File Attached to ToDo:', toDos.value[index]);
      } else {
        console.error('Failed to read file as Base64 string.');
      }
    };
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
    };
    reader.readAsDataURL(file); // Reads the file as Base64
  };

  /**
   * Removes the attachment from a specific To-Do item.
   */
  const removeAttachment = (id: string) => {
    const index = toDos.value.findIndex((item) => item.id === id);
    if (index !== -1) {
      if (toDos.value[index].attachment) {
        toDos.value[index].attachment = null;
        toDos.value[index].updatedAt = new Date();
        console.log('Attachment Removed from ToDo:', id);
      }
    } else {
      console.warn(
        'Attempted to remove attachment from non-existent To-Do:',
        id
      );
    }
  };

  return {
    sortedPendingTodos,
    completedTodos,
    addToDo,
    toggleToDo,
    deleteToDo,
    clearCompleted,
    clearAll,
    setDueDate,
    attachFileToToDo,
    removeAttachment,
  };
}
