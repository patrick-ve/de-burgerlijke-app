/* eslint-disable */
import '@testing-library/jest-dom/vitest';
import { config } from '@vue/test-utils';
import { h, ref } from 'vue';
import { vi } from 'vitest';

// Mock Nuxt runtime config
(global as any).useRuntimeConfig = () => ({
  app: {
    baseURL: '/',
    buildAssetsDir: '/_nuxt/',
    cdnURL: '',
  },
});

// Enhanced Mock Nuxt app config
(global as any).useAppConfig = () => ({
  ui: {
    primary: 'brand',
    gray: 'cool',
    tailwindMerge: {
      enabled: true,
      config: {},
    },
    colors: ['brand'],
    global: {
      disableAutoImports: false,
    },
  },
});

// Mock appConfig globally for Nuxt UI with proper structure
(global as any).appConfig = {
  ui: {
    primary: 'brand',
    gray: 'cool',
    tailwindMerge: {
      enabled: true,
      config: {},
    },
    colors: ['brand'],
    global: {
      disableAutoImports: false,
    },
  },
};

// Mock Nuxt composables
(global as any).useState = (key: string, init?: any) => {
  const state = ref(typeof init === 'function' ? init() : init);
  return state;
};

// Fix the useNuxtApp mock to include callHook
(global as any).useNuxtApp = () => ({
  $router: {
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    currentRoute: {
      value: {
        path: '/',
        name: 'index',
        params: {},
        query: {},
      },
    },
  },
  callHook: vi.fn().mockResolvedValue(undefined),
  hooks: {
    hook: vi.fn(),
    hookOnce: vi.fn(),
    callHook: vi.fn().mockResolvedValue(undefined),
  },
  ssrContext: {},
  payload: {
    data: {},
    state: {},
  },
  isHydrating: false,
});

// Mock useRouter
(global as any).useRouter = () => ({
  push: vi.fn(),
  replace: vi.fn(),
  go: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  currentRoute: {
    value: {
      path: '/',
      name: 'index',
      params: {},
      query: {},
    },
  },
  afterEach: vi.fn(),
});

// Mock useRoute
(global as any).useRoute = () => ({
  path: '/',
  name: 'index',
  params: {},
  query: {},
});

// Stub NuxtLink
config.global.stubs.NuxtLink = {
  props: ['to'],
  setup(props: any, { slots }: any) {
    // Render a simple anchor tag or a span, passing the 'to' prop as href or data attribute
    // and rendering the default slot content.
    return () =>
      h(
        'a',
        { href: props.to || '#' },
        slots.default ? slots.default() : []
      );
  },
};

// Stub NuxtImage
config.global.stubs.NuxtImg = {
  // Use NuxtImg as that's the likely component name used internally or via auto-import
  props: [
    'src',
    'alt',
    'class',
    'width',
    'height',
    'fit',
    'format',
    'loading',
  ],
  setup(props: any) {
    // Render a simple img tag with src and alt attributes and class
    return () =>
      h('img', {
        src: props.src || '',
        alt: props.alt || '',
        class: `mock-nuxt-img ${props.class || ''}`,
      });
  },
};

// Stub NuxtPicture (just in case it's used)
config.global.stubs.NuxtPicture = {
  props: ['src', 'alt'],
  setup(props: any) {
    // Render a simple img tag, similar to NuxtImg stub
    return () =>
      h('img', { src: props.src || '', alt: props.alt || '' });
  },
};

// Stub Nuxt UI components
config.global.stubs.UModal = {
  props: ['modelValue', 'prevent-close', 'ui'],
  setup(props: any, { slots }: any) {
    // Only render content when modelValue is true
    return () =>
      props.modelValue
        ? h('div', { class: 'u-modal' }, [slots.default?.()])
        : null;
  },
};

