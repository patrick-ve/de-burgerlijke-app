import { ref } from 'vue';
import type { BabyProfile, MilkEntry } from './useBaby';
import type { SyncData } from './useWebRTCSync';

export interface SyncResult {
  profileUpdated: boolean;
  entriesAdded: number;
  entriesUpdated: number;
  entriesRemoved: number;
  totalConflictsResolved: number;
}

export interface DataComparison {
  isLocalNewer: boolean;
  isRemoteNewer: boolean;
  hasConflicts: boolean;
  lastLocalUpdate: Date | null;
  lastRemoteUpdate: Date | null;
}

export function useDataSync() {
  const syncInProgress = ref(false);
  const lastSyncResult = ref<SyncResult | null>(null);

  // Compare two dates, handling null/undefined values
  const compareDates = (date1: Date | null | undefined, date2: Date | null | undefined): number => {
    if (!date1 && !date2) return 0;
    if (!date1) return -1;
    if (!date2) return 1;
    return date1.getTime() - date2.getTime();
  };

  // Compare baby profiles and determine which is newer
  const compareProfiles = (local: BabyProfile | null, remote: BabyProfile | null): DataComparison => {
    if (!local && !remote) {
      return {
        isLocalNewer: false,
        isRemoteNewer: false,
        hasConflicts: false,
        lastLocalUpdate: null,
        lastRemoteUpdate: null,
      };
    }

    if (!local) {
      return {
        isLocalNewer: false,
        isRemoteNewer: true,
        hasConflicts: false,
        lastLocalUpdate: null,
        lastRemoteUpdate: remote?.updatedAt || null,
      };
    }

    if (!remote) {
      return {
        isLocalNewer: true,
        isRemoteNewer: false,
        hasConflicts: false,
        lastLocalUpdate: local.updatedAt,
        lastRemoteUpdate: null,
      };
    }

    const comparison = compareDates(local.updatedAt, remote.updatedAt);
    
    return {
      isLocalNewer: comparison > 0,
      isRemoteNewer: comparison < 0,
      hasConflicts: comparison !== 0,
      lastLocalUpdate: local.updatedAt,
      lastRemoteUpdate: remote.updatedAt,
    };
  };

  // Merge baby profiles using "most recent wins" strategy
  const mergeProfiles = (local: BabyProfile | null, remote: BabyProfile | null): BabyProfile | null => {
    const comparison = compareProfiles(local, remote);
    
    if (!local && !remote) return null;
    if (!local) return remote;
    if (!remote) return local;
    
    // Return the profile with the most recent updatedAt timestamp
    return comparison.isLocalNewer ? local : remote;
  };

  // Find milk entry by ID
  const findEntryById = (entries: MilkEntry[], id: string): MilkEntry | undefined => {
    return entries.find(entry => entry.id === id);
  };

  // Merge milk entries using "most recent wins" strategy
  const mergeMilkEntries = (local: MilkEntry[], remote: MilkEntry[]): {
    mergedEntries: MilkEntry[];
    stats: { added: number; updated: number; removed: number; conflictsResolved: number };
  } => {
    const mergedMap = new Map<string, MilkEntry>();
    const stats = { added: 0, updated: 0, removed: 0, conflictsResolved: 0 };

    // First, add all local entries to the map
    local.forEach(entry => {
      mergedMap.set(entry.id, entry);
    });

    // Then process remote entries
    remote.forEach(remoteEntry => {
      const localEntry = mergedMap.get(remoteEntry.id);
      
      if (!localEntry) {
        // New entry from remote
        mergedMap.set(remoteEntry.id, remoteEntry);
        stats.added++;
      } else {
        // Entry exists in both - compare timestamps
        const comparison = compareDates(localEntry.updatedAt, remoteEntry.updatedAt);
        
        if (comparison < 0) {
          // Remote is newer - replace local
          mergedMap.set(remoteEntry.id, remoteEntry);
          stats.updated++;
          stats.conflictsResolved++;
        } else if (comparison > 0) {
          // Local is newer - keep local (no action needed)
          stats.conflictsResolved++;
        }
        // If equal timestamps, keep local version (no conflict)
      }
    });

    // Check for entries that exist locally but not remotely
    // In this implementation, we keep all local entries even if they don't exist remotely
    // This prevents accidental data loss during sync
    
    const mergedEntries = Array.from(mergedMap.values())
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return { mergedEntries, stats };
  };

  // Create sync data from current local data
  const createSyncData = (babyProfile: BabyProfile | null, milkEntries: MilkEntry[], deviceId: string): SyncData => {
    return {
      babyProfile,
      milkEntries,
      lastSync: new Date(),
      deviceId,
    };
  };

  // Perform full data synchronization
  const synchronizeData = async (
    localProfile: BabyProfile | null,
    localEntries: MilkEntry[],
    remoteData: SyncData
  ): Promise<{
    newProfile: BabyProfile | null;
    newEntries: MilkEntry[];
    result: SyncResult;
  }> => {
    syncInProgress.value = true;

    try {
      // Merge profiles
      const newProfile = mergeProfiles(localProfile, remoteData.babyProfile);
      const profileUpdated = newProfile !== localProfile;

      // Merge milk entries
      const { mergedEntries: newEntries, stats } = mergeMilkEntries(localEntries, remoteData.milkEntries);

      const result: SyncResult = {
        profileUpdated,
        entriesAdded: stats.added,
        entriesUpdated: stats.updated,
        entriesRemoved: stats.removed,
        totalConflictsResolved: stats.conflictsResolved,
      };

      lastSyncResult.value = result;

      return {
        newProfile,
        newEntries,
        result,
      };
    } finally {
      syncInProgress.value = false;
    }
  };

  // Analyze what would change during sync (preview mode)
  const previewSync = (
    localProfile: BabyProfile | null,
    localEntries: MilkEntry[],
    remoteData: SyncData
  ): SyncResult => {
    const profileComparison = compareProfiles(localProfile, remoteData.babyProfile);
    const { stats } = mergeMilkEntries(localEntries, remoteData.milkEntries);

    return {
      profileUpdated: profileComparison.hasConflicts && profileComparison.isRemoteNewer,
      entriesAdded: stats.added,
      entriesUpdated: stats.updated,
      entriesRemoved: stats.removed,
      totalConflictsResolved: stats.conflictsResolved + (profileComparison.hasConflicts ? 1 : 0),
    };
  };

  // Check if local data is newer than remote data
  const isLocalDataNewer = (
    localProfile: BabyProfile | null,
    localEntries: MilkEntry[],
    remoteData: SyncData
  ): boolean => {
    // Check profile
    const profileComparison = compareProfiles(localProfile, remoteData.babyProfile);
    if (profileComparison.isLocalNewer) return true;

    // Check if any local entry is newer than the last sync time
    const remoteLastSync = new Date(remoteData.lastSync);
    return localEntries.some(entry => 
      entry.updatedAt > remoteLastSync
    );
  };

  // Get synchronization statistics
  const getSyncStats = () => {
    return {
      lastResult: lastSyncResult.value,
      inProgress: syncInProgress.value,
    };
  };

  // Reset sync state
  const resetSyncState = () => {
    lastSyncResult.value = null;
    syncInProgress.value = false;
  };

  return {
    // State
    syncInProgress: readonly(syncInProgress),
    lastSyncResult: readonly(lastSyncResult),

    // Actions
    synchronizeData,
    previewSync,
    createSyncData,
    isLocalDataNewer,
    getSyncStats,
    resetSyncState,
    
    // Utility functions
    compareProfiles,
    mergeMilkEntries,
    compareDates,
  };
}