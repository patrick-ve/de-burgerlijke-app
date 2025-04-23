<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  nextTick,
  unref,
} from 'vue';
import { useToDos } from '~/composables/useToDos';
import type { ToDo } from '~/composables/useToDos';
import { useHeaderState } from '~/composables/useHeaderState';
import { useMouse, useWindowScroll } from '@vueuse/core';
import type { VirtualElement } from '@popperjs/core';
import DatePicker from '~/components/DatePicker.vue';
import { format } from 'date-fns';

const {
  sortedPendingTodos,
  completedTodos,
  addToDo,
  toggleToDo,
  deleteToDo,
  clearCompleted,
  clearAll,
  setDueDate,
} = useToDos();
const { headerState, setHeader, resetHeader, defaultLeftAction } =
  useHeaderState();
const isMounted = ref(false);
const router = useRouter();

const newTodoText = ref('');

// Context Menu State
const isContextMenuOpen = ref(false);
const virtualElement = ref<VirtualElement>({
  getBoundingClientRect: () => ({
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  }),
});
const { x, y } = useMouse();
const { y: windowY } = useWindowScroll();

// Confirmation Modal State
const isModalOpen = ref(false);

// Date Picker Modal State
const isDatePickerModalOpen = ref(false);
const selectedTodoId = ref<string | null>(null);
const selectedDate = ref<Date | null>(null);

const handleAddToDo = () => {
  addToDo(newTodoText.value);
  newTodoText.value = ''; // Clear input after adding
};

// --- Header Action Handlers ---
const triggerLeftAction = () => {
  if (headerState.value.leftActionHandler) {
    headerState.value.leftActionHandler();
  }
};

const triggerRightAction = () => {
  if (headerState.value.rightActionHandler) {
    headerState.value.rightActionHandler();
  }
};

const openContextMenu = () => {
  const top = unref(y) - unref(windowY);
  const left = unref(x);
  virtualElement.value.getBoundingClientRect = () => ({
    width: 0,
    height: 0,
    top,
    left,
    right: left,
    bottom: top,
    x: left,
    y: top,
    toJSON: () => JSON.stringify(this),
  });
  isContextMenuOpen.value = true;
};

// --- Modal Actions ---
const openConfirmationModal = () => {
  isContextMenuOpen.value = false; // Close context menu
  isModalOpen.value = true;
};

const confirmClearAll = () => {
  clearAll();
  isModalOpen.value = false;
};

// --- Date Picker Modal Actions ---
const openDatePickerModal = (
  todoId: string,
  currentDueDate?: Date | null
) => {
  selectedTodoId.value = todoId;
  selectedDate.value = currentDueDate
    ? new Date(currentDueDate)
    : new Date(); // Initialize with current date or today
  isDatePickerModalOpen.value = true;
};

const closeDatePickerModal = () => {
  isDatePickerModalOpen.value = false;
  selectedTodoId.value = null;
  selectedDate.value = null;
};

const saveDueDate = () => {
  if (selectedTodoId.value && selectedDate.value) {
    setDueDate(selectedTodoId.value, selectedDate.value);
  }
  closeDatePickerModal();
};

// --- Lifecycle Hooks ---
onMounted(async () => {
  await nextTick();
  isMounted.value = true;
  setHeader({
    title: 'Takenlijst',
    showLeftAction: true,
    showRightAction: true,
    leftActionHandler: defaultLeftAction, // Use default back action
    rightActionHandler: openContextMenu, // Open context menu
  });
});

useHead({ title: 'Mijn Taken' }); // Set page title
</script>

