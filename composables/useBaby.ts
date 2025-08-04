import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useStorage } from '@vueuse/core';
import { v4 as uuidv4 } from 'uuid';
import { useDataSync } from './useDataSync';
import type { SyncData } from './useWebRTCSync';

// Define the structure of a baby profile
export interface BabyProfile {
  id: string;
  name?: string;
  birthDate?: Date;
  weight: number; // in grams
  createdAt: Date;
  updatedAt: Date;
}

// Define the structure of a milk feeding entry
export interface MilkEntry {
  id: string;
  time: Date;
  amount: number; // in mL
  spitUp: boolean;
  urinated: boolean;
  defecated: boolean;
  temperature?: number; // in Celsius
  createdAt: Date;
  updatedAt: Date;
}

// Use useStorage to persist data in localStorage with custom serializer for Date objects
const babyProfile = useStorage<BabyProfile | null>('baby-profile', null, localStorage, {
  serializer: {
    read: (value: string) => {
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === 'object') {
          if (parsed.createdAt) parsed.createdAt = new Date(parsed.createdAt);
          if (parsed.updatedAt) parsed.updatedAt = new Date(parsed.updatedAt);
          if (parsed.birthDate) parsed.birthDate = new Date(parsed.birthDate);
        }
        return parsed;
      } catch {
        return null;
      }
    },
    write: (value: BabyProfile | null) => JSON.stringify(value),
  },
});

const milkEntries = useStorage<MilkEntry[]>('milk-entries', [], localStorage, {
  serializer: {
    read: (value: string) => {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.map(entry => ({
            ...entry,
            time: new Date(entry.time),
            createdAt: new Date(entry.createdAt),
            updatedAt: new Date(entry.updatedAt),
          }));
        }
        return [];
      } catch {
        return [];
      }
    },
    write: (value: MilkEntry[]) => JSON.stringify(value),
  },
});

