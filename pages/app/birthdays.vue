<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { useBirthdays } from '~/composables/useBirthdays';
import type { Birthday } from '~/composables/useBirthdays';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale'; // Import Dutch locale if needed

const { sortedBirthdays, addBirthday, deleteBirthday } =
  useBirthdays();
const router = useRouter();

// Add Birthday Modal State
const isAddModalOpen = ref(false);
const newBirthdayName = ref('');
const currentMonth = new Date().getMonth(); // 0-indexed
const currentDay = new Date().getDate();
const newBirthdayMonth = ref<number>(currentMonth); // Month (0-11)
const newBirthdayDay = ref<number>(currentDay); // Day (1-31)
const newBirthdayYear = ref<number | null>(null); // Optional Year

// Computed property to handle v-model for the year input (accepts null, outputs undefined or number)
const newBirthdayYearInput = computed({
  get: () => newBirthdayYear.value ?? undefined,
  set: (val) => {
    // v-model.number provides number or undefined if input is cleared/invalid
    newBirthdayYear.value = val === undefined ? null : val;
  },
});

// Month options for the select dropdown
const monthOptions = computed(() => {
  return Array.from({ length: 12 }, (_, i) => ({
    label: format(new Date(0, i), 'MMMM', { locale: nl }),
    value: i,
  }));
});

// --- Modal Actions ---
const openAddModal = () => {
  newBirthdayName.value = ''; // Reset form
  const now = new Date();
  newBirthdayMonth.value = now.getMonth();
  newBirthdayDay.value = now.getDate();
  newBirthdayYear.value = null; // Reset year
  isAddModalOpen.value = true;
};

const closeAddModal = () => {
  isAddModalOpen.value = false;
};

const saveNewBirthday = () => {
  const name = newBirthdayName.value.trim();
  const month = newBirthdayMonth.value; // 0-11
  const day = newBirthdayDay.value;
  const year = newBirthdayYear.value; // Optional year

  if (name && month >= 0 && month <= 11 && day >= 1 && day <= 31) {
    const currentYear = new Date().getFullYear();

    // Validate day for the selected month
    const daysInMonth = new Date(currentYear, month + 1, 0).getDate();
    if (day > daysInMonth) {
      console.warn(`Invalid day (${day}) for selected month.`);
      // Add user feedback here, e.g., using a toast notification
      return;
    }

    // Validate year (basic range check)
    if (year && (year < 1900 || year > currentYear)) {
      console.warn(
        `Invalid year provided: ${year}. Year must be between 1900 and ${currentYear}.`
      );
      // Add user feedback here
      return; // Prevent saving with invalid year
    }

    // Use current year for the date object if no year provided for consistency
    const birthdayDate = new Date(year ?? currentYear, month, day);

    addBirthday(name, birthdayDate, year); // Pass year to composable
    closeAddModal();
    newBirthdayYear.value = null; // Reset year after saving
  } else {
    console.warn('Invalid name, month, or day for new birthday.');
    // Add user feedback here
  }
};

// --- Formatting ---
const formatDate = (date: Date): string => {
  try {
    // Format as "15 mei" (Day Month)
    return format(new Date(date), 'd MMMM', { locale: nl });
  } catch (error) {
    console.error('Error formatting date:', error, date);
    return 'Invalid Date'; // Fallback for invalid dates
  }
};

// --- Age Calculation --- (Moved outside formatDate)
const calculateUpcomingAge = (birthday: Birthday): number | null => {
  if (!birthday.birthYear) return null;

  const today = new Date();
  const birthDateThisYear = new Date(birthday.date);
  birthDateThisYear.setFullYear(today.getFullYear());

  let nextBirthdayYear = today.getFullYear();

  // Check if the birthday has already passed this calendar year
  // Compare month and day, ignoring time
  const todayMonthDay = today.getMonth() * 100 + today.getDate(); // e.g., Jan 1st = 1, Dec 31st = 1131
  const birthdayMonthDay =
    birthDateThisYear.getMonth() * 100 + birthDateThisYear.getDate();

  if (birthdayMonthDay < todayMonthDay) {
    nextBirthdayYear++; // If passed, the next birthday is next year
  }

  // Calculate age at the next birthday
  const age = nextBirthdayYear - birthday.birthYear;

  return age > 0 ? age : null; // Return null if age is 0 or negative (unlikely but safe)
};

// --- Lifecycle Hooks ---
onMounted(async () => {
  await nextTick();
});

useHead({ title: 'Verjaardagen' }); // Set page title
</script>