<template>
  <div class="pb-24">
    <!-- Add padding-bottom to prevent overlap with action bar -->

    <!-- Pending To-Dos -->
    <div v-if="sortedPendingTodos.length > 0" class="mb-6 px-4">
      <h2 class="text-lg font-medium mb-2">Openstaand</h2>
      <TransitionGroup
        tag="ul"
        name="list"
        class="space-y-2 relative"
      >
        <li
          v-for="todo in sortedPendingTodos"
          :key="todo.id"
          class="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md shadow-sm"
        >
          <div class="flex items-center flex-grow mr-2">
            <UCheckbox
              :model-value="todo.completed"
              @update:model-value="toggleToDo(todo.id)"
              class="mr-3 flex-shrink-0"
              :ui="{
                wrapper: 'relative flex items-start',
                label: 'min-w-0 flex-1 text-sm font-medium',
                base: 'h-5 w-5',
              }"
            />
            <div class="flex-grow">
              <span class="text-gray-800">{{ todo.text }}</span>
              <!-- Display Due Date -->
              <p
                v-if="todo.dueDate"
                class="text-xs text-gray-500 mt-1"
              >
                Deadline:
                {{
                  format(new Date(todo.dueDate), 'd MMM, yyyy HH:mm')
                }}
              </p>
            </div>
          </div>
          <div class="flex items-center space-x-1">
            <!-- Due Date Button -->
            <UButton
              :icon="
                todo.dueDate
                  ? 'i-heroicons-calendar-days-solid'
                  : 'i-heroicons-calendar-days'
              "
              size="sm"
              :color="todo.dueDate ? 'primary' : 'gray'"
              variant="ghost"
              @click="openDatePickerModal(todo.id, todo.dueDate)"
              :aria-label="
                todo.dueDate ? 'Change Due Date' : 'Set Due Date'
              "
            />
            <!-- Delete Button -->
            <UButton
              icon="i-heroicons-trash"
              size="sm"
              color="red"
              variant="ghost"
              @click="deleteToDo(todo.id)"
              aria-label="Delete ToDo"
            />
          </div>
        </li>
      </TransitionGroup>
    </div>

    <!-- Completed To-Dos -->
    <div v-if="completedTodos.length > 0" class="mb-6 px-4">
      <h2 class="text-lg font-medium mb-2">Afgerond</h2>
      <TransitionGroup
        tag="ul"
        name="list"
        class="space-y-2 relative"
      >
        <li
          v-for="todo in completedTodos"
          :key="todo.id"
          class="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-md opacity-70"
        >
          <div class="flex items-center flex-grow mr-2">
            <UCheckbox
              :model-value="todo.completed"
              @update:model-value="toggleToDo(todo.id)"
              class="mr-3 flex-shrink-0"
              :ui="{
                wrapper: 'relative flex items-start',
                label:
                  'min-w-0 flex-1 text-sm font-medium line-through text-gray-500',
                base: 'h-5 w-5',
              }"
            />
            <div class="flex-grow">
              <span class="text-gray-500 line-through">{{
                todo.text
              }}</span>
              <!-- Display Due Date for completed -->
              <p
                v-if="todo.dueDate"
                class="text-xs text-gray-400 mt-1 line-through"
              >
                Deadline:
                {{
                  format(new Date(todo.dueDate), 'd MMM, yyyy HH:mm')
                }}
              </p>
            </div>
          </div>
          <!-- No date picker button for completed todos -->
          <UButton
            icon="i-heroicons-trash"
            size="sm"
            color="gray"
            variant="ghost"
            @click="deleteToDo(todo.id)"
            aria-label="Delete ToDo"
          />
        </li>
      </TransitionGroup>
    </div>

    <!-- No To-Dos Message -->
    <div
      v-if="
        sortedPendingTodos.length === 0 && completedTodos.length === 0
      "
      class="text-center text-gray-500 py-8 px-4"
    >
      <p>Je hebt nog geen taken toegevoegd.</p>
    </div>

    <!-- Action Bar -->
    <Transition
      appear
      enter-active-class="transition-all duration-500 ease-out"
      enter-from-class="opacity-0 translate-y-full"
      enter-to-class="opacity-100 translate-y-0"
    >
      <div
        class="fixed bottom-0 left-0 right-0 z-10 p-4 bg-white border-t border-gray-200"
        data-testid="todo-action-bar"
      >
        <form
          class="flex items-center space-x-2 max-w-md mx-auto"
          @submit.prevent="handleAddToDo"
        >
          <UInput
            v-model="newTodoText"
            name="new-todo"
            placeholder="Wat moet er gedaan worden?"
            autocomplete="off"
            autofocus
            size="lg"
            class="flex-grow"
            data-testid="new-todo-input"
          />
          <UButton
            type="submit"
            label="Toevoegen"
            size="lg"
            :disabled="!newTodoText.trim()"
            data-testid="add-todo-button"
            class="px-4 font-bold"
          />
        </form>
      </div>
    </Transition>

    <!-- Teleport Back button to the header -->
    <Teleport to="#header-left-action" v-if="isMounted">
      <UButton
        v-if="headerState.showLeftAction"
        icon="i-heroicons-arrow-left"
        variant="ghost"
        color="gray"
        aria-label="Back"
        @click="triggerLeftAction"
      />
    </Teleport>

    <!-- Teleport Context Menu Trigger to the header -->
    <Teleport to="#header-right-action" v-if="isMounted">
      <UButton
        v-if="headerState.showRightAction"
        icon="i-heroicons-ellipsis-vertical"
        variant="ghost"
        color="gray"
        aria-label="Options"
        @click="triggerRightAction"
      />
    </Teleport>

    <!-- Teleport Context Menu to the body -->
    <Teleport to="body">
      <UContextMenu
        v-model="isContextMenuOpen"
        :virtual-element="virtualElement"
        :popper="{ placement: 'bottom-end' }"
        :ui="{ container: 'z-50 group' }"
      >
        <div class="p-1">
          <UButton
            label="Maak lijst leeg"
            color="red"
            variant="ghost"
            icon="i-heroicons-trash"
            :disabled="
              sortedPendingTodos.length === 0 &&
              completedTodos.length === 0
            "
            @click="openConfirmationModal"
          />
        </div>
      </UContextMenu>
    </Teleport>

    <!-- Confirmation Modal -->
    <UModal
      v-model="isModalOpen"
      :ui="{
        overlay: {
          background: 'bg-black/40 backdrop-blur-sm',
        },
      }"
    >
      <UCard
        :ui="{
          ring: '',
          divide: 'divide-y divide-gray-100',
        }"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <h3
              class="text-base font-semibold leading-6 text-gray-900"
            >
              Takenlijst legen
            </h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark-20-solid"
              class="-my-1"
              @click="isModalOpen = false"
            />
          </div>
        </template>

        <p>
          Weet je zeker dat je alle taken permanent wilt verwijderen?
          Deze actie kan niet ongedaan worden gemaakt.
        </p>

        <template #footer>
          <div class="flex justify-end space-x-2">
            <UButton
              color="gray"
              variant="ghost"
              label="Annuleren"
              @click="isModalOpen = false"
            />
            <UButton
              color="red"
              label="Alles verwijderen"
              icon="i-heroicons-trash"
              @click="confirmClearAll"
            />
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Date Picker Modal -->
    <UModal
      v-model="isDatePickerModalOpen"
      :ui="{
        overlay: {
          background: 'bg-black/40 backdrop-blur-sm',
        },
      }"
    >
      <UCard
        :ui="{
          ring: '',
          divide: 'divide-y divide-gray-100',
        }"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <h3
              class="text-base font-semibold leading-6 text-gray-900"
            >
              Selecteer deadline
            </h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark-20-solid"
              class="-my-1"
              @click="closeDatePickerModal"
            />
          </div>
        </template>

        <div class="flex justify-center">
          <DatePicker
            v-model="selectedDate"
            class="w-full"
            mode="dateTime"
            :is24hr="true"
          />
        </div>

        <template #footer>
          <div class="flex justify-end space-x-2">
            <UButton
              color="gray"
              variant="ghost"
              label="Annuleren"
              @click="closeDatePickerModal"
            />
            <UButton
              label="Opslaan"
              icon="i-heroicons-check"
              @click="saveDueDate"
              class="font-bold"
            />
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<style scoped>
/* List transition animations */
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* Ensure leaving items are taken out of layout flow */
.list-leave-active {
  position: absolute;
  width: calc(
    100% - 2rem
  ); /* Adjust based on padding/margins if needed (px-4 on parent = 1rem each side) */
}
</style>