export function useBaby() {
  // Computed property for daily milk requirement calculation
  const dailyMilkRequirement = computed(() => {
    if (!babyProfile.value || !babyProfile.value.weight) return 0;
    // Formula: weight in grams × 150 mL ÷ weight in kilograms
    // Simplified: weight in grams × 150 ÷ 1000 = weight in grams × 0.15
    return Math.round(babyProfile.value.weight * 0.15);
  });

  // Computed property for entries grouped by day (most recent first)
  const entriesByDay = computed(() => {
    const grouped: { [key: string]: MilkEntry[] } = {};
    
    milkEntries.value
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .forEach(entry => {
        const dateKey = new Date(entry.time).toDateString();
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(entry);
      });

    return grouped;
  });

  // Computed property for today's total milk intake
  const todaysMilkIntake = computed(() => {
    const today = new Date().toDateString();
    const todaysEntries = entriesByDay.value[today] || [];
    return todaysEntries.reduce((total, entry) => total + entry.amount, 0);
  });

  // Computed property for milk intake progress percentage
  const milkIntakeProgress = computed(() => {
    if (dailyMilkRequirement.value === 0) return 0;
    return Math.min((todaysMilkIntake.value / dailyMilkRequirement.value) * 100, 100);
  });

  // Computed property to check if daily requirement is met
  const isDailyRequirementMet = computed(() => {
    return todaysMilkIntake.value >= dailyMilkRequirement.value;
  });

  /**
   * Creates or updates the baby profile
   */
  const updateBabyProfile = (profileData: Partial<BabyProfile>) => {
    if (!babyProfile.value) {
      babyProfile.value = {
        id: uuidv4(),
        weight: profileData.weight || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...profileData,
      };
    } else {
      babyProfile.value = {
        ...babyProfile.value,
        ...profileData,
        updatedAt: new Date(),
      };
    }
    console.log('Baby Profile Updated:', babyProfile.value);
  };

  /**
   * Adds a new milk entry
   */
  const addMilkEntry = (entryData: Omit<MilkEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!entryData.amount || entryData.amount <= 0) {
      console.warn('Invalid milk amount');
      return;
    }

    const newEntry: MilkEntry = {
      id: uuidv4(),
      ...entryData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    milkEntries.value.push(newEntry);
    console.log('Milk Entry Added:', newEntry);
  };

  /**
   * Updates an existing milk entry
   */
  const updateMilkEntry = (id: string, entryData: Partial<MilkEntry>) => {
    const index = milkEntries.value.findIndex(entry => entry.id === id);
    if (index !== -1) {
      milkEntries.value[index] = {
        ...milkEntries.value[index],
        ...entryData,
        updatedAt: new Date(),
      };
      console.log('Milk Entry Updated:', milkEntries.value[index]);
    } else {
      console.warn('Attempted to update non-existent milk entry:', id);
    }
  };

  /**
   * Deletes a milk entry
   */
  const deleteMilkEntry = (id: string) => {
    const index = milkEntries.value.findIndex(entry => entry.id === id);
    if (index !== -1) {
      milkEntries.value.splice(index, 1);
      console.log('Milk Entry Deleted:', id);
    } else {
      console.warn('Attempted to delete non-existent milk entry:', id);
    }
  };

  /**
   * Clears all milk entries
   */
  const clearAllEntries = () => {
    milkEntries.value = [];
    console.log('All Milk Entries Cleared');
  };

  /**
   * Gets milk entries for a specific date
   */
  const getEntriesForDate = (date: Date) => {
    const dateKey = date.toDateString();
    return entriesByDay.value[dateKey] || [];
  };

  /**
   * Gets total milk intake for a specific date
   */
  const getMilkIntakeForDate = (date: Date) => {
    const entries = getEntriesForDate(date);
    return entries.reduce((total, entry) => total + entry.amount, 0);
  };

  // ===== SYNC FUNCTIONALITY =====
  const { synchronizeData, createSyncData, isLocalDataNewer } = useDataSync();
  const deviceId = localStorage.getItem('webrtc-device-id') || uuidv4();
  
  // Store device ID if not exists
  if (!localStorage.getItem('webrtc-device-id')) {
    localStorage.setItem('webrtc-device-id', deviceId);
  }

  /**
   * Export current data for synchronization
   */
  const exportSyncData = (): SyncData => {
    return createSyncData(babyProfile.value, milkEntries.value, deviceId);
  };

  /**
   * Import and merge sync data from another device
   */
  const importSyncData = async (remoteData: SyncData) => {
    const { newProfile, newEntries, result } = await synchronizeData(
      babyProfile.value,
      milkEntries.value,
      remoteData
    );

    // Update local data with merged results
    if (result.profileUpdated && newProfile) {
      babyProfile.value = newProfile;
    }

    if (result.entriesAdded > 0 || result.entriesUpdated > 0) {
      milkEntries.value = newEntries;
    }

    console.log('[Sync] Data synchronized:', result);
    return result;
  };

  /**
   * Check if local data has changes that need to be synced
   */
  const hasUnsyncedChanges = (lastSyncData?: SyncData): boolean => {
    if (!lastSyncData) return true;
    
    return isLocalDataNewer(babyProfile.value, milkEntries.value, lastSyncData);
  };

  // Event listeners for WebRTC sync events
  const handleSyncDataReceived = async (event: CustomEvent) => {
    const remoteData = event.detail as SyncData;
    await importSyncData(remoteData);
  };

  const handleSyncRequest = async (event: CustomEvent) => {
    // When sync is requested, send our current data
    const syncData = exportSyncData();
    window.dispatchEvent(new CustomEvent('baby-sync-response', {
      detail: syncData
    }));
  };

  // Setup event listeners
  onMounted(() => {
    window.addEventListener('webrtc-sync-data', handleSyncDataReceived as EventListener);
    window.addEventListener('webrtc-sync-request', handleSyncRequest as EventListener);
  });

  // Cleanup event listeners
  onBeforeUnmount(() => {
    window.removeEventListener('webrtc-sync-data', handleSyncDataReceived as EventListener);
    window.removeEventListener('webrtc-sync-request', handleSyncRequest as EventListener);
  });

  return {
    // State
    babyProfile: readonly(babyProfile),
    milkEntries: readonly(milkEntries),
    
    // Computed properties
    dailyMilkRequirement,
    entriesByDay,
    todaysMilkIntake,
    milkIntakeProgress,
    isDailyRequirementMet,
    
    // Actions
    updateBabyProfile,
    addMilkEntry,
    updateMilkEntry,
    deleteMilkEntry,
    clearAllEntries,
    getEntriesForDate,
    getMilkIntakeForDate,
    
    // Sync Actions
    exportSyncData,
    importSyncData,
    hasUnsyncedChanges,
  };
}