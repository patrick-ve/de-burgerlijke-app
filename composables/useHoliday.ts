import { ref, computed } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { v4 as uuidv4 } from 'uuid'; // Using uuid for unique IDs

// Define the structure for a holiday checklist item
export interface HolidayItem {
  id: string;
  text: string;
  category: string; // Will store the category *name*
  checked: boolean;
}

// Define the structure for category definitions, including emojis
export interface HolidayCategoryDefinition {
  name: string;
  emoji: string;
}

// Define standard categories with emojis
export const holidayCategories: Readonly<
  HolidayCategoryDefinition[]
> = [
  { name: 'Kleding', emoji: '👕' },
  { name: 'Toiletartikelen', emoji: '🧴' },
  { name: 'Documenten', emoji: '📄' },
  { name: 'Electronica', emoji: '🔌' },
  { name: 'Gezondheid', emoji: '💊' },
  { name: 'Overig', emoji: '🛒' },
] as const;

// Type representing the valid category *names*
export type HolidayCategoryName =
  (typeof holidayCategories)[number]['name'];

// Helper to get just the names
const categoryNames = holidayCategories.map((c) => c.name);

// Define default holiday items
const defaultHolidayItems: HolidayItem[] = [
  // Kleding
  {
    id: uuidv4(),
    text: 'Ondergoed',
    category: 'Kleding',
    checked: false,
  },
  {
    id: uuidv4(),
    text: 'Sokken',
    category: 'Kleding',
    checked: false,
  },
  {
    id: uuidv4(),
    text: 'T-shirts',
    category: 'Kleding',
    checked: false,
  },
  {
    id: uuidv4(),
    text: 'Broeken/Shorts',
    category: 'Kleding',
    checked: false,
  },
  {
    id: uuidv4(),
    text: 'Trui/Vest',
    category: 'Kleding',
    checked: false,
  },
  { id: uuidv4(), text: 'Jas', category: 'Kleding', checked: false },
  {
    id: uuidv4(),
    text: 'Zwemkleding',
    category: 'Kleding',
    checked: false,
  },
  {
    id: uuidv4(),
    text: 'Pyjama',
    category: 'Kleding',
    checked: false,
  },
  {
    id: uuidv4(),
    text: 'Schoenen',
    category: 'Kleding',
    checked: false,
  },
  // Toiletartikelen
  {
    id: uuidv4(),
    text: 'Tandenborstel',
    category: 'Toiletartikelen',
    checked: false,
  },
  {
    id: uuidv4(),
    text: 'Tandpasta',
    category: 'Toiletartikelen',
    checked: false,
  },
  {
    id: uuidv4(),
    text: 'Shampoo/Conditioner',
    category: 'Toiletartikelen',
    checked: false,
  },
  {
    id: uuidv4(),
    text: 'Zeep/Douchegel',
    category: 'Toiletartikelen',
    checked: false,
  },
  {
    id: uuidv4(),
    text: 'Deodorant',
    category: 'Toiletartikelen',
    checked: false,
  },
  {
    id: uuidv4(),
    text: 'Borstel/Kam',
    category: 'Toiletartikelen',
    checked: false,
  },
  {
    id: uuidv4(),
    text: 'Zonnebrandcrème',
    category: 'Toiletartikelen',
    checked: false,
  },
  {
    id: uuidv4(),
    text: 'Aftersun',
    category: 'Toiletartikelen',
    checked: false,
  },
  // Documenten
  {
    id: uuidv4(),
    text: 'Paspoort/ID-kaart',
    category: 'Documenten',
    checked: false,
  },
  {
    id: uuidv4(),
    text: 'Rijbewijs',
    category: 'Documenten',
    checked: false,
  },
  {
    id: uuidv4(),
    text: 'Vliegtickets',
    category: 'Documenten',
    checked: false,
  },
  {
    id: uuidv4(),
    text: 'Verzekeringspas',
    category: 'Documenten',
    checked: false,
  },
  {
    id: uuidv4(),
    text: 'Portemonnee',
    category: 'Documenten',
    checked: false,
  },
  {
    id: uuidv4(),
    text: 'Pinpas',
    category: 'Documenten',
    checked: false,
  },
  {
    id: uuidv4(),
    text: 'Creditcard',
    category: 'Documenten',
    checked: false,
  },
  {
    id: uuidv4(),
    text: 'Contant geld',
    category: 'Documenten',
    checked: false,
  },
  // Electronica
  {
    id: uuidv4(),
    text: 'Telefoon',
    category: 'Electronica',
    checked: false,
  },
  {
    id: uuidv4(),
    text: 'Oplader(s)',
    category: 'Electronica',
    checked: false,
  },
  {
    id: uuidv4(),
    text: 'Powerbank',
    category: 'Electronica',
    checked: false,
  },
  {
    id: uuidv4(),
    text: 'Koptelefoon/Oortjes',
    category: 'Electronica',
    checked: false,
  },
  {
    id: uuidv4(),
    text: 'Camera',
    category: 'Electronica',
    checked: false,
  },
  {
    id: uuidv4(),
    text: 'Wereldstekker',
    category: 'Electronica',
    checked: false,
  },
  // Gezondheid
  {
    id: uuidv4(),
    text: 'Persoonlijke medicijnen',
    category: 'Gezondheid',
    checked: false,
  },
  {
    id: uuidv4(),
    text: 'EHBO-kit (pleisters, pijnstillers, etc.)',
    category: 'Gezondheid',
    checked: false,
  },
  {
    id: uuidv4(),
    text: 'Insectenwerend middel',
    category: 'Gezondheid',
    checked: false,
  },
  {
    id: uuidv4(),
    text: 'Handdesinfecterend middel',
    category: 'Gezondheid',
    checked: false,
  },
  // Overig
  {
    id: uuidv4(),
    text: 'Boek/E-reader',
    category: 'Overig',
    checked: false,
  },
  {
    id: uuidv4(),
    text: 'Zonnebril',
    category: 'Overig',
    checked: false,
  },
  {
    id: uuidv4(),
    text: 'Handdoek (strand/reizen)',
    category: 'Overig',
    checked: false,
  },
  {
    id: uuidv4(),
    text: 'Reiskussen (optioneel)',
    category: 'Overig',
    checked: false,
  },
  {
    id: uuidv4(),
    text: 'Tas/Rugzak',
    category: 'Overig',
    checked: false,
  },
];

