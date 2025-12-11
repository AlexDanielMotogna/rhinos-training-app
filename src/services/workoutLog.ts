import type { WorkoutEntry, WorkoutPayload } from '../types/workout';
import { workoutService } from './api';

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
 * Get all workout logs from backend
 */
export async function getWorkoutLogs(): Promise<WorkoutLog[]> {
  try {
    console.log('[WORKOUT LOGS] Fetching all workouts from backend');
    const workouts = await workoutService.getAll() as WorkoutLog[];
    return workouts || [];
  } catch (error) {
    console.error('[WORKOUT LOGS] Failed to fetch workouts:', error);
    return [];
  }
}

/**
 * Get workout logs for a specific user from backend
 * @param includeDeleted - If true, includes soft-deleted workouts (for stats). Default: false (for history UI)
 */
export async function getWorkoutLogsByUser(userId: string, includeDeleted: boolean = false): Promise<WorkoutLog[]> {
  try {
    console.log('[WORKOUT LOGS] Fetching workouts for user:', userId);
    const workouts = await workoutService.getAll({ userId }) as WorkoutLog[];

    if (includeDeleted) {
      return workouts || [];
    }

    // Filter out deleted workouts for UI
    return (workouts || []).filter(log => !log.isDeleted);
  } catch (error) {
    console.error('[WORKOUT LOGS] Failed to fetch user workouts:', error);
    return [];
  }
}

/**
 * Get workout logs for a user within a date range
 */
export async function getWorkoutLogsByDateRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<WorkoutLog[]> {
  try {
    console.log('[WORKOUT LOGS] Fetching workouts for date range:', startDate, 'to', endDate);
    const workouts = await workoutService.getAll({
      userId,
      startDate,
      endDate
    }) as WorkoutLog[];
    return (workouts || []).filter(log => !log.isDeleted);
  } catch (error) {
    console.error('[WORKOUT LOGS] Failed to fetch workouts by date range:', error);
    return [];
  }
}

/**
 * Get the last workout log for a specific exercise
 */
export async function getLastWorkoutForExercise(userId: string, exerciseId: string): Promise<WorkoutLog | null> {
  try {
    const userLogs = await getWorkoutLogsByUser(userId);
    const logsWithExercise = userLogs
      .filter(log => log.entries.some(entry => entry.exerciseId === exerciseId))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return logsWithExercise[0] || null;
  } catch (error) {
    console.error('[WORKOUT LOGS] Failed to get last workout for exercise:', error);
    return null;
  }
}

/**
 * Save a workout log to backend
 */
export async function saveWorkoutLog(userId: string, payload: WorkoutPayload): Promise<WorkoutLog> {
  try {
    console.log('[WORKOUT LOGS] Saving workout to backend');
    const newLog = await workoutService.create({
      ...payload,
      userId,
      date: payload.dateISO,
    }) as WorkoutLog;

    console.log('[WORKOUT LOGS] Workout saved:', newLog.id);
    return newLog;
  } catch (error) {
    console.error('[WORKOUT LOGS] Failed to save workout:', error);
    throw error;
  }
}

/**
 * Save a single workout entry (for plan exercises)
 */
export async function saveWorkoutEntry(userId: string, entry: WorkoutEntry): Promise<WorkoutLog> {
  const today = new Date().toISOString().split('T')[0];

  const payload: WorkoutPayload = {
    dateISO: today,
    entries: [entry],
    source: 'coach',
  };

  return saveWorkoutLog(userId, payload);
}

/**
 * Update a workout log in backend
 */
export async function updateWorkoutLog(logId: string, updates: Partial<Omit<WorkoutLog, 'id' | 'userId' | 'createdAt'>>): Promise<WorkoutLog | null> {
  try {
    console.log('[WORKOUT LOGS] Updating workout in backend:', logId);
    const updatedLog = await workoutService.update(logId, updates) as WorkoutLog;
    console.log('[WORKOUT LOGS] Workout updated successfully');
    return updatedLog;
  } catch (error) {
    console.error('[WORKOUT LOGS] Failed to update workout:', error);
    throw error;
  }
}

/**
 * Soft delete a workout log (marks as deleted but keeps in database for stats)
 */
export async function deleteWorkoutLog(logId: string): Promise<void> {
  try {
    console.log('[WORKOUT LOGS] Deleting workout from backend:', logId);
    await workoutService.delete(logId);
    console.log('[WORKOUT LOGS] Workout deleted successfully');
  } catch (error) {
    console.error('[WORKOUT LOGS] Failed to delete workout:', error);
    throw error;
  }
}

/**
 * Hard delete a workout log (permanently removes from database)
 * This should only be used by admins or for data cleanup
 */
export async function hardDeleteWorkoutLog(logId: string): Promise<void> {
  try {
    console.log('[WORKOUT LOGS] Hard deleting workout from backend:', logId);
    await workoutService.delete(logId);
    console.log('[WORKOUT LOGS] Workout hard deleted successfully');
  } catch (error) {
    console.error('[WORKOUT LOGS] Failed to hard delete workout:', error);
    throw error;
  }
}

/**
 * Restore a soft-deleted workout log
 */
export async function restoreWorkoutLog(logId: string): Promise<void> {
  try {
    console.log('[WORKOUT LOGS] Restoring workout in backend:', logId);
    await workoutService.update(logId, { isDeleted: false, deletedAt: undefined });
    console.log('[WORKOUT LOGS] Workout restored successfully');
  } catch (error) {
    console.error('[WORKOUT LOGS] Failed to restore workout:', error);
    throw error;
  }
}

/**
 * Get workout statistics for a user
 */
export async function getWorkoutStats(userId: string) {
  try {
    const userLogs = await getWorkoutLogsByUser(userId);

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
  } catch (error) {
    console.error('[WORKOUT LOGS] Failed to get workout stats:', error);
    return {
      totalWorkouts: 0,
      totalExercises: 0,
      workoutsLast7Days: 0,
      workoutsLast30Days: 0,
    };
  }
}

/**
 * Clear all workout logs from localStorage (legacy - for migration)
 * This is kept for backwards compatibility but no longer used
 */
export function clearAllWorkoutLogs(): void {
  console.log('[WORKOUT LOGS] Clearing legacy localStorage (no longer used)');
  localStorage.removeItem('rhinos_workouts');
  localStorage.removeItem('rhinos_deleted_logs');
}

/**
 * Sync workout logs from backend (legacy compatibility - now this is the default)
 * All data is now read directly from backend, so this is a no-op
 */
export async function syncWorkoutLogsFromBackend(userId: string): Promise<void> {
  console.log('[WORKOUT LOGS] All workout data is now read directly from backend');
}
