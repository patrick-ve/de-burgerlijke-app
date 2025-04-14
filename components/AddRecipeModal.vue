<script setup lang="ts">
const isOpen = defineModel<boolean>('isOpen', { required: true });

const url = ref('');
const isLoading = ref(false);
const error = ref<string | null>(null);

async function submitRecipeUrl() {
  if (!url.value) {
    error.value = 'Voer een URL in.';
    return;
  }
  isLoading.value = true;
  error.value = null;
  try {
    // Placeholder for the actual API call logic
    // For now, just simulate a delay and log
    console.log('Submitting URL:', url.value);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay

    // TODO: Implement actual POST request to /api/recipe
    // const response = await $fetch('/api/recipe', {
    //   method: 'POST',
    //   body: { url: url.value },
    // })
    // console.log('API Response:', response)

    // Close the modal on success
    isOpen.value = false;
    url.value = ''; // Reset URL input
  } catch (err) {
    console.error('Error submitting URL:', err);
    error.value = 'URL versturen mislukt. Probeer het opnieuw.'; // Provide user feedback
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <UModal
    v-model="isOpen"
    :ui="{
      overlay: {
        background: 'bg-black/40 backdrop-blur-sm',
      },
    }"
  >
    <UCard
      :ui="{
        ring: '',
        divide: 'divide-y divide-gray-100 dark:divide-gray-800',
      }"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <h3
            class="text-base font-semibold leading-6 text-gray-900 dark:text-white"
          >
            Recept toevoegen via website
          </h3>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark-20-solid"
            class="-my-1"
            @click="isOpen = false"
          />
        </div>
      </template>

      <UFormGroup label="Recept URL" name="url" class="mb-4">
        <UInput
          v-model="url"
          placeholder="www.ah.nl/recepten/spaghetti-bolognese"
          icon="i-heroicons-link"
          :disabled="isLoading"
        />
      </UFormGroup>

      <UAlert
        v-if="error"
        icon="i-heroicons-exclamation-triangle"
        color="red"
        variant="soft"
        :title="error"
        class="mb-4"
      />

      <template #footer>
        <div class="flex justify-end space-x-2">
          <UButton
            color="gray"
            variant="ghost"
            @click="isOpen = false"
            :disabled="isLoading"
          >
            Annuleren
          </UButton>
          <UButton
            @click="submitRecipeUrl"
            :loading="isLoading"
            :disabled="isLoading"
          >
            Versturen
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>
