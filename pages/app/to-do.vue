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
import { useMouse, useWindowScroll } from '@vueuse/core';
import type { VirtualElement } from '@popperjs/core';
import DatePicker from '~/components/DatePicker.vue';
import { format } from 'date-fns';
import VuePdfEmbed from 'vue-pdf-embed';

const {
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
} = useToDos();
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

// File Input Ref
const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedTodoIdForAttachment = ref<string | null>(null);

// PDF Preview Modal State
const isPdfPreviewModalOpen = ref(false);
const pdfPreviewSource = ref<string | null>(null);
const pdfPreviewTitle = ref<string | null>(null);

const handleAddToDo = () => {
  addToDo(newTodoText.value);
  newTodoText.value = ''; // Clear input after adding
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

// --- File Attachment Handlers ---
const triggerFileInput = (todoId: string) => {
  selectedTodoIdForAttachment.value = todoId; // Store the id of the todo we're attaching to
  fileInputRef.value?.click(); // Trigger the hidden file input
};

const handleFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file && selectedTodoIdForAttachment.value) {
    attachFileToToDo(selectedTodoIdForAttachment.value, file);
    // Clear the file input and the stored id after processing
    if (fileInputRef.value) {
      fileInputRef.value.value = ''; // Reset file input
    }
    selectedTodoIdForAttachment.value = null;
  } else if (!file) {
    console.log('No file selected.');
    selectedTodoIdForAttachment.value = null; // Clear id even if no file selected
  }
};

// Helper to get a readable file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (
    parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  );
};

// --- PDF Preview Handlers ---
const openPdfPreviewModal = (attachment: ToDo['attachment']) => {
  if (attachment && attachment.type === 'application/pdf') {
    pdfPreviewSource.value = attachment.data;
    pdfPreviewTitle.value = attachment.name;
    isPdfPreviewModalOpen.value = true;
  } else {
    console.warn(
      'Attempted to preview a non-PDF file or no attachment found.'
    );
  }
};

const closePdfPreviewModal = () => {
  isPdfPreviewModalOpen.value = false;
  pdfPreviewSource.value = null;
  pdfPreviewTitle.value = null;
};

// --- Lifecycle Hooks ---
onMounted(async () => {
  await nextTick();
});

useHead({ title: 'Mijn Taken' }); // Set page title
</script>

<template>
  <TheHeader title="Takenlijst">
    <template #left-action>
      <UButton
        icon="i-heroicons-arrow-left"
        variant="ghost"
        color="gray"
        aria-label="Back"
        @click="router.push('/app')"
      />
    </template>
    <template #right-action>
      <UButton
        icon="i-heroicons-ellipsis-vertical"
        variant="ghost"
        color="gray"
        aria-label="Options"
        @click="openContextMenu"
      />
    </template>
  </TheHeader>

  <div class="pb-24 max-w-7xl mx-auto">
    <!-- Add padding-bottom to prevent overlap with action bar -->

    <!-- Hidden File Input -->
    <input
      ref="fileInputRef"
      type="file"
      class="hidden"
      @change="handleFileSelected"
      aria-hidden="true"
    />

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
            <div class="flex-grow min-w-0">
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
              <!-- Display Attachment Info -->
              <div
                v-if="todo.attachment"
                class="mt-1.5 flex items-center space-x-2 text-xs text-gray-600"
              >
                <UIcon
                  name="i-heroicons-paper-clip"
                  class="h-4 w-4 flex-shrink-0"
                />
                <a
                  :href="todo.attachment.data"
                  :download="todo.attachment.name"
                  target="_blank"
                  class="hover:underline truncate"
                  :title="`${todo.attachment.name} (${formatFileSize(todo.attachment.size)})`"
                >
                  {{ todo.attachment.name }} ({{
                    formatFileSize(todo.attachment.size)
                  }})
                </a>
                <!-- PDF Preview Button -->
                <UButton
                  v-if="todo.attachment.type === 'application/pdf'"
                  icon="i-heroicons-eye"
                  size="2xs"
                  color="gray"
                  variant="link"
                  :padded="false"
                  @click="openPdfPreviewModal(todo.attachment)"
                  aria-label="Preview PDF"
                  class="ml-1 flex-shrink-0"
                />
                <UButton
                  icon="i-heroicons-x-mark-solid"
                  size="2xs"
                  color="red"
                  variant="link"
                  :padded="false"
                  @click="removeAttachment(todo.id)"
                  aria-label="Remove Attachment"
                  class="ml-auto flex-shrink-0"
                />
              </div>
            </div>
          </div>
          <div class="flex items-center space-x-1 flex-shrink-0">
            <!-- Attach File Button -->
            <UButton
              icon="i-heroicons-paper-clip"
              size="sm"
              color="gray"
              variant="ghost"
              @click="triggerFileInput(todo.id)"
              aria-label="Attach File"
              :disabled="!!todo.attachment"
            />
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
            <div class="flex-grow min-w-0">
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
              <!-- Display Attachment Info for completed -->
              <div
                v-if="todo.attachment"
                class="mt-1.5 flex items-center space-x-2 text-xs text-gray-500 line-through"
              >
                <UIcon
                  name="i-heroicons-paper-clip"
                  class="h-4 w-4 flex-shrink-0"
                />
                <span
                  class="truncate"
                  :title="`${todo.attachment.name} (${formatFileSize(todo.attachment.size)})`"
                >
                  {{ todo.attachment.name }} ({{
                    formatFileSize(todo.attachment.size)
                  }})
                </span>
                <!-- No remove button for completed attachments -->
              </div>
            </div>
          </div>
          <!-- No date picker or attach button for completed todos -->
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
        class="fixed bottom-0 left-0 right-0 z-10 p-4 bg-white border-t border-gray-200 max-w-7xl mx-auto md:border-[1px] md:border-r-[1px]"
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

    <!-- PDF Preview Modal -->
    <UModal
      v-model="isPdfPreviewModalOpen"
      prevent-close
      :ui="{
        width: 'sm:max-w-3xl md:max-w-4xl lg:max-w-5xl',
        overlay: {
          background: 'bg-black/40 backdrop-blur-sm',
        },
      }"
    >
      <UCard
        :ui="{
          ring: '',
          divide: 'divide-y divide-gray-100',
          body: { padding: 'p-0 sm:p-0' }, // Remove padding for full width embed
          header: { padding: 'px-4 py-3 sm:px-6' },
          footer: { padding: 'px-4 py-3 sm:px-6' },
        }"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <h3
              class="text-base font-semibold leading-6 text-gray-900 truncate"
              :title="pdfPreviewTitle || 'PDF Preview'"
            >
              {{ pdfPreviewTitle || 'PDF Preview' }}
            </h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark-20-solid"
              class="-my-1"
              @click="closePdfPreviewModal"
              aria-label="Close Preview"
            />
          </div>
        </template>

        <div class="pdf-embed-container h-[75vh] overflow-y-auto">
          <ClientOnly>
            <VuePdfEmbed
              v-if="pdfPreviewSource"
              :source="pdfPreviewSource"
            />
            <template #fallback>
              <div class="flex items-center justify-center h-full">
                <UIcon
                  name="i-heroicons-arrow-path"
                  class="animate-spin h-8 w-8 text-gray-500"
                />
                <span class="ml-2 text-gray-500">Laden...</span>
              </div>
            </template>
          </ClientOnly>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <UButton
              label="Sluiten"
              color="gray"
              variant="solid"
              @click="closePdfPreviewModal"
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
