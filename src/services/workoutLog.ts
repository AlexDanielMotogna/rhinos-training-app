import type { WorkoutEntry, WorkoutPayload } from '../types/workout';

const WORKOUTS_KEY = 'rhinos_workouts';

export interface WorkoutLog {
  id: string;
  userId: string;
  date: string; // ISO date string
  entries: WorkoutEntry[];
  notes?: string;
  source: 'player' | 'coach'; // player = free session, coach = plan workout
  createdAt: string;
}

/**
 * Get all workout logs
 */
export function getWorkoutLogs(): WorkoutLog[] {
  const stored = localStorage.getItem(WORKOUTS_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Get workout logs for a specific user
 */
export function getWorkoutLogsByUser(userId: string): WorkoutLog[] {
  const allLogs = getWorkoutLogs();
  return allLogs.filter(log => log.userId === userId);
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
 * Delete a workout log
 */
export function deleteWorkoutLog(logId: string): void {
  const allLogs = getWorkoutLogs();
  const filtered = allLogs.filter(log => log.id !== logId);
  localStorage.setItem(WORKOUTS_KEY, JSON.stringify(filtered));
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
