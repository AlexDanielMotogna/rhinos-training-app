/**
 * Workout reports service - backend only
 */

import type { WorkoutReport } from './workoutAnalysis';
import type { WorkoutSource, WorkoutEntry } from '../types/workout';
import { workoutReportService } from './api';

const REPORTS_KEY = 'rhinos_workout_reports';
const SAVING_REPORTS_KEY = 'rhinos_saving_reports';
const DELETED_REPORTS_KEY = 'rhinos_deleted_reports';

export interface SavedWorkoutReport extends WorkoutReport {
  id: string;
  userId: string;
  workoutTitle: string;
  dateISO: string;
  createdAt: string;
  source: WorkoutSource;
  entries: WorkoutEntry[];
  backendSynced?: boolean;
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
 * Get reports currently being saved (to prevent duplicates)
 */
function getSavingReports(): Set<string> {
  try {
    const stored = localStorage.getItem(SAVING_REPORTS_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch (e) {
    return new Set();
  }
}

/**
 * Add report to saving list
 */
function addToSavingList(reportKey: string): void {
  const saving = getSavingReports();
  saving.add(reportKey);
  localStorage.setItem(SAVING_REPORTS_KEY, JSON.stringify([...saving]));
}

/**
 * Remove report from saving list
 */
function removeFromSavingList(reportKey: string): void {
  const saving = getSavingReports();
  saving.delete(reportKey);
  localStorage.setItem(SAVING_REPORTS_KEY, JSON.stringify([...saving]));
}

/**
 * Save a workout report
 */
export async function saveWorkoutReport(
  userId: string,
  workoutTitle: string,
  report: WorkoutReport,
  source: WorkoutSource,
  entries: WorkoutEntry[]
): Promise<SavedWorkoutReport> {
  const createdAt = new Date().toISOString();
  const dateISO = createdAt.split('T')[0];

  // Create unique key for this report to prevent concurrent saves
  const reportKey = `${userId}-${dateISO}-${workoutTitle}-${source}`;

  // Check if this report is already being saved
  const savingReports = getSavingReports();
  if (savingReports.has(reportKey)) {
    console.warn('⚠️ Report already being saved, skipping duplicate:', reportKey);
    // Try to find and return the existing report
    const allReports = getAllReports();
    const existing = allReports.find(r =>
      r.userId === userId &&
      r.dateISO === dateISO &&
      r.workoutTitle === workoutTitle &&
      r.source === source
    );
    if (existing) {
      return existing;
    }
  }

  // Mark this report as being saved
  addToSavingList(reportKey);

  try {
    const allReports = getAllReports();

    // Check if report already exists (deduplication)
    const existingReport = allReports.find(r =>
      r.userId === userId &&
      r.dateISO === dateISO &&
      r.workoutTitle === workoutTitle &&
      r.source === source &&
      // Allow if created within last 5 seconds (same workout session)
      Math.abs(new Date(r.createdAt).getTime() - new Date(createdAt).getTime()) < 5000
    );

    if (existingReport) {
      console.log('ℹ️ Report already exists, returning existing:', existingReport.id);
      removeFromSavingList(reportKey);
      return existingReport;
    }

    const savedReport: SavedWorkoutReport = {
      ...report,
      id: `report-${Date.now()}`,
      userId,
      workoutTitle,
      dateISO,
      createdAt,
      source,
      entries,
      backendSynced: false,
    };

    // Save to localStorage first (immediate feedback)
    allReports.push(savedReport);
    localStorage.setItem(REPORTS_KEY, JSON.stringify(allReports));

    try {
      console.log('🔄 Saving workout report to backend...');
      const backendReport = await workoutReportService.create({
        userId: savedReport.userId,
        workoutTitle: savedReport.workoutTitle,
        date: savedReport.dateISO,
        source: savedReport.source,
        duration: savedReport.duration,

        // Performance scores
        intensityScore: savedReport.intensityScore,
        workCapacityScore: savedReport.workCapacityScore,
        athleticQualityScore: savedReport.athleticQualityScore,
        positionRelevanceScore: savedReport.positionRelevanceScore,

        // Breakdown
        totalVolume: savedReport.totalVolume || 0,
        totalDistance: savedReport.totalDistance,
        avgRPE: savedReport.avgRPE || 5,
        setsCompleted: savedReport.setsCompleted || 0,
        setsPlanned: savedReport.setsPlanned || 0,

        // Athletic focus
        powerWork: savedReport.powerWork || 0,
        strengthWork: savedReport.strengthWork || 0,
        speedWork: savedReport.speedWork || 0,

        // Highlights
        strengths: savedReport.strengths || [],
        warnings: savedReport.warnings || [],

        // Progress comparison
        volumeChange: savedReport.volumeChange,
        intensityChange: savedReport.intensityChange,

        // Recovery
        recoveryDemand: savedReport.recoveryDemand,
        recommendedRestHours: savedReport.recommendedRestHours || 24,
        sessionValid: savedReport.sessionValid !== false,

        // AI Insights
        coachInsights: savedReport.coachInsights || '',

        // Metadata
        aiGenerated: (savedReport as any).aiGenerated || false,
        workoutEntries: savedReport.entries,
        createdAt: savedReport.createdAt,
      });

      console.log('✅ Workout report saved to backend:', backendReport);

      // Update local report with backend ID and mark as synced
      if (backendReport && typeof backendReport === 'object' && 'id' in backendReport) {
        savedReport.id = (backendReport as any).id;
        savedReport.backendSynced = true;
        // Update localStorage with backend ID
        const updatedReports = allReports.map(r =>
          r.createdAt === savedReport.createdAt && r.userId === userId ? savedReport : r
        );
        localStorage.setItem(REPORTS_KEY, JSON.stringify(updatedReports));
      }
    } catch (error) {
      console.warn('⚠️ Failed to save workout report to backend:', error);
      // Report is still saved locally
    }

    removeFromSavingList(reportKey);
    return savedReport;
  } catch (error) {
    removeFromSavingList(reportKey);
    throw error;
  }
}

/**
 * Delete a workout report
 */
export async function deleteWorkoutReport(reportId: string): Promise<void> {
  const allReports = getAllReports();
  const filtered = allReports.filter(report => report.id !== reportId);
  localStorage.setItem(REPORTS_KEY, JSON.stringify(filtered));

  // Mark report as deleted to prevent re-sync
  const deletedData = localStorage.getItem(DELETED_REPORTS_KEY);
  const deletedReports = new Set<string>(deletedData ? JSON.parse(deletedData) : []);
  deletedReports.add(reportId);
  localStorage.setItem(DELETED_REPORTS_KEY, JSON.stringify(Array.from(deletedReports)));
  console.log('[WORKOUT REPORTS] Marked report as deleted:', reportId);

  try {
    console.log('[WORKOUT REPORTS] Deleting report from backend:', reportId);
    await workoutReportService.delete(reportId);
    console.log('[WORKOUT REPORTS] Report deleted from backend');
  } catch (error) {
    console.warn('[WORKOUT REPORTS] Failed to delete report from backend:', error);
    throw error;
  }
}

/**
 * Get the most recent report for a user
 */
export function getLatestReport(userId: string): SavedWorkoutReport | null {
  const reports = getReportsByUser(userId);
  return reports.length > 0 ? reports[0] : null;
}

/**
 * Sync workout reports from backend to localStorage
 */
export async function syncWorkoutReportsFromBackend(userId: string): Promise<void> {
  try {
    console.log('🔄 Syncing workout reports from backend...');
    const backendReports = await workoutReportService.getAll({ userId }) as any[];

    if (!backendReports || backendReports.length === 0) {
      console.log('ℹ️ No workout reports found in backend');
      return;
    }

    console.log(`📥 Received ${backendReports.length} reports from backend`);

    // Get existing local reports
    const localReports = getAllReports();

    // Get list of deleted reports to filter them out
    const deletedData = localStorage.getItem(DELETED_REPORTS_KEY);
    const deletedReports = new Set<string>(deletedData ? JSON.parse(deletedData) : []);

    // Create a map of existing local reports by ID for quick lookup
    const localReportsMap = new Map(localReports.map(report => [report.id, report]));

    // Merge backend reports with local reports
    const mergedReports: SavedWorkoutReport[] = [];
    let addedCount = 0;
    let updatedCount = 0;

    for (const backendReport of backendReports) {
      // Skip reports that were marked as deleted by user
      if (deletedReports.has(backendReport.id)) {
        console.log('[WORKOUT REPORTS] Skipping report marked as deleted:', backendReport.id, backendReport.workoutTitle);
        continue;
      }

      // Transform backend format to frontend format
      const transformedReport: SavedWorkoutReport = {
        ...backendReport,
        // Handle date field
        dateISO: backendReport.date || backendReport.dateISO || (backendReport.createdAt ? backendReport.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
        // Handle entries field
        entries: backendReport.workoutEntries || backendReport.entries || [],
        backendSynced: true,
      };

      const existingReport = localReportsMap.get(transformedReport.id);

      if (!existingReport) {
        // New report from backend - add it
        console.log(`➕ Adding new report: ${transformedReport.workoutTitle} (${transformedReport.id})`);
        mergedReports.push(transformedReport);
        addedCount++;
      } else {
        // Report exists - check if backend version is newer
        const backendDate = new Date(transformedReport.createdAt || 0);
        const localDate = new Date(existingReport.createdAt || 0);

        if (backendDate > localDate) {
          // Backend version is newer - update it
          console.log(`🔄 Updating report: ${transformedReport.workoutTitle} (${transformedReport.id})`);
          mergedReports.push(transformedReport);
          updatedCount++;
        } else {
          // Keep existing local version
          mergedReports.push(existingReport);
        }
      }
    }

    // Add local-only reports (not yet synced to backend)
    for (const localReport of localReports) {
      if (!backendReports.find(r => r.id === localReport.id)) {
        // Skip reports that were marked as deleted
        if (deletedReports.has(localReport.id)) {
          console.log('[WORKOUT REPORTS] Report was deleted by user, removing from local cache:', localReport.id, localReport.workoutTitle);
          continue;
        }

        // Check if this report has a MongoDB ID (24 hex chars)
        const isMongoId = /^[0-9a-f]{24}$/i.test(localReport.id);

        if (isMongoId) {
          // This report was deleted from backend, don't re-add it
          console.log('[WORKOUT REPORTS] Report was deleted from backend, removing from local cache:', localReport.id, localReport.workoutTitle);
          continue;
        }

        console.log('[WORKOUT REPORTS] Found local-only report (not yet synced):', localReport.id);
        mergedReports.push(localReport);
      }
    }

    // Save merged reports to localStorage
    localStorage.setItem(REPORTS_KEY, JSON.stringify(mergedReports));
    console.log(`✅ Synced workout reports: ${addedCount} added, ${updatedCount} updated`);
  } catch (error) {
    console.error('❌ Failed to sync workout reports from backend:', error);
  }
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
