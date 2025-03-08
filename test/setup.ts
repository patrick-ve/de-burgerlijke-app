import { afterAll, afterEach, beforeAll } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { config } from '@vue/test-utils';

// Configure Vue Test Utils
config.global.plugins = [
  createTestingPinia({
    createSpy: vi.fn,
  }),
];

// Setup for all tests
beforeAll(() => {
  // Add any global setup here
});

afterEach(() => {
  // Cleanup after each test
});

afterAll(() => {
  // Cleanup after all tests
});
