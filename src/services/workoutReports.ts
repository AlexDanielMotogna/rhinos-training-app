import type { WorkoutReport } from './workoutAnalysis';
import type { WorkoutSource } from '../types/workout';

const REPORTS_KEY = 'rhinos_workout_reports';

export interface SavedWorkoutReport extends WorkoutReport {
  id: string;
  userId: string;
  workoutTitle: string;
  dateISO: string;
  createdAt: string;
  source: WorkoutSource; // 'coach' or 'player'
}

/**
 * Get all workout reports
 */
export function getAllReports(): SavedWorkoutReport[] {
  try {
    const stored = localStorage.getItem(REPORTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Failed to load workout reports', e);
    return [];
  }
}

/**
 * Get reports for a specific user
 */
export function getReportsByUser(userId: string, source?: WorkoutSource): SavedWorkoutReport[] {
  const allReports = getAllReports();
  let filtered = allReports.filter(report => report.userId === userId);

  // Filter by source if provided
  if (source) {
    filtered = filtered.filter(report => report.source === source);
  }

  return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Get reports within a date range
 */
export function getReportsByDateRange(
  userId: string,
  startDate: string,
  endDate: string
): SavedWorkoutReport[] {
  const userReports = getReportsByUser(userId);
  return userReports.filter(
    report => report.dateISO >= startDate && report.dateISO <= endDate
  );
}

/**
 * Save a workout report
 */
export function saveWorkoutReport(
  userId: string,
  workoutTitle: string,
  report: WorkoutReport,
  source: WorkoutSource
): SavedWorkoutReport {
  const allReports = getAllReports();

  const savedReport: SavedWorkoutReport = {
    ...report,
    id: `report-${Date.now()}`,
    userId,
    workoutTitle,
    dateISO: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    source,
  };

  allReports.push(savedReport);
  localStorage.setItem(REPORTS_KEY, JSON.stringify(allReports));

  return savedReport;
}

/**
 * Delete a workout report
 */
export function deleteWorkoutReport(reportId: string): void {
  const allReports = getAllReports();
  const filtered = allReports.filter(report => report.id !== reportId);
  localStorage.setItem(REPORTS_KEY, JSON.stringify(filtered));
}

/**
 * Get the most recent report for a user
 */
export function getLatestReport(userId: string): SavedWorkoutReport | null {
  const reports = getReportsByUser(userId);
  return reports.length > 0 ? reports[0] : null;
}

/**
 * Get average scores for a user (last 30 days)
 */
export function getAverageScores(userId: string): {
  intensity: number;
  workCapacity: number;
  athleticQuality: number;
  positionFit: number;
} | null {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentReports = getReportsByDateRange(
    userId,
    thirtyDaysAgo.toISOString().split('T')[0],
    today.toISOString().split('T')[0]
  );

  if (recentReports.length === 0) {
    return null;
  }

  const totals = recentReports.reduce(
    (acc, report) => ({
      intensity: acc.intensity + report.intensityScore,
      workCapacity: acc.workCapacity + report.workCapacityScore,
      athleticQuality: acc.athleticQuality + report.athleticQualityScore,
      positionFit: acc.positionFit + report.positionRelevanceScore,
    }),
    { intensity: 0, workCapacity: 0, athleticQuality: 0, positionFit: 0 }
  );

  const count = recentReports.length;
  return {
    intensity: Math.round(totals.intensity / count),
    workCapacity: Math.round(totals.workCapacity / count),
    athleticQuality: Math.round(totals.athleticQuality / count),
    positionFit: Math.round(totals.positionFit / count),
  };
}
