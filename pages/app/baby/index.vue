<script setup lang="ts">
import { ref, computed } from 'vue';
import { useBaby } from '~/composables/useBaby';
import { useWebRTCSync } from '~/composables/useWebRTCSync';
import type { MilkEntry } from '~/composables/useBaby';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useMouse, useWindowScroll } from '@vueuse/core';

const {
  babyProfile,
  milkEntries,
  dailyMilkRequirement,
  entriesByDay,
  todaysMilkIntake,
  milkIntakeProgress,
  isDailyRequirementMet,
  updateBabyProfile,
  addMilkEntry,
  deleteMilkEntry,
  clearAllEntries,
} = useBaby();

// WebRTC sync functionality
const { connectionState, isConnected, connectedDeviceId } = useWebRTCSync();

const router = useRouter();

// Modal states
const isAddEntryModalOpen = ref(false);
const isWeightModalOpen = ref(false);
const isClearModalOpen = ref(false);

// Form data
const weightForm = ref({
  weight: babyProfile.value?.weight || 0,
});

const entryForm = ref({
  time: new Date(),
  amount: 0,
  spitUp: false,
  urinated: false,
  defecated: false,
  temperature: undefined as number | undefined,
});

// Time picker state
const currentHour = ref(new Date().getHours());
const currentMinute = ref(new Date().getMinutes());

// Context menu
const isContextMenuOpen = ref(false);
const { x, y } = useMouse();
const { y: windowY } = useWindowScroll();
const virtualElement = ref({
  getBoundingClientRect: () => ({
    width: 0,
    height: 0,
    top: y.value - windowY.value,
    left: x.value,
    right: x.value,
    bottom: y.value - windowY.value,
    x: x.value,
    y: y.value - windowY.value,
    toJSON: () => ({}),
  }),
});

// Helper functions
const formatTime = (date: Date | string) => {
  return format(new Date(date), 'HH:mm', { locale: nl });
};

const formatDate = (dateKey: string) => {
  const date = new Date(dateKey);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Vandaag';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Gisteren';
  } else {
    return format(date, 'EEEE d MMMM', { locale: nl });
  }
};

const getDailyIntake = (dateKey: string) => {
  const entries = entriesByDay.value[dateKey] || [];
  return entries.reduce((total, entry) => total + entry.amount, 0);
};

const getActivityLabel = (entry: MilkEntry) => {
  const activities = [];
  if (entry.spitUp) activities.push('gespuugd');
  if (entry.urinated) activities.push('geplast');
  if (entry.defecated) activities.push('gepoept');
  return activities.join(', ');
};

// Time adjustment functions
const adjustHour = (increment: number) => {
  currentHour.value = (currentHour.value + increment + 24) % 24;
  updateEntryTime();
};

const adjustMinute = (increment: number) => {
  currentMinute.value = (currentMinute.value + increment + 60) % 60;
  updateEntryTime();
};

const updateEntryTime = () => {
  const newTime = new Date();
  newTime.setHours(currentHour.value);
  newTime.setMinutes(currentMinute.value);
  newTime.setSeconds(0);
  newTime.setMilliseconds(0);
  entryForm.value.time = newTime;
};