export function useHoliday() {
  // Initialize state with localStorage persistence
  const items = useLocalStorage<HolidayItem[]>(
    'holiday-checklist',
    defaultHolidayItems,
    { mergeDefaults: true }
  );

  // Function to add a new item (accepts category name)
  const addHolidayItem = (
    text: string,
    categoryName: HolidayCategoryName
  ) => {
    if (!text.trim()) return; // Prevent adding empty items
    const newItem: HolidayItem = {
      id: uuidv4(),
      text: text.trim(),
      category: categoryName, // Store the name
      checked: false,
    };
    items.value.push(newItem);
  };

  // Function to toggle the checked state of an item
  const toggleHolidayItem = (id: string) => {
    const item = items.value.find((item) => item.id === id);
    if (item) {
      item.checked = !item.checked;
    }
  };

  // Function to delete an item
  const deleteHolidayItem = (id: string) => {
    items.value = items.value.filter((item) => item.id !== id);
  };

  // Function to clear all items
  const clearAllHolidayItems = () => {
    items.value = [];
  };

  // Computed property to group items by category name
  const groupedItems = computed(() => {
    // Initialize groups with category names as keys
    const groups = categoryNames.reduce(
      (acc, name) => {
        acc[name] = [];
        return acc;
      },
      {} as Record<HolidayCategoryName, HolidayItem[]>
    );

    // Populate groups with items
    items.value.forEach((item) => {
      // Ensure the category exists in our defined list, fallback to 'Overig' name
      const categoryKey = categoryNames.includes(
        item.category as HolidayCategoryName
      )
        ? (item.category as HolidayCategoryName)
        : 'Overig';

      if (!groups[categoryKey]) {
        // Should not happen due to initialization, but safe fallback
        groups[categoryKey] = [];
      }
      groups[categoryKey].push(item);
    });

    // Filter out categories that have no items *after* grouping
    const filteredGroups: Partial<
      Record<HolidayCategoryName, HolidayItem[]>
    > = {};
    for (const categoryName in groups) {
      if (groups[categoryName as HolidayCategoryName].length > 0) {
        filteredGroups[categoryName as HolidayCategoryName] =
          groups[categoryName as HolidayCategoryName];
      }
    }

    return filteredGroups;
  });

  // Computed property for sorted category names based on groupedItems
  const sortedCategoryNames = computed(() => {
    const currentCategoryNames = Object.keys(
      groupedItems.value
    ) as HolidayCategoryName[];
    // Sort based on the predefined order of names
    return currentCategoryNames.sort((a, b) => {
      return categoryNames.indexOf(a) - categoryNames.indexOf(b);
    });
  });

  // Helper function to get category definition by name
  const getCategoryDefinition = (
    name: HolidayCategoryName
  ): HolidayCategoryDefinition | undefined => {
    return holidayCategories.find((c) => c.name === name);
  };

  return {
    items,
    holidayCategories, // Expose the full definitions (name + emoji)
    categoryNames, // Expose just the names array if needed elsewhere
    getCategoryDefinition, // Expose helper
    addHolidayItem,
    toggleHolidayItem,
    deleteHolidayItem,
    clearAllHolidayItems,
    groupedItems, // Keys are category names
    sortedCategoryNames, // Array of category names
  };
}