config.global.stubs.UCard = {
  props: ['ui'],
  setup(props: any, { slots }: any) {
    return () =>
      h('div', { class: 'u-card' }, [
        slots.header?.(),
        slots.default?.(),
        slots.footer?.(),
      ]);
  },
};

config.global.stubs.UButton = {
  props: [
    'label',
    'disabled',
    'variant',
    'style',
    'icon',
    'size',
    'color',
    'square',
    'class',
    'ariaLabel',
    'block',
  ],
  emits: ['click'],
  setup(props: any, { slots, emit }: any) {
    const attrs: any = {
      class: `u-button ${props.class || ''}`,
      onClick: (e: any) => emit('click', e),
      'aria-label': props.ariaLabel,
    };

    // Only add disabled attribute if it's actually disabled
    if (props.disabled) {
      attrs.disabled = true;
    }

    return () =>
      h('button', attrs, [slots.default?.() || props.label]);
  },
};

config.global.stubs.UIcon = {
  props: ['name', 'class'],
  setup(props: any) {
    return () =>
      h('span', {
        class: `u-icon ${props.name} ${props.class || ''}`,
      });
  },
};

config.global.stubs.UCheckbox = {
  name: 'UCheckbox',
  props: ['modelValue', 'ariaLabel', 'ui', 'id', 'label'],
  emits: ['update:modelValue'],
  setup(props: any, { emit }: any) {
    return () =>
      h('input', {
        type: 'checkbox',
        id: props.id,
        checked: props.modelValue,
        'aria-label': props.ariaLabel,
        onChange: (e: any) =>
          emit('update:modelValue', e.target.checked),
      });
  },
};

config.global.stubs.URadioGroup = {
  name: 'URadioGroup',
  props: ['modelValue', 'options', 'legend', 'ui'],
  emits: ['update:modelValue'],
  setup(props: any, { emit }: any) {
    return () =>
      h('fieldset', { class: 'u-radio-group' }, [
        h('legend', props.legend),
        ...(props.options || []).map((option: any, index: number) =>
          h('div', { key: index }, [
            h('input', {
              type: 'radio',
              checked: props.modelValue === option.value,
              onChange: () => emit('update:modelValue', option.value),
            }),
            h('label', option.label),
          ])
        ),
      ]);
  },
};

config.global.stubs.UCheckboxGroup = {
  props: [
    'modelValue',
    'options',
    'valueAttribute',
    'labelAttribute',
  ],
  emits: ['update:modelValue'],
  setup(props: any, { emit }: any) {
    return () =>
      h(
        'div',
        { class: 'u-checkbox-group' },
        (props.options || []).map((option: any, index: number) =>
          h('div', { key: index }, [
            h('input', {
              type: 'checkbox',
              checked: props.modelValue?.includes(
                option[props.valueAttribute || 'value']
              ),
              onChange: (e: any) => {
                const value = option[props.valueAttribute || 'value'];
                const current = props.modelValue || [];
                const updated = e.target.checked
                  ? [...current, value]
                  : current.filter((v: any) => v !== value);
                emit('update:modelValue', updated);
              },
            }),
            h('label', option[props.labelAttribute || 'label']),
          ])
        )
      );
  },
};

// Add stub for TransitionGroup
config.global.stubs.TransitionGroup = {
  props: ['tag', 'name', 'class', 'appear'],
  setup(props: any, { slots }: any) {
    const tag = props.tag || 'div';
    return () => h(tag, { class: props.class }, slots.default?.());
  },
};

// Add stub for USkeleton
config.global.stubs.USkeleton = {
  props: ['class'],
  setup(props: any) {
    return () =>
      h('div', { class: `u-skeleton ${props.class || ''}` });
  },
};

// Add stub for USlideover
config.global.stubs.USlideover = {
  props: ['modelValue', 'side', 'ui', 'prevent-close'],
  setup(props: any, { slots }: any) {
    return () =>
      props.modelValue
        ? h('div', { class: 'u-slideover' }, [slots.default?.()])
        : null;
  },
};
