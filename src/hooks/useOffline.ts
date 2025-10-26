import { useState, useEffect } from 'react';
import {
  isOnline,
  registerSyncListeners,
  syncAll,
  getSyncStatus,
  prefetchUpcomingTrainings,
  prefetchTeamRoster,
  prefetchTrainingTypes,
  prefetchTrainingAssignments,
  prefetchExercises,
  prefetchTrainingSessions,
} from '../services/sync';
import { getDbStats } from '../services/db';

export interface OfflineStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: number | null;
  pendingSyncItems: number;
  cacheStats: {
    trainingSessions: number;
    attendance: number;
    workouts: number;
    users: number;
    trainingTypes: number;
    trainingAssignments: number;
    pendingSync: number;
  } | null;
}

/**
 * React hook for managing offline state and sync
 */
export function useOffline() {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: isOnline(),
    isSyncing: false,
    lastSync: null,
    pendingSyncItems: 0,
    cacheStats: null,
  });

  const updateStatus = async () => {
    const syncStatus = getSyncStatus();
    const stats = await getDbStats();

    setStatus({
      isOnline: syncStatus.isOnline,
      isSyncing: syncStatus.isSyncing,
      lastSync: syncStatus.lastSyncTimestamp,
      pendingSyncItems: stats.pendingSync,
      cacheStats: stats,
    });
  };

  useEffect(() => {
    // Register sync listeners (online/offline events)
    registerSyncListeners();

    // Update status initially
    updateStatus();

    // Poll for sync status changes every 5 seconds
    const interval = setInterval(updateStatus, 5000);

    // Listen for online/offline events
    const handleOnline = () => updateStatus();
    const handleOffline = () => updateStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const manualSync = async () => {
    await syncAll();
    await updateStatus();
  };

  const prefetch = async (days: number = 14) => {
    await Promise.all([
      prefetchUpcomingTrainings(days),
      prefetchTeamRoster(),
      prefetchTrainingTypes(),
      prefetchTrainingAssignments(),
      prefetchExercises(),
      prefetchTrainingSessions(),
    ]);
    await updateStatus();
  };

  return {
    ...status,
    manualSync,
    prefetch,
    refresh: updateStatus,
  };
}
