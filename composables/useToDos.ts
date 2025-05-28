import { ref, computed } from 'vue';
import { useContainer } from '../src/container';
import { type Todo } from '../src/domain/entities/Todo';
import { type Priority } from '../src/domain/value-objects/Priority';
import { type FileAttachment } from '../src/domain/value-objects/FileAttachment';

export function useToDos() {
  const { 
    todoRepository,
    createTodo,
    updateTodo,
    deleteTodo,
    attachFileToTodo,
    setTodoDueDate
  } = useContainer();
  const toast = useToast();
  
  // State
  const todos = ref<Todo[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  // Computed property for sorted pending To-Dos
  const sortedPendingTodos = computed(() => {
    return todos.value
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
    return todos.value.filter((todo) => todo.completed);
  });
  
  // Load todos
  const loadTodos = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      todos.value = await todoRepository.findAll();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load todos';
      toast.add({
        title: 'Error',
        description: error.value,
        color: 'red'
      });
    } finally {
      loading.value = false;
    }
  };

  /**
   * Adds a new To-Do item to the list.
   */
  const addToDo = async (text: string, priority: Priority = 'medium') => {
    if (!text || text.trim() === '') {
      return; // Don't add empty To-Dos
    }

    loading.value = true;
    error.value = null;
    
    try {
      const todo = await createTodo.execute({
        title: text.trim(),
        priority
      });
      
      todos.value.push(todo);
      
      toast.add({
        title: 'Success',
        description: 'Todo added successfully',
        color: 'green'
      });
      
      return todo;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to add todo';
      toast.add({
        title: 'Error',
        description: error.value,
        color: 'red'
      });
      throw e;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Toggles the completion status of a To-Do item.
   */
  const toggleToDo = async (id: string) => {
    const todo = todos.value.find(t => t.id === id);
    if (!todo) {
      console.warn('Attempted to toggle non-existent To-Do:', id);
      return;
    }
    
    loading.value = true;
    error.value = null;
    
    try {
      const updatedTodo = await updateTodo.execute({
        id,
        completed: !todo.completed
      });
      
      const index = todos.value.findIndex(t => t.id === id);
      if (index !== -1) {
        todos.value[index] = updatedTodo;
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to toggle todo';
      toast.add({
        title: 'Error',
        description: error.value,
        color: 'red'
      });
    } finally {
      loading.value = false;
    }
  };

  /**
   * Deletes a To-Do item from the list by its ID.
   */
  const deleteToDo = async (id: string) => {
    loading.value = true;
    error.value = null;
    
    try {
      await deleteTodo.execute(id);
      
      const index = todos.value.findIndex(t => t.id === id);
      if (index !== -1) {
        todos.value.splice(index, 1);
      }
      
      toast.add({
        title: 'Success',
        description: 'Todo deleted successfully',
        color: 'green'
      });
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to delete todo';
      toast.add({
        title: 'Error',
        description: error.value,
        color: 'red'
      });
    } finally {
      loading.value = false;
    }
  };

  /**
   * Clears all completed To-Do items from the list.
   */
  const clearCompleted = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const completedIds = todos.value
        .filter(todo => todo.completed)
        .map(todo => todo.id);
      
      await Promise.all(completedIds.map(id => deleteTodo.execute(id)));
      
      todos.value = todos.value.filter(todo => !todo.completed);
      
      toast.add({
        title: 'Success',
        description: 'Completed todos cleared',
        color: 'green'
      });
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to clear completed todos';
      toast.add({
        title: 'Error',
        description: error.value,
        color: 'red'
      });
    } finally {
      loading.value = false;
    }
  };

  /**
   * Sets the due date for a specific To-Do item.
   */
  const setDueDate = async (id: string, dueDate: Date | null) => {
    loading.value = true;
    error.value = null;
    
    try {
      const updatedTodo = await setTodoDueDate.execute({
        todoId: id,
        dueDate: dueDate || undefined
      });
      
      const index = todos.value.findIndex(t => t.id === id);
      if (index !== -1) {
        todos.value[index] = updatedTodo;
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to set due date';
      toast.add({
        title: 'Error',
        description: error.value,
        color: 'red'
      });
    } finally {
      loading.value = false;
    }
  };

  /**
   * Attaches a file to a specific To-Do item.
   */
  const attachFileToToDo = async (id: string, file: File) => {
    loading.value = true;
    error.value = null;
    
    try {
      const attachment = await attachFileToTodo.execute({
        todoId: id,
        file
      });
      
      const index = todos.value.findIndex(t => t.id === id);
      if (index !== -1) {
        todos.value[index].addAttachment(attachment);
      }
      
      toast.add({
        title: 'Success',
        description: 'File attached successfully',
        color: 'green'
      });
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to attach file';
      toast.add({
        title: 'Error',
        description: error.value,
        color: 'red'
      });
    } finally {
      loading.value = false;
    }
  };

  /**
   * Removes the attachment from a specific To-Do item.
   */
  const removeAttachment = async (id: string, attachmentId: string) => {
    loading.value = true;
    error.value = null;
    
    try {
      const todo = todos.value.find(t => t.id === id);
      if (!todo) return;
      
      todo.removeAttachment(attachmentId);
      await todoRepository.update(todo);
      
      toast.add({
        title: 'Success',
        description: 'Attachment removed successfully',
        color: 'green'
      });
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to remove attachment';
      toast.add({
        title: 'Error',
        description: error.value,
        color: 'red'
      });
    } finally {
      loading.value = false;
    }
  };

  return {
    todos,
    sortedPendingTodos,
    completedTodos,
    loading,
    error,
    loadTodos,
    addToDo,
    toggleToDo,
    deleteToDo,
    clearCompleted,
    setDueDate,
    attachFileToToDo,
    removeAttachment,
  };
}