<template>
  <div class="todo-item flex items-center space-x-3 py-2">
    <UCheckbox
      :id="`todo-${id}`"
      :model-value="completed"
      :label="text"
      :aria-label="`Mark todo '${text}' as ${completed ? 'incomplete' : 'complete'}`"
      @update:model-value="$emit('toggle-complete', id)"
    />
    <label
      :for="`todo-${id}`"
      class="cursor-pointer"
      :class="{
        'line-through': completed,
        'text-gray-500': completed,
      }"
    >
      {{ text }}
    </label>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Todo as DomainTodo } from '../src/domain/entities/Todo';
import {
  TodoMapper,
  type UITodo,
} from '../src/application/mappers/TodoMapper';

interface ToDoProps {
  id: string;
  text: string;
  completed: boolean;
}

const props = defineProps<ToDoProps>();

const emit = defineEmits<{
  (e: 'toggle-complete', id: string): void;
}>();

// Convert props to domain model
const domainTodo = computed(() => {
  const uiTodo: UITodo = {
    id: props.id,
    title: props.text,
    completed: props.completed,
  };

  try {
    return TodoMapper.toDomain(uiTodo);
  } catch (error) {
    console.error('Failed to convert todo to domain model:', error);
    return null;
  }
});

// The UCheckbox handles the model-value and emits an update event.
// We catch this and emit our own 'toggle-complete' event.
// The label beside the UCheckbox is for visual text display and styling (e.g., line-through).
// UCheckbox itself has a label prop which it uses internally for accessibility.
</script>

<style scoped>
/* Styles can be added here if needed, beyond Tailwind classes */
.todo-item label.line-through {
  /* Tailwind's line-through utility is used directly */
}
</style>