<template>
  <TheHeader title="Verjaardagen">
    <template #left-action>
      <UButton
        icon="i-heroicons-arrow-left"
        variant="ghost"
        color="gray"
        aria-label="Back"
        @click="router.push('/app')"
      />
    </template>
  </TheHeader>

  <div class="pb-24 pt-4 max-w-7xl mx-auto">
    <!-- Birthday List -->
    <div v-if="sortedBirthdays.length > 0" class="px-4">
      <TransitionGroup
        tag="ul"
        name="list"
        class="space-y-2 relative"
      >
        <li
          v-for="birthday in sortedBirthdays"
          :key="birthday.id"
          class="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md shadow-sm"
        >
          <div class="flex-grow mr-2">
            <span class="text-gray-800 font-medium"
              >{{ birthday.name }}
              <span v-if="birthday.birthYear"
                >({{ calculateUpcomingAge(birthday) }} jaar)</span
              ></span
            >
            <p class="text-sm text-gray-600">
              {{ formatDate(birthday.date) }}
              <span
                v-if="calculateUpcomingAge(birthday)"
                class="text-gray-500"
              >
              </span>
            </p>
          </div>
          <!-- Delete Button -->
          <UButton
            icon="i-heroicons-trash"
            size="sm"
            color="red"
            variant="ghost"
            @click="deleteBirthday(birthday.id)"
            aria-label="Delete Birthday"
          />
        </li>
      </TransitionGroup>
    </div>

    <!-- No Birthdays Message -->
    <div
      v-if="sortedBirthdays.length === 0"
      class="text-center text-gray-500 py-12 px-4"
    >
      <UIcon
        name="i-heroicons-cake"
        class="w-12 h-12 mx-auto text-gray-400 mb-3"
      />
      <p>Nog geen verjaardagen toegevoegd.</p>
      <UButton
        label="Voeg eerste verjaardag toe"
        @click="openAddModal"
        class="mt-4"
        icon="i-heroicons-plus-circle"
      />
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
      >
        <div class="flex justify-center max-w-md mx-auto">
          <UButton
            label="Verjaardag toevoegen"
            size="lg"
            @click="openAddModal"
            class="w-full justify-center font-bold"
          />
        </div>
      </div>
    </Transition>

    <!-- Add Birthday Modal -->
    <UModal
      v-model="isAddModalOpen"
      :ui="{
        overlay: { background: 'bg-black/40 backdrop-blur-sm' },
      }"
    >
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3
              class="text-base font-semibold leading-6 text-gray-900"
            >
              Verjaardag toevoegen
            </h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark-20-solid"
              class="-my-1"
              @click="closeAddModal"
            />
          </div>
        </template>

        <form @submit.prevent="saveNewBirthday" class="space-y-4">
          <UFormGroup label="Naam" name="name" required>
            <UInput
              v-model="newBirthdayName"
              placeholder="Naam van de jarige"
              autofocus
            />
          </UFormGroup>

          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Dag" name="day" required>
              <UInput
                v-model.number="newBirthdayDay"
                type="number"
                placeholder="Dag"
                min="1"
                max="31"
              />
            </UFormGroup>
            <UFormGroup label="Maand" name="month" required>
              <USelectMenu
                v-model.number="newBirthdayMonth"
                :options="monthOptions"
                placeholder="Selecteer maand"
                value-attribute="value"
                option-attribute="label"
              />
            </UFormGroup>
          </div>

          <UFormGroup label="Geboortejaar (optioneel)" name="year">
            <UInput
              v-model.number="newBirthdayYearInput"
              type="number"
              placeholder="Jaar (bv. 1990)"
              :min="1900"
              :max="new Date().getFullYear()"
            />
          </UFormGroup>

          <!-- Optional: Display selected date for confirmation -->
          <p
            v-if="
              newBirthdayDay &&
              newBirthdayMonth !== null &&
              newBirthdayDay >= 1 &&
              newBirthdayDay <= 31
            "
            class="text-sm text-gray-500 mt-1"
          >
            Geselecteerd: {{ newBirthdayDay }}
            {{
              monthOptions.find((m) => m.value === newBirthdayMonth)
                ?.label
            }}
          </p>
          <p v-else class="text-sm text-red-500 mt-1">
            Selecteer geldige maand en dag (1-31).
          </p>
        </form>

        <template #footer>
          <div class="flex justify-end space-x-2">
            <UButton
              color="gray"
              variant="ghost"
              label="Annuleren"
              @click="closeAddModal"
            />
            <UButton
              type="submit"
              label="Opslaan"
              icon="i-heroicons-check"
              :disabled="
                !newBirthdayName.trim() ||
                newBirthdayMonth === null ||
                !newBirthdayDay ||
                newBirthdayDay < 1 ||
                newBirthdayDay > 31
              "
              @click="saveNewBirthday"
              class="font-bold"
            />
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<style scoped>
/* List transition animations (same as to-do) */
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
  ); /* Adjust based on padding (px-4 on parent) */
}
</style>