const formatTimeDisplay = (hour: number, minute: number) => {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

// Modal handlers
const openAddEntryModal = () => {
  const now = new Date();
  currentHour.value = now.getHours();
  currentMinute.value = now.getMinutes();
  
  entryForm.value = {
    time: now,
    amount: 60,
    spitUp: false,
    urinated: false,
    defecated: false,
    temperature: undefined,
  };
  isAddEntryModalOpen.value = true;
};

const closeAddEntryModal = () => {
  isAddEntryModalOpen.value = false;
};

const openWeightModal = () => {
  isContextMenuOpen.value = false;
  weightForm.value.weight = babyProfile.value?.weight || 0;
  isWeightModalOpen.value = true;
};

const closeWeightModal = () => {
  isWeightModalOpen.value = false;
};

const openContextMenu = () => {
  isContextMenuOpen.value = true;
};

const openClearModal = () => {
  isContextMenuOpen.value = false;
  isClearModalOpen.value = true;
};

// Form submissions
const handleAddEntry = () => {
  if (entryForm.value.amount <= 0) return;

  addMilkEntry({
    time: entryForm.value.time,
    amount: entryForm.value.amount,
    spitUp: entryForm.value.spitUp,
    urinated: entryForm.value.urinated,
    defecated: entryForm.value.defecated,
    temperature: entryForm.value.temperature,
  });

  closeAddEntryModal();
};

const handleUpdateWeight = () => {
  updateBabyProfile({
    weight: weightForm.value.weight,
  });
  closeWeightModal();
};

const handleClearAll = () => {
  clearAllEntries();
  isClearModalOpen.value = false;
};

// Page title
useHead({ title: 'Baby' });
</script>

<template>
  <TheHeader title="Baby">
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
      <div class="flex items-center space-x-2">
        <!-- Sync Status Indicator -->
        <UButton
          :icon="isConnected ? 'i-heroicons-wifi' : 'i-heroicons-wifi-slash'"
          variant="ghost"
          :color="isConnected ? 'green' : 'gray'"
          size="sm"
          aria-label="Sync Status"
          @click="router.push('/app/baby/sync')"
        />
        
        <UButton
          icon="i-heroicons-ellipsis-vertical"
          variant="ghost"
          color="gray"
          aria-label="Options"
          @click="openContextMenu"
        />
      </div>
    </template>
  </TheHeader>

  <div class="pb-24 max-w-7xl mx-auto">
    <!-- Daily Progress Summary -->
    <div class="px-4 pt-4 mb-6">
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <!-- Weight & Daily Requirement -->
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="text-center">
            <p class="text-sm text-gray-500">Gewicht</p>
            <p class="text-xl font-bold text-gray-900">
              {{ babyProfile?.weight || 0 }}g
            </p>
          </div>
          <div class="text-center">
            <p class="text-sm text-gray-500">Dagelijks nodig</p>
            <p class="text-xl font-bold text-gray-900">
              {{ dailyMilkRequirement }}mL
            </p>
          </div>
        </div>

        <!-- Daily Progress -->
        <div class="mb-2">
          <div class="flex justify-between items-center mb-1">
            <span class="text-sm text-gray-600">Vandaag gedronken</span>
            <span class="text-sm font-medium" :class="isDailyRequirementMet ? 'text-green-600' : 'text-gray-900'">
              {{ todaysMilkIntake }}mL / {{ dailyMilkRequirement }}mL
            </span>
          </div>
          <UProgress
            :value="milkIntakeProgress"
            :color="isDailyRequirementMet ? 'green' : 'primary'"
            size="md"
          />
        </div>

        <!-- Status Message -->
        <div v-if="isDailyRequirementMet" class="flex items-center text-sm text-green-600 mt-2">
          <UIcon name="i-heroicons-check-circle" class="w-4 h-4 mr-1" />
          Dagelijkse behoefte behaald!
        </div>
      </div>
    </div>

    <!-- Entries by Day -->
    <div v-if="Object.keys(entriesByDay).length > 0" class="px-4">
      <div
        v-for="(entries, dateKey) in entriesByDay"
        :key="dateKey"
        class="mb-6"
      >
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-medium text-gray-900">
            {{ formatDate(dateKey) }}
          </h3>
          <span class="text-sm text-gray-500">
            {{ getDailyIntake(dateKey) }}mL totaal
          </span>
        </div>

        <div class="space-y-2">
          <div
            v-for="entry in entries"
            :key="entry.id"
            class="bg-white border border-gray-200 rounded-lg p-3"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="flex items-center space-x-1.5">
                  <UIcon name="i-heroicons-clock" class="w-3.5 h-3.5 text-gray-400" />
                  <span class="text-sm font-bold text-gray-900">
                    {{ formatTime(entry.time) }}
                  </span>
                </div>
                
                <!-- Amount Badge -->
                <UBadge
                  :label="`${entry.amount} mL`"
                  color="blue"
                  variant="subtle"
                  size="sm"
                />

                <!-- Additional Info -->
                <div class="flex gap-2">
                  <UBadge
                    v-if="entry.spitUp || entry.urinated || entry.defecated"
                    :label="getActivityLabel(entry)"
                    color="amber"
                    variant="subtle"
                    size="xs"
                  />
                  <UBadge
                    v-if="entry.temperature"
                    :label="`${entry.temperature}°C`"
                    color="red"
                    variant="subtle"
                    size="xs"
                  />
                </div>
              </div>
              
              <UButton
                icon="i-heroicons-trash"
                size="xs"
                color="red"
                variant="ghost"
                @click="deleteMilkEntry(entry.id)"
                aria-label="Delete Entry"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- No Entries Message -->
    <div
      v-if="Object.keys(entriesByDay).length === 0"
      class="text-center text-gray-500 py-8 px-4"
    >
      <UIcon name="i-heroicons-heart" class="w-12 h-12 mx-auto mb-4 text-gray-300" />
      <p>Nog geen voedingen toegevoegd.</p>
      <p class="text-sm mt-1">Begin met het vastleggen van baby's voeding.</p>
    </div>

    <!-- Action Bar -->
    <Transition
      appear
      enter-active-class="transition-all duration-500 ease-out"
      enter-from-class="opacity-0 translate-y-full"
      enter-to-class="opacity-100 translate-y-0"
    >
      <div class="fixed bottom-0 left-0 right-0 z-10 p-4 bg-white border-t border-gray-200 max-w-7xl mx-auto md:border-[1px] md:border-r-[1px]">
        <div class="flex items-center space-x-2 max-w-md mx-auto">
          <UButton
            label="Voeding toevoegen"
            size="lg"
            class="flex-grow font-bold"
            @click="openAddEntryModal"
          />
        </div>
      </div>
    </Transition>

    <!-- Context Menu -->
    <Teleport to="body">
      <UContextMenu
        v-model="isContextMenuOpen"
        :virtual-element="virtualElement"
        :popper="{ placement: 'bottom-end' }"
        :ui="{ container: 'z-50 group' }"
      >
        <div class="p-1">
          <UButton
            label="Synchronisatie"
            variant="ghost"
            :icon="isConnected ? 'i-heroicons-wifi' : 'i-heroicons-wifi-slash'"
            @click="router.push('/app/baby/sync')"
            class="w-full justify-start"
          />
          <UButton
            label="Gewicht wijzigen"
            variant="ghost"
            icon="i-heroicons-scale"
            @click="openWeightModal"
            class="w-full justify-start"
          />
          <UButton
            label="Alles wissen"
            color="red"
            variant="ghost"
            icon="i-heroicons-trash"
            :disabled="Object.keys(entriesByDay).length === 0"
            @click="openClearModal"
            class="w-full justify-start"
          />
        </div>
      </UContextMenu>
    </Teleport>

    <!-- Add Entry Modal -->
    <UModal
      v-model="isAddEntryModalOpen"
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
            <h3 class="text-base font-semibold leading-6 text-gray-900">
              Voeding toevoegen
            </h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark-20-solid"
              class="-my-1"
              @click="closeAddEntryModal"
            />
          </div>
        </template>

        <form @submit.prevent="handleAddEntry" class="space-y-6">
          <!-- Time -->
          <UFormGroup label="Tijd" required>
            <div class="flex items-center justify-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <!-- Hours -->
              <div class="flex flex-col items-center">
                <UButton
                  icon="i-heroicons-chevron-up"
                  size="sm"
                  variant="ghost"
                  color="gray"
                  @click="adjustHour(1)"
                  class="mb-1"
                />
                <div class="text-2xl font-mono font-bold text-gray-900 w-12 text-center">
                  {{ currentHour.toString().padStart(2, '0') }}
                </div>
                <UButton
                  icon="i-heroicons-chevron-down"
                  size="sm"
                  variant="ghost"
                  color="gray"
                  @click="adjustHour(-1)"
                  class="mt-1"
                />
              </div>
              
              <!-- Separator -->
              <div class="text-2xl font-bold text-gray-900">:</div>
              
              <!-- Minutes -->
              <div class="flex flex-col items-center">
                <UButton
                  icon="i-heroicons-chevron-up"
                  size="sm"
                  variant="ghost"
                  color="gray"
                  @click="adjustMinute(1)"
                  class="mb-1"
                />
                <div class="text-2xl font-mono font-bold text-gray-900 w-12 text-center">
                  {{ currentMinute.toString().padStart(2, '0') }}
                </div>
                <UButton
                  icon="i-heroicons-chevron-down"
                  size="sm"
                  variant="ghost"
                  color="gray"
                  @click="adjustMinute(-1)"
                  class="mt-1"
                />
              </div>
            </div>
          </UFormGroup>

          <!-- Amount -->
          <UFormGroup label="Hoeveelheid (mL)" required>
            <UInput
              v-model.number="entryForm.amount"
              type="number"
              min="1"
              step="1"
              required
              placeholder="Bijv. 120"
            />
          </UFormGroup>

          <!-- Checkboxes -->
          <div class="flex flex-wrap gap-6">
            <UFormGroup>
              <UCheckbox
                v-model="entryForm.spitUp"
                label="Gespuugd"
              />
            </UFormGroup>
            <UFormGroup>
              <UCheckbox
                v-model="entryForm.urinated"
                label="Geplast"
              />
            </UFormGroup>
            <UFormGroup>
              <UCheckbox
                v-model="entryForm.defecated"
                label="Gepoept"
              />
            </UFormGroup>
          </div>

          <!-- Temperature -->
          <UFormGroup label="Temperatuur (°C)">
            <UInput
              v-model.number="entryForm.temperature"
              type="number"
              step="0.1"
              min="35"
              max="42"
              placeholder="Bijv. 37.2"
            />
          </UFormGroup>
        </form>

        <template #footer>
          <div class="flex justify-end space-x-2">
            <UButton
              color="gray"
              variant="ghost"
              label="Annuleren"
              @click="closeAddEntryModal"
            />
            <UButton
              label="Toevoegen"
              icon="i-heroicons-plus"
              :disabled="entryForm.amount <= 0"
              @click="handleAddEntry"
              class="font-bold"
            />
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Weight Update Modal -->
    <UModal
      v-model="isWeightModalOpen"
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
            <h3 class="text-base font-semibold leading-6 text-gray-900">
              Gewicht Bijwerken
            </h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark-20-solid"
              class="-my-1"
              @click="closeWeightModal"
            />
          </div>
        </template>

        <form @submit.prevent="handleUpdateWeight" class="space-y-4">
          <UFormGroup label="Gewicht (gram)" required>
            <UInput
              v-model.number="weightForm.weight"
              type="number"
              min="1000"
              max="20000"
              step="1"
              required
              placeholder="Bijv. 4500"
            />
          </UFormGroup>
          <p class="text-sm text-gray-500">
            Dagelijkse melkbehoefte wordt automatisch herberekend.
          </p>
        </form>

        <template #footer>
          <div class="flex justify-end space-x-2">
            <UButton
              color="gray"
              variant="ghost"
              label="Annuleren"
              @click="closeWeightModal"
            />
            <UButton
              label="Opslaan"
              icon="i-heroicons-check"
              :disabled="weightForm.weight <= 0"
              @click="handleUpdateWeight"
              class="font-bold"
            />
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Clear All Modal -->
    <UModal
      v-model="isClearModalOpen"
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
            <h3 class="text-base font-semibold leading-6 text-gray-900">
              Alle Gegevens Wissen
            </h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark-20-solid"
              class="-my-1"
              @click="isClearModalOpen = false"
            />
          </div>
        </template>

        <p>
          Weet je zeker dat je alle voedingsgegevens permanent wilt verwijderen?
          Deze actie kan niet ongedaan worden gemaakt.
        </p>

        <template #footer>
          <div class="flex justify-end space-x-2">
            <UButton
              color="gray"
              variant="ghost"
              label="Annuleren"
              @click="isClearModalOpen = false"
            />
            <UButton
              color="red"
              label="Alles verwijderen"
              icon="i-heroicons-trash"
              @click="handleClearAll"
            />
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>