import { mount } from '@vue/test-utils';
import ToDo from '../components/ToDo.vue'; // Adjusted import path
import { describe, it, expect, vi } from 'vitest';

// Define a common interface for ToDo props for type safety in tests
interface ToDoProps {
  id: string;
  text: string;
  completed: boolean;
}

const createWrapper = (props: ToDoProps) => {
  return mount(ToDo, {
    props,
  });
};

describe('ToDo.vue', () => {
  const mockTodo: ToDoProps = {
    id: '1',
    text: 'Learn Vue Testing',
    completed: false,
  };

  const mockCompletedTodo: ToDoProps = {
    id: '2',
    text: 'Write more tests',
    completed: true,
  };

  it('renders', () => {
    const wrapper = mount(ToDo);
    expect(wrapper.exists()).toBe(true);
  });

  it('renders the todo text', () => {
    const wrapper = createWrapper(mockTodo);
    expect(wrapper.text()).toContain(mockTodo.text);
  });

  it('renders as incomplete by default or when completed is false', () => {
    const wrapper = createWrapper(mockTodo);
    const checkbox = wrapper.find('input[type="checkbox"]');
    expect((checkbox.element as HTMLInputElement).checked).toBe(
      false
    );
  });

  it('renders as completed when completed is true', () => {
    const wrapper = createWrapper(mockCompletedTodo);
    const checkbox = wrapper.find('input[type="checkbox"]');
    expect((checkbox.element as HTMLInputElement).checked).toBe(true);
  });

  it('emits "toggle-complete" with the todo id when checkbox is clicked', async () => {
    const wrapper = createWrapper(mockTodo);
    const checkbox = wrapper.find('input[type="checkbox"]');
    await checkbox.setValue(true); // Simulate user checking the box
    expect(wrapper.emitted()).toHaveProperty('toggle-complete');
    expect(wrapper.emitted()['toggle-complete'][0]).toEqual([
      mockTodo.id,
    ]);
  });

  it('emits "toggle-complete" when a completed todo is unchecked', async () => {
    const wrapper = createWrapper(mockCompletedTodo);
    const checkbox = wrapper.find('input[type="checkbox"]');
    await checkbox.setValue(false); // Simulate user unchecking the box
    expect(wrapper.emitted()).toHaveProperty('toggle-complete');
    expect(wrapper.emitted()['toggle-complete'][0]).toEqual([
      mockCompletedTodo.id,
    ]);
  });

  it('associates the text with the checkbox for accessibility', () => {
    const wrapper = createWrapper(mockTodo);
    const checkbox = wrapper.find('input[type="checkbox"]');
    const label = wrapper.find('label');
    expect(label.attributes('for')).toBe(checkbox.attributes('id'));
    expect(label.text()).toContain(mockTodo.text);
  });

  it('checkbox should have an accessible name (e.g., via aria-label or label association)', () => {
    const wrapper = createWrapper(mockTodo);
    const checkbox = wrapper.find('input[type="checkbox"]');
    const ariaLabel = checkbox.attributes('aria-label');
    const id = checkbox.attributes('id');
    let hasAccessibleName = false;
    if (ariaLabel) {
      hasAccessibleName = true;
    } else if (id) {
      const label = wrapper.find(`label[for="${id}"]`);
      if (label.exists() && label.text().length > 0) {
        hasAccessibleName = true;
      }
    }
    expect(hasAccessibleName).toBe(true);
  });

  it('applies a specific style when a todo is completed', async () => {
    const wrapperUncompleted = createWrapper({
      ...mockTodo,
      completed: false,
    });
    const labelUncompleted = wrapperUncompleted.find('label');
    expect(labelUncompleted.classes()).not.toContain('line-through');

    const wrapperCompleted = createWrapper({
      ...mockTodo,
      completed: true,
    });
    const labelCompleted = wrapperCompleted.find('label');
    expect(labelCompleted.classes()).toContain('line-through');
    expect(labelCompleted.classes()).toContain('text-gray-500');

    // Test dynamic update if needed, though createWrapper already tests initial states
    // await wrapperUncompleted.setProps({ completed: true });
    // expect(wrapperUncompleted.find('label').classes()).toContain('line-through');
  });

  it('handles empty todo text gracefully', () => {
    const wrapper = createWrapper({ ...mockTodo, text: '' });
    const label = wrapper.find('label');
    expect(label.text()).toBe('');
  });
});
