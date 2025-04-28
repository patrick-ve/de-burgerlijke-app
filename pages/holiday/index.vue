<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import {
  useHoliday,
  type HolidayCategoryName,
  type HolidayCategoryDefinition,
} from '~/composables/useHoliday';
import { useHeaderState } from '~/composables/useHeaderState';

const {
  items,
  groupedItems,
  sortedCategoryNames,
  addHolidayItem,
  toggleHolidayItem,
  deleteHolidayItem,
  holidayCategories,
  getCategoryDefinition,
  categoryNames,
} = useHoliday();
const { headerState, setHeader } = useHeaderState();
const router = useRouter();

const isMounted = ref(false);
const isAddItemModalOpen = ref(false);
const newItemText = ref('');
const newItemCategory = ref<HolidayCategoryName>(categoryNames[0]);

const handleAddItem = () => {
  addHolidayItem(newItemText.value, newItemCategory.value);
  newItemText.value = '';
  newItemCategory.value = categoryNames[0];
  isAddItemModalOpen.value = false;
};

// Header setup
onMounted(async () => {
  await nextTick();
  isMounted.value = true;
  setHeader({
    title: 'Paklijst vakantie',
    showLeftAction: true,
    showRightAction: false,
    leftActionHandler: () => router.push('/'),
  });
});

useHead({ title: 'Paklijst vakantie' });
</script>

<template>
  <div class="pb-24">
    <UContainer class="py-4">
      <div v-if="items.length > 0" class="space-y-6">
        <div
          v-for="categoryName in sortedCategoryNames"
          :key="categoryName"
        >
          <template
            v-if="
              getCategoryDefinition(
                categoryName
              ) as HolidayCategoryDefinition
            "
          >
            <h2
              class="text-lg font-medium mb-3 px-1 capitalize flex items-center gap-2"
            >
              <span>{{
                getCategoryDefinition(categoryName)?.emoji
              }}</span>
              <span>{{ categoryName }}</span>
            </h2>
            <ul class="space-y-2">
              <li
                v-for="item in groupedItems[categoryName]"
                :key="item.id"
                class="flex items-center justify-between px-2 py-1 bg-white border border-gray-200 rounded-md shadow-sm transition-opacity"
                :class="{ 'opacity-60': item.checked }"
              >
                <div class="flex items-center flex-grow mr-2 min-w-0">
                  <UCheckbox
                    :model-value="item.checked"
                    @update:model-value="toggleHolidayItem(item.id)"
                    class="mr-3 flex-shrink-0"
                    :ui="{
                      wrapper: 'relative flex items-start',
                      label: 'min-w-0 flex-1 text-sm font-medium',
                      base: 'h-5 w-5',
                    }"
                  />
                  <span
                    class="text-gray-800 truncate text-sm"
                    :class="{
                      'line-through text-gray-500': item.checked,
                    }"
                  >
                    {{ item.text }}
                  </span>
                </div>
                <UButton
                  icon="i-heroicons-trash"
                  size="sm"
                  color="red"
                  variant="ghost"
                  @click="deleteHolidayItem(item.id)"
                  aria-label="Verwijder item"
                  class="flex-shrink-0"
                />
              </li>
            </ul>
          </template>
        </div>
      </div>
      <div v-else class="text-center text-gray-500 py-8 px-4">
        <p>Je checklist is nog leeg. Voeg items toe!</p>
      </div>
    </UContainer>

    <div
      class="fixed bottom-0 left-0 right-0 z-10 p-4 bg-white border-t border-gray-200"
    >
      <UButton
        block
        size="lg"
        label="Item toevoegen"
        @click="isAddItemModalOpen = true"
        class="font-bold max-w-md mx-auto"
      />
    </div>

    <UModal
      v-model="isAddItemModalOpen"
      :ui="{
        overlay: {
          background: 'bg-black/40 backdrop-blur-sm',
        },
      }"
    >
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3
              class="text-base font-semibold leading-6 text-gray-900"
            >
              Nieuw item toevoegen
            </h3>

            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark-20-solid"
              class="-my-1"
              @click="isAddItemModalOpen = false"
            />
          </div>
        </template>

        <div class="space-y-4">
          <UFormGroup label="Item beschrijving" required>
            <UInput
              v-model="newItemText"
              placeholder="bv. Zonnebrandcrème"
              autofocus
            />
          </UFormGroup>
          <UFormGroup label="Categorie" required>
            <USelectMenu
              v-model="newItemCategory"
              :options="categoryNames"
              placeholder="Selecteer categorie"
            />
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-end space-x-2">
            <UButton
              color="gray"
              variant="ghost"
              label="Annuleren"
              @click="isAddItemModalOpen = false"
            />
            <UButton
              label="Toevoegen"
              class="font-bold"
              @click="handleAddItem"
              :disabled="!newItemText.trim()"
            />
          </div>
        </template>
      </UCard>
    </UModal>

    <Teleport to="#header-left-action" v-if="isMounted">
      <UButton
        v-if="
          headerState.showLeftAction && headerState.leftActionHandler
        "
        icon="i-heroicons-arrow-left"
        variant="ghost"
        color="gray"
        aria-label="Terug"
        @click="headerState.leftActionHandler"
      />
    </Teleport>
  </div>
</template>

<style scoped>
.capitalize {
  text-transform: capitalize;
}
</style>
