import { ref, computed } from 'vue';
import { useStorage } from '@vueuse/core';
import { v4 as uuidv4 } from 'uuid';

// Define the structure of a Birthday item
export interface Birthday {
  id: string;
  name: string;
  date: Date; // Store the full date
  createdAt: Date;
  updatedAt: Date;
}

// Use useStorage to persist the Birthday list in localStorage
const birthdays = useStorage<Birthday[]>('birthdays', []);

export function useBirthdays() {
  /**
   * Sorts birthdays primarily by month and day, then by name.
   * This brings upcoming birthdays to the top regardless of year.
   */
  const sortedBirthdays = computed(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    return [...birthdays.value].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      const monthA = dateA.getMonth();
      const dayA = dateA.getDate();
      const monthB = dateB.getMonth();
      const dayB = dateB.getDate();

      // Check if birthday A already passed this year
      const passedA =
        monthA < currentMonth ||
        (monthA === currentMonth && dayA < currentDay);
      // Check if birthday B already passed this year
      const passedB =
        monthB < currentMonth ||
        (monthB === currentMonth && dayB < currentDay);

      // If one passed and the other didn't, the one that didn't comes first
      if (passedA && !passedB) return 1;
      if (!passedA && passedB) return -1;

      // If both passed or both haven't passed, sort by month/day
      if (monthA !== monthB) {
        return monthA - monthB;
      }
      if (dayA !== dayB) {
        return dayA - dayB;
      }

      // If month and day are the same, sort by name
      return a.name.localeCompare(b.name);
    });
  });

  /**
   * Adds a new Birthday item to the list.
   */
  const addBirthday = (name: string, date: Date | null) => {
    if (!name || name.trim() === '' || !date) {
      console.warn(
        'Attempted to add birthday with missing name or date.'
      );
      return; // Don't add incomplete birthdays
    }

    const newBirthday: Birthday = {
      id: uuidv4(),
      name: name.trim(),
      date: new Date(date), // Ensure it's a Date object
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    birthdays.value.push(newBirthday);
    console.log('Birthday Added:', newBirthday);
  };

  /**
   * Deletes a Birthday item from the list by its ID.
   */
  const deleteBirthday = (id: string) => {
    const index = birthdays.value.findIndex((item) => item.id === id);
    if (index !== -1) {
      birthdays.value.splice(index, 1);
      console.log('Birthday Deleted:', id);
    } else {
      console.warn('Attempted to delete non-existent Birthday:', id);
    }
  };

  // Future functions like updateBirthday can be added here

  return {
    birthdays, // Expose raw data if needed
    sortedBirthdays,
    addBirthday,
    deleteBirthday,
  };
}
