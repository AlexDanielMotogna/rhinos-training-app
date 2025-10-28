import type { WorkoutEntry, WorkoutPayload } from '../types/workout';
import { workoutService } from './api';
import { isOnline } from './sync';

const WORKOUTS_KEY = 'rhinos_workouts';
const DELETED_LOGS_KEY = 'rhinos_deleted_logs'; // Track logs deleted by user

export interface WorkoutLog {
  id: string;
  userId: string;
  date: string; // ISO date string
  entries: WorkoutEntry[];
  notes?: string;
  source: 'player' | 'coach'; // player = free session/user plan, coach = team plan workout
  planTemplateId?: string; // Link to UserPlanTemplate if workout was from a user plan
  planName?: string; // Name of the plan used (for history display)
  duration?: number; // Workout duration in minutes
  createdAt: string;
  // Plan metadata for accurate completion calculation
  planMetadata?: {
    totalExercises: number;  // Total number of exercises in the original plan
    totalTargetSets: number; // Total target sets across all exercises
  };
  // Completion percentage (calculated at finish time)
  completionPercentage?: number; // 0-100 percentage of sets completed
  // Soft delete flag - hidden from history UI but kept for stats
  deletedAt?: string; // ISO timestamp when user deleted from history
  isDeleted?: boolean; // Quick flag to check if deleted
}

/**
 * Get all workout logs
 */
