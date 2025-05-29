import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref, computed } from 'vue';
import OnboardingModal from '../components/OnboardingModal.vue';

// Mock the useOnboardingSettings composable
let mockOnboardingState = {
  mode: 'overview' as 'overview' | 'cheapest',
  selectedSupermarketIds: [] as string[],
  hasCompletedOnboarding: false,
  showModal: true,
};

const mockOnboardingSettings = {
  mode: computed(() => mockOnboardingState.mode),
  selectedSupermarketIds: computed(
    () => mockOnboardingState.selectedSupermarketIds
  ),
  hasCompletedOnboarding: computed(
    () => mockOnboardingState.hasCompletedOnboarding
  ),
  onboardingState: computed(() => mockOnboardingState),
  setMode: vi.fn(),
  toggleSupermarket: vi.fn(),
  completeOnboarding: vi.fn(),
};

vi.mock('../composables/useOnboardingSettings', () => ({
  useOnboardingSettings: () => mockOnboardingSettings,
}));

describe('OnboardingModal.vue', () => {
  let wrapper: ReturnType<typeof mount>;

  const mountComponent = (props = {}) => {
    return mount(OnboardingModal, {
      props: {
        ...props,
      },
      global: {
        stubs: {
          UModal: {
            template: `
              <div class="u-modal">
                <slot />
              </div>
            `,
            props: ['modelValue', 'prevent-close', 'ui'],
            emits: ['update:modelValue'],
          },
          UCard: {
            template: `
              <div class="u-card">
                <slot name="header" />
                <slot />
                <slot name="footer" />
              </div>
            `,
          },
          UButton: {
            template: `
              <button class="u-button" :disabled="disabled" @click="$emit('click')">
                <slot>{{ label }}</slot>
              </button>
            `,
            props: ['disabled', 'label'],
            emits: ['click'],
          },
          URadioGroup: {
            template: `
              <fieldset class="u-radio-group">
                <legend>{{ legend }}</legend>
                <div v-for="(option, index) in options" :key="index">
                  <input 
                    type="radio" 
                    :checked="modelValue === option.value" 
                    @change="$emit('update:modelValue', option.value)" 
                  />
                  <label>{{ option.label }}</label>
                </div>
              </fieldset>
            `,
            props: ['modelValue', 'options', 'legend'],
            emits: ['update:modelValue'],
          },
          TransitionGroup: {
            template: '<div :class="class"><slot /></div>',
            props: ['tag', 'name', 'class', 'appear'],
          },
        },
      },
    });
  };

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    mockOnboardingState = {
      mode: 'overview',
      selectedSupermarketIds: [],
      hasCompletedOnboarding: false,
      showModal: true,
    };
  });

  it('renders the welcome message and introduction', () => {
    wrapper = mountComponent();
    console.log('Wrapper HTML:', wrapper.html());
    console.log('Wrapper text:', wrapper.text());
    console.log('Mock onboarding state:', mockOnboardingState);
    expect(wrapper.text()).toContain(
      'Welkom bij De Burgerlijke App!'
    );
    expect(wrapper.text()).toContain(
      'Hoe wil jij de goedkoopste boodschappen te zien krijgen?'
    );
  });

  it('renders the mode selection radio group', () => {
    wrapper = mountComponent();
    const radioGroup = wrapper.find('.u-radio-group');
    expect(radioGroup.exists()).toBe(true);
    const radios = radioGroup.findAll('input[type="radio"]');
    expect(radios).toHaveLength(2);
  });

  it('shows supermarket selection when overview mode is selected', () => {
    mockOnboardingState.mode = 'overview';
    wrapper = mountComponent();

    expect(wrapper.text()).toContain(
      'Selecteer hieronder de supermarkten'
    );
    const supermarketButtons = wrapper.findAll('button.u-button');
    expect(supermarketButtons.length).toBeGreaterThan(0);
  });

  it('hides supermarket selection when cheapest mode is selected', () => {
    mockOnboardingState.mode = 'cheapest';
    wrapper = mountComponent();

    expect(wrapper.text()).toContain(
      'Je hebt gekozen voor de goedkoopste boodschappenlijst'
    );
    expect(wrapper.text()).toContain(
      'Alle supermarkten worden meegenomen'
    );
  });

  it('calls toggleSupermarket when a supermarket button is clicked', async () => {
    mockOnboardingState.mode = 'overview';
    wrapper = mountComponent();

    const supermarketButtons = wrapper.findAll('button.u-button');
    const firstSupermarketButton = supermarketButtons.find((btn) =>
      btn.text().includes('Albert Heijn')
    );

    if (firstSupermarketButton) {
      await firstSupermarketButton.trigger('click');
      expect(
        mockOnboardingSettings.toggleSupermarket
      ).toHaveBeenCalledWith('ah');
    }
  });

  it('disables the confirm button when overview mode is selected and no supermarkets are chosen', () => {
    mockOnboardingState.mode = 'overview';
    mockOnboardingState.selectedSupermarketIds = [];
    wrapper = mountComponent();

    const confirmButton = wrapper
      .findAll('button')
      .find((btn) => btn.text().includes('Bevestigen'));
    expect(confirmButton?.attributes('disabled')).toBeDefined();
  });

  it('enables the confirm button when overview mode is selected and supermarkets are chosen', () => {
    mockOnboardingState.mode = 'overview';
    mockOnboardingState.selectedSupermarketIds = ['ah', 'jumbo'];
    wrapper = mountComponent();

    const confirmButton = wrapper
      .findAll('button')
      .find((btn) => btn.text().includes('Bevestigen'));
    expect(confirmButton?.attributes('disabled')).toBeUndefined();
  });

  it('calls completeOnboarding when confirm button is clicked', async () => {
    mockOnboardingState.mode = 'overview';
    mockOnboardingState.selectedSupermarketIds = ['ah'];
    wrapper = mountComponent();

    const confirmButton = wrapper
      .findAll('button')
      .find((btn) => btn.text().includes('Bevestigen'));

    if (confirmButton) {
      await confirmButton.trigger('click');
      expect(
        mockOnboardingSettings.completeOnboarding
      ).toHaveBeenCalledWith('overview', ['ah']);
    }
  });
});
