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

const {
  items,
  addToDo,
  toggleToDo,
  deleteToDo,
  clearCompleted,
  clearAll,
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

const handleAddToDo = () => {
  addToDo(newTodoText.value);
  newTodoText.value = ''; // Clear input after adding
};

// Separate computed properties for pending and completed todos
const pendingTodos = computed(() =>
  items.value.filter((todo) => !todo.completed)
);
const completedTodos = computed(() =>
  items.value.filter((todo) => todo.completed)
);

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

onUnmounted(() => {
  resetHeader();
  isMounted.value = false;
});

useHead({ title: 'Mijn Taken' }); // Set page title
</script>

<template>
  <div class="pb-24">
    <!-- Add padding-bottom to prevent overlap with action bar -->

    <!-- Pending To-Dos -->
    <div v-if="pendingTodos.length > 0" class="mb-6 px-4">
      <h2 class="text-lg font-medium mb-2">Openstaand</h2>
      <TransitionGroup
        tag="ul"
        name="list"
        class="space-y-2 relative"
      >
        <li
          v-for="todo in pendingTodos"
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
            <span class="text-gray-800">{{ todo.text }}</span>
          </div>
          <UButton
            icon="i-heroicons-trash"
            size="sm"
            color="red"
            variant="ghost"
            @click="deleteToDo(todo.id)"
            aria-label="Delete ToDo"
          />
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
            <span class="text-gray-500 line-through">{{
              todo.text
            }}</span>
          </div>
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
      v-if="items.length === 0"
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
            :disabled="items.length === 0"
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
