<script setup lang="ts">
const portions = defineModel<number>('modelValue', {
  required: true,
  default: 1,
});

const incrementPortions = () => {
  portions.value++;
};

const decrementPortions = () => {
  if (portions.value > 1) {
    portions.value--;
  }
};

const onPortionInput = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const value = parseInt(input.value, 10);
  if (!isNaN(value) && value > 0) {
    portions.value = value;
  } else {
    // Reset to current value if input is invalid or cleared
    input.value = portions.value.toString();
  }
};

// Ensure input reflects external changes if needed (though defineModel handles most cases)
watch(portions, (newValue) => {
  const inputElement = document.getElementById(
    'portion-input-' + getCurrentInstance()?.uid
  ) as HTMLInputElement | null;
  if (inputElement && parseInt(inputElement.value, 10) !== newValue) {
    inputElement.value = newValue.toString();
  }
});
</script>

<template>
  <div class="flex items-center justify-center gap-0">
    <UButton
      icon="i-heroicons-minus-small"
      size="sm"
      color="primary"
      square
      variant="outline"
      @click="decrementPortions"
      :disabled="portions <= 1"
      aria-label="Verlaag porties"
      data-testid="decrement-portions-button"
    />
    <input
      :id="'portion-input-' + getCurrentInstance()?.uid"
      type="number"
      :value="portions"
      @input="onPortionInput"
      min="1"
      class="w-8 text-center text-base text-gray-900 font-bold border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 p-1"
      aria-label="Aantal porties"
      data-testid="portions-input"
    />
    <UButton
      icon="i-heroicons-plus-small"
      size="sm"
      color="primary"
      square
      variant="outline"
      @click="incrementPortions"
      aria-label="Verhoog porties"
      data-testid="increment-portions-button"
    />
    <span
      class="text-sm text-gray-600 w-14 text-left ml-2 font-medium"
    >
      {{ portions === 1 ? 'portie' : 'porties' }}
    </span>
  </div>
</template>
