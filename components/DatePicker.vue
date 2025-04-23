<script setup lang="ts">
import { DatePicker as VCalendarDatePicker } from 'v-calendar';
import { nl } from 'date-fns/locale'; // Import Dutch locale
// @ts-ignore
import type {
  DatePickerDate,
  DatePickerRangeObject,
} from 'v-calendar/dist/types/src/use/datePicker';
import 'v-calendar/dist/style.css';
import type { PropType } from 'vue'; // Import PropType

defineOptions({
  inheritAttrs: false,
});

const props = defineProps({
  modelValue: {
    type: [Date, Object] as PropType<
      DatePickerDate | DatePickerRangeObject | null
    >,
    default: null,
  },
  mode: {
    type: String as PropType<'date' | 'dateTime' | 'time'>,
    default: 'dateTime', // Default back to dateTime
  },
  is24hr: {
    type: Boolean,
    default: true, // Default back to true
  },
});

const emit = defineEmits(['update:model-value', 'close']);

const date = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:model-value', value);
    emit('close');
  },
});

const attrs = {
  transparent: true,
  borderless: true,
  color: 'primary',
  // 'is-dark': { selector: 'html', darkClass: 'dark' }, // Remove dark mode handling
  'first-day-of-week': 2, // Set Monday as the first day of the week
  locale: nl, // Add Dutch locale
};

function onDayClick(_: any, event: MouseEvent): void {
  const target = event.target as HTMLElement;
  target.blur();
}
</script>

<template>
  <VCalendarDatePicker
    v-if="
      date &&
      (date as DatePickerRangeObject)?.start &&
      (date as DatePickerRangeObject)?.end
    "
    v-model.range="date"
    :columns="2"
    v-bind="{ ...attrs, ...$attrs }"
    :mode="props.mode"
    :is24hr="props.is24hr"
    @dayclick="onDayClick"
    :locale="nl"
  />
  <VCalendarDatePicker
    v-else
    v-model="date"
    v-bind="{ ...attrs, ...$attrs }"
    :mode="props.mode"
    :is24hr="props.is24hr"
    @dayclick="onDayClick"
    :locale="nl"
  />
</template>

<style>
:root {
  --vc-gray-50: rgb(var(--color-gray-50));
  --vc-gray-100: rgb(var(--color-gray-100));
  --vc-gray-200: rgb(var(--color-gray-200));
  --vc-gray-300: rgb(var(--color-gray-300));
  --vc-gray-400: rgb(var(--color-gray-400));
  --vc-gray-500: rgb(var(--color-gray-500));
  --vc-gray-600: rgb(var(--color-gray-600));
  --vc-gray-700: rgb(var(--color-gray-700));
  --vc-gray-800: rgb(var(--color-gray-800));
  --vc-gray-900: rgb(var(--color-gray-900));
}

.vc-primary {
  --vc-accent-50: rgb(var(--color-primary-50));
  --vc-accent-100: rgb(var(--color-primary-100));
  --vc-accent-200: rgb(var(--color-primary-200));
  --vc-accent-300: rgb(var(--color-primary-300));
  --vc-accent-400: rgb(var(--color-primary-400));
  --vc-accent-500: rgb(var(--color-primary-500));
  --vc-accent-600: rgb(var(--color-primary-600));
  --vc-accent-700: rgb(var(--color-primary-700));
  --vc-accent-800: rgb(var(--color-primary-800));
  --vc-accent-900: rgb(var(--color-primary-900));
}
</style>
