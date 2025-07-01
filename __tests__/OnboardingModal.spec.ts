import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import OnboardingModal from '@/components/OnboardingModal.vue'; // Component doesn't exist yet

// --- Mock Nuxt UI Components ---
vi.mock('#app', () => ({
  useState: vi.fn((key, init) => ({ value: init() })),
  useNuxtApp: vi.fn(() => ({})),
}));

// --- Mock Supermarkets Data ---
const mockSupermarkets = [
  { id: 'ah', name: 'Albert Heijn' },
  { id: 'jumbo', name: 'Jumbo' },
  { id: 'plus', name: 'PLUS' },
  { id: 'dirk', name: 'Dirk' },
];

describe('OnboardingModal.vue', () => {
  let wrapper: ReturnType<typeof mount>;

  const mountComponent = (props = {}) => {
    return mount(OnboardingModal, {
      props: {
        modelValue: true, // Assume modal is open by default for testing
        supermarkets: mockSupermarkets,
        ...props,
      },
      global: {
        stubs: {
          UModal: {
            template:
              '<div><slot name="header"></slot><slot></slot><slot name="footer"></slot></div>', // Simple stub
            props: ['modelValue'],
          },
          UCard: {
            template:
              '<div><slot name="header"></slot><slot></slot><slot name="footer"></slot></div>', // Simple stub
          },
          UCheckboxGroup: {
            template: '<div><slot></slot></div>', // Simplified stub
            props: [
              'modelValue',
              'options',
              'valueAttribute',
              'labelAttribute',
            ],
            emits: ['update:modelValue'], // Ensure we can track changes
          },
          UButton: {
            template: '<button><slot></slot></button>',
            props: ['label', 'disabled'],
          },
        },
      },
    });
  };

  beforeEach(() => {
    wrapper = mountComponent();
  });

  it('renders the welcome message and introduction', () => {
    expect(wrapper.text()).toContain('Welkom!');
    expect(wrapper.text()).toContain(
      'Selecteer hieronder de supermarkten waar je boodschappen wilt vergelijken.'
    );
  });

  it('renders the list of supermarkets with checkboxes', () => {
    // Assuming UCheckboxGroup is correctly stubbed and receives options
    const checkboxGroup = wrapper.findComponent({
      name: 'UCheckboxGroup',
    });
    expect(checkboxGroup.exists()).toBe(true);
    // Check if the options passed to the stub match our mock data
    expect(checkboxGroup.props('options')).toEqual(mockSupermarkets);
    expect(checkboxGroup.props('valueAttribute')).toBe('id');
    expect(checkboxGroup.props('labelAttribute')).toBe('name');
  });

  it('allows selecting supermarkets', async () => {
    const checkboxGroup = wrapper.findComponent({
      name: 'UCheckboxGroup',
    });

    // Simulate selecting 'Albert Heijn' and 'Jumbo'
    // The stub needs to emit 'update:modelValue' for this to work
    await checkboxGroup.vm.$emit('update:modelValue', [
      'ah',
      'jumbo',
    ]);

    // Verify the internal state (if accessible) or emitted event later
    // For now, just check the emit happened
    expect(checkboxGroup.emitted('update:modelValue')).toBeTruthy();
    expect(checkboxGroup.emitted('update:modelValue')![0]).toEqual([
      ['ah', 'jumbo'],
    ]);
  });

  it('disables the confirm button if no supermarkets are selected', async () => {
    const checkboxGroup = wrapper.findComponent({
      name: 'UCheckboxGroup',
    });
    await checkboxGroup.vm.$emit('update:modelValue', []); // Deselect all

    const confirmButton = wrapper
      .findAll('button')
      .find((btn) => btn.text() === 'Bevestigen');
    expect(confirmButton?.attributes('disabled')).toBeDefined();
  });

  it('enables the confirm button if at least one supermarket is selected', async () => {
    const checkboxGroup = wrapper.findComponent({
      name: 'UCheckboxGroup',
    });
    await checkboxGroup.vm.$emit('update:modelValue', ['ah']); // Select one

    const confirmButton = wrapper
      .findAll('button')
      .find((btn) => btn.text() === 'Bevestigen');
    expect(confirmButton?.attributes('disabled')).toBeUndefined();
  });

  it('emits "update:modelValue" with false and "confirm" with selected supermarkets on button click', async () => {
    const checkboxGroup = wrapper.findComponent({
      name: 'UCheckboxGroup',
    });
    const selectedIds = ['ah', 'plus'];
    await checkboxGroup.vm.$emit('update:modelValue', selectedIds); // Select some supermarkets

    const confirmButton = wrapper
      .findAll('button')
      .find((btn) => btn.text() === 'Bevestigen');
    await confirmButton?.trigger('click');

    // Check emitted events from the OnboardingModal itself
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([false]); // Should emit false to close modal

    expect(wrapper.emitted('confirm')).toBeTruthy();
    expect(wrapper.emitted('confirm')![0]).toEqual([selectedIds]); // Should emit selected IDs
  });
});