export function getWorkoutLogs(): WorkoutLog[] {
  const stored = localStorage.getItem(WORKOUTS_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Clear all workout logs (for development/testing)
 */
export function clearAllWorkoutLogs(): void {
  localStorage.removeItem(WORKOUTS_KEY);
}

/**
 * Get workout logs for a specific user
 * @param includeDeleted - If true, includes soft-deleted workouts (for stats). Default: false (for history UI)
 */
export function getWorkoutLogsByUser(userId: string, includeDeleted: boolean = false): WorkoutLog[] {
  const allLogs = getWorkoutLogs();
  const userLogs = allLogs.filter(log => log.userId === userId);

  if (includeDeleted) {
    return userLogs; // Return all logs including deleted ones
  }

  return userLogs.filter(log => !log.isDeleted); // Only non-deleted logs for UI
}

/**
 * Get workout logs for a user within a date range
 */
export function getWorkoutLogsByDateRange(
  userId: string,
  startDate: string,
  endDate: string
): WorkoutLog[] {
  const userLogs = getWorkoutLogsByUser(userId);
  return userLogs.filter(log => log.date >= startDate && log.date <= endDate);
}

/**
 * Get the last workout log for a specific exercise
 */
export function getLastWorkoutForExercise(userId: string, exerciseId: string): WorkoutLog | null {
  const userLogs = getWorkoutLogsByUser(userId);
  const logsWithExercise = userLogs
    .filter(log => log.entries.some(entry => entry.exerciseId === exerciseId))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return logsWithExercise[0] || null;
}

/**
 * Save a workout log
 */
export function saveWorkoutLog(userId: string, payload: WorkoutPayload): WorkoutLog {
  const allLogs = getWorkoutLogs();

  const newLog: WorkoutLog = {
    id: `workout-${Date.now()}`,
    userId,
    date: payload.dateISO,
    entries: payload.entries,
    notes: payload.notes,
    source: payload.source,
    createdAt: new Date().toISOString(),
  };

  allLogs.push(newLog);
  localStorage.setItem(WORKOUTS_KEY, JSON.stringify(allLogs));

  return newLog;
}

/**
 * Save a single workout entry (for plan exercises)
 */
export function saveWorkoutEntry(userId: string, entry: WorkoutEntry): WorkoutLog {
  const today = new Date().toISOString().split('T')[0];

  const payload: WorkoutPayload = {
    dateISO: today,
    entries: [entry],
    source: 'coach',
  };

  return saveWorkoutLog(userId, payload);
}

/**
 * Update a workout log
 */
export function updateWorkoutLog(logId: string, updates: Partial<Omit<WorkoutLog, 'id' | 'userId' | 'createdAt'>>): WorkoutLog | null {
  const allLogs = getWorkoutLogs();
  const index = allLogs.findIndex(log => log.id === logId);

  if (index === -1) {
    return null;
  }

  const updatedLog = {
    ...allLogs[index],
    ...updates,
  };

  allLogs[index] = updatedLog;
  localStorage.setItem(WORKOUTS_KEY, JSON.stringify(allLogs));

  return updatedLog;
}

/**
 * Soft delete a workout log (marks as deleted but keeps in database for stats)
 */
export async function deleteWorkoutLog(logId: string): Promise<void> {
  const allLogs = getWorkoutLogs();
  const index = allLogs.findIndex(log => log.id === logId);

  if (index === -1) return;

  // Mark as deleted instead of removing
  allLogs[index].isDeleted = true;
  allLogs[index].deletedAt = new Date().toISOString();

  localStorage.setItem(WORKOUTS_KEY, JSON.stringify(allLogs));

  // Mark log as deleted to prevent re-sync
  const deletedData = localStorage.getItem(DELETED_LOGS_KEY);
  const deletedLogs = new Set<string>(deletedData ? JSON.parse(deletedData) : []);
  deletedLogs.add(logId);
  localStorage.setItem(DELETED_LOGS_KEY, JSON.stringify(Array.from(deletedLogs)));
  console.log('[WORKOUT LOGS] Marked log as deleted:', logId);

  // Try to delete from backend if online
  const online = isOnline();
  if (online) {
    try {
      console.log('[WORKOUT LOGS] Deleting log from backend:', logId);
      await workoutService.delete(logId);
      console.log('[WORKOUT LOGS] Log deleted from backend');
    } catch (error) {
      console.warn('[WORKOUT LOGS] Failed to delete log from backend:', error);
    }
  }
}

/**
 * Hard delete a workout log (permanently removes from database)
 * This should only be used by admins or for data cleanup
 */
export async function hardDeleteWorkoutLog(logId: string): Promise<void> {
  const allLogs = getWorkoutLogs();
  const filtered = allLogs.filter(log => log.id !== logId);
  localStorage.setItem(WORKOUTS_KEY, JSON.stringify(filtered));

  // Mark log as deleted to prevent re-sync
  const deletedData = localStorage.getItem(DELETED_LOGS_KEY);
  const deletedLogs = new Set<string>(deletedData ? JSON.parse(deletedData) : []);
  deletedLogs.add(logId);
  localStorage.setItem(DELETED_LOGS_KEY, JSON.stringify(Array.from(deletedLogs)));
  console.log('[WORKOUT LOGS] Marked log as hard deleted:', logId);

  // Try to delete from backend if online
  const online = isOnline();
  if (online) {
    try {
      console.log('[WORKOUT LOGS] Deleting log from backend:', logId);
      await workoutService.delete(logId);
      console.log('[WORKOUT LOGS] Log deleted from backend');
    } catch (error) {
      console.warn('[WORKOUT LOGS] Failed to delete log from backend:', error);
    }
  }
}

/**
 * Restore a soft-deleted workout log
 */
export function restoreWorkoutLog(logId: string): void {
  const allLogs = getWorkoutLogs();
  const index = allLogs.findIndex(log => log.id === logId);

  if (index === -1) return;

  // Remove delete flags
  delete allLogs[index].isDeleted;
  delete allLogs[index].deletedAt;

  localStorage.setItem(WORKOUTS_KEY, JSON.stringify(allLogs));
}

/**
 * Sync workout logs from backend to localStorage
 */
export async function syncWorkoutLogsFromBackend(userId: string): Promise<void> {
  if (!isOnline()) {
    console.log('📦 Offline - skipping workout logs sync');
    return;
  }

  try {
    console.log('🔄 Syncing workout logs from backend...');
    const backendLogs = await workoutService.getAll({ userId }) as WorkoutLog[];

    if (!backendLogs || backendLogs.length === 0) {
      console.log('ℹ️ No workout logs found in backend');
      return;
    }

    // Get existing local logs
    const localLogs = getWorkoutLogs();

    // Get list of deleted logs to filter them out
    const deletedData = localStorage.getItem(DELETED_LOGS_KEY);
    const deletedLogs = new Set<string>(deletedData ? JSON.parse(deletedData) : []);

    // Create a map of existing local logs by ID for quick lookup
    const localLogsMap = new Map(localLogs.map(log => [log.id, log]));

    // Merge backend logs with local logs
    const mergedLogs: WorkoutLog[] = [];
    let addedCount = 0;
    let updatedCount = 0;

    for (const backendLog of backendLogs) {
      // Skip logs that were marked as deleted by user
      if (deletedLogs.has(backendLog.id)) {
        console.log('[WORKOUT LOGS] Skipping log marked as deleted:', backendLog.id);
        continue;
      }

      const existingLog = localLogsMap.get(backendLog.id);

      if (!existingLog) {
        // New log from backend - add it
        console.log('[WORKOUT LOGS] Adding new log:', backendLog.id);
        mergedLogs.push(backendLog);
        addedCount++;
      } else {
        // Log exists - check if backend version is newer
        const backendDate = new Date(backendLog.createdAt || 0);
        const localDate = new Date(existingLog.createdAt || 0);

        if (backendDate > localDate) {
          // Backend version is newer - update it
          console.log('[WORKOUT LOGS] Updating log:', backendLog.id);
          mergedLogs.push(backendLog);
          updatedCount++;
        } else {
          // Keep existing local version
          mergedLogs.push(existingLog);
        }
      }
    }

    // Add local-only logs (not yet synced to backend)
    for (const localLog of localLogs) {
      if (!backendLogs.find(l => l.id === localLog.id)) {
        // Skip logs that were marked as deleted
        if (deletedLogs.has(localLog.id)) {
          console.log('[WORKOUT LOGS] Log was deleted by user, removing from local cache:', localLog.id);
          continue;
        }

        // Check if this log has a MongoDB ID (24 hex chars)
        const isMongoId = /^[0-9a-f]{24}$/i.test(localLog.id);

        if (isMongoId) {
          // This log was deleted from backend, don't re-add it
          console.log('[WORKOUT LOGS] Log was deleted from backend, removing from local cache:', localLog.id);
          continue;
        }

        console.log('[WORKOUT LOGS] Found local-only log (not yet synced):', localLog.id);
        mergedLogs.push(localLog);
      }
    }

    // Save merged logs to localStorage
    localStorage.setItem(WORKOUTS_KEY, JSON.stringify(mergedLogs));
    console.log(`✅ Synced workout logs: ${addedCount} added, ${updatedCount} updated`);
  } catch (error) {
    console.error('❌ Failed to sync workout logs from backend:', error);
  }
}

/**
 * Get workout statistics for a user
 */
export function getWorkoutStats(userId: string) {
  const userLogs = getWorkoutLogsByUser(userId);

  const totalWorkouts = userLogs.length;
  const totalExercises = userLogs.reduce((sum, log) => sum + log.entries.length, 0);

  // Get workouts in the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentWorkouts = userLogs.filter(
    log => new Date(log.date) >= sevenDaysAgo
  ).length;

  // Get workouts in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const monthlyWorkouts = userLogs.filter(
    log => new Date(log.date) >= thirtyDaysAgo
  ).length;

  return {
    totalWorkouts,
    totalExercises,
    workoutsLast7Days: recentWorkouts,
    workoutsLast30Days: monthlyWorkouts,
  };
}
