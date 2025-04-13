import { ref, type Ref } from 'vue';
import { v4 as uuidv4 } from 'uuid';

interface FieldItem {
  id: string; // Assume items have a unique ID for keying
  [key: string]: any;
}

interface UseFieldArrayOptions<T extends FieldItem> {
  initialValue?: T[];
  itemFactory: () => Omit<T, 'id'>; // Factory to create new items (without id)
}

/**
 * Composable for managing dynamic arrays of fields in a form.
 *
 * @param name - A unique name for the field array (optional, for potential future integration).
 * @param options - Configuration options including initial values and item factory.
 */
export function useFieldArray<T extends FieldItem>(
  name: string, // Keep name for context, though not strictly used internally yet
  options: UseFieldArrayOptions<T>
) {
  const fields = ref(options.initialValue?.map(item => ({ ...item, id: item.id || uuidv4() })) || []) as Ref<T[]>;

  const append = (itemData?: Partial<Omit<T, 'id'>>) => {
    const newItemBase = options.itemFactory();
    const newItem = {
      ...newItemBase,
      ...itemData,
      id: uuidv4(), // Ensure a unique ID
    } as T;
    fields.value.push(newItem);
  };

  const remove = (index: number) => {
    if (index >= 0 && index < fields.value.length) {
      fields.value.splice(index, 1);
    }
  };

  const updateField = (index: number, field: keyof Omit<T, 'id'>, value: any) => {
    if (index >= 0 && index < fields.value.length) {
      const item = fields.value[index];
      if (item && field !== 'id') { // Prevent updating the id field
        // Simple update, might need refinement based on type (e.g., numbers)
        (item as any)[field] = value;
      }
    }
  };

  const updateItem = (index: number, newItemData: Partial<Omit<T, 'id'>>) => {
     if (index >= 0 && index < fields.value.length) {
       const currentItem = fields.value[index];
       fields.value[index] = { ...currentItem, ...newItemData }; // Keep original id
     }
   };

  // Function to replace the entire array
  const replace = (newItems: T[]) => {
    fields.value = newItems.map(item => ({ ...item, id: item.id || uuidv4() }));
  };

  return {
    fields,
    append,
    remove,
    updateField,
    updateItem,
    replace,
  };
} 