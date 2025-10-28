import type { KPISnapshot, PerformanceScore } from '../types/kpi';
import { getWorkoutLogsByUser } from './workoutLog';
import { getTrainingAssignments } from './trainingBuilder';
import { getTeamSessions } from './trainingSessions';

/**
 * Calculate KPIs for a user
 */
export async function calculateKPIs(userId: string): Promise<KPISnapshot> {
  const now = new Date();
  const currentWeek = getWeekNumber(now);

  // Get week boundaries (Monday to Sunday)
  const weekStart = getWeekStart(now);
  const weekEnd = getWeekEnd(now);

  // Get all workout logs for this week
  const allLogs = getWorkoutLogsByUser(userId, false);
  const thisWeekLogs = allLogs.filter(log => {
    const logDate = new Date(log.date);
    return logDate >= weekStart && logDate <= weekEnd;
  });

  // Calculate workout compliance
  const assignments = getTrainingAssignments();
  const activeAssignments = assignments.filter((a: any) => {
    const startDate = new Date(a.startDate);
    return startDate <= now && a.playerIds?.includes(userId);
  });

  // For this week, count expected coach plan workouts
  // Assuming 2-3 workouts per week based on template frequency
  const coachPlansAssigned = activeAssignments.length > 0 ? 3 : 0;
  const coachPlansCompleted = thisWeekLogs.filter(log => log.source === 'coach').length;

  // Calculate team session attendance for this week
  const allTeamSessions = await getTeamSessions();
  const teamSessionsThisWeek = allTeamSessions.filter(session => {
    const sessionDate = new Date(session.date);
    return sessionDate >= weekStart && sessionDate <= weekEnd;
  });

  let teamSessionsAttended = 0;
  let attendanceStatus: 'on_time' | 'late' | 'absent' | 'no_recent_session' = 'no_recent_session';

  teamSessionsThisWeek.forEach(session => {
    const checkIn = session.checkIns?.find(c => c.userId === userId);
    if (checkIn) {
      teamSessionsAttended++;
      if (checkIn.status === 'on_time' && attendanceStatus === 'no_recent_session') {
        attendanceStatus = 'on_time';
      } else if (checkIn.status === 'late' && attendanceStatus !== 'on_time') {
        attendanceStatus = 'late';
      }
    } else {
      // Check if session already happened
      const sessionDateTime = new Date(`${session.date}T${session.time}`);
      if (sessionDateTime < now) {
        attendanceStatus = 'absent';
      }
    }
  });

  // Free workouts
  const freeWorkouts = thisWeekLogs.filter(log => log.source === 'player');
  const freeWorkoutsMinutes = freeWorkouts.reduce((sum, log) => {
    return sum + (log.duration || 0);
  }, 0);

  // Total volume
  const totalVolume = thisWeekLogs.reduce((sum, log) => sum + (log.duration || 60), 0);

  // Calculate overall compliance
  const totalExpected = coachPlansAssigned + teamSessionsThisWeek.length;
  const totalCompleted = coachPlansCompleted + teamSessionsAttended;
  const trainingCompliance = totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 100;

  // Performance scores from localStorage
  const strengthScore = getPerformanceScore('lastStrengthTest');
  const speedScore = getPerformanceScore('lastSpeedTest');
  const powerScore = getPerformanceScore('lastPowerTest');
  const agilityScore = getPerformanceScore('lastAgilityTest');

  // Overall attendance stats (all time) - reuse allTeamSessions from above
  const totalTeamSessionsScheduled = allTeamSessions.length;
  let totalTeamSessionsAttended = 0;

  allTeamSessions.forEach(session => {
    const checkIn = session.checkIns?.find(c => c.userId === userId);
    if (checkIn) {
      totalTeamSessionsAttended++;
    }
  });

  const attendanceRate = totalTeamSessionsScheduled > 0
    ? Math.round((totalTeamSessionsAttended / totalTeamSessionsScheduled) * 100)
    : 0;

  return {
    currentWeek,
    totalWeeks: 52,
    trainingCompliance,
    coachPlansCompleted,
    coachPlansAssigned,
    teamSessionsAttended,
    teamSessionsTotal: teamSessionsThisWeek.length,
    freeWorkouts: freeWorkouts.length,
    freeWorkoutsMinutes,
    totalVolume,
    strengthScore,
    speedScore,
    powerScore,
    agilityScore,
    totalTeamSessionsAttended,
    totalTeamSessionsScheduled,
    attendanceRate,
    attendanceStatus,
  };
}

/**
 * Get performance score from localStorage
 */
function getPerformanceScore(key: string): PerformanceScore {
  const stored = localStorage.getItem(key);
  if (!stored) {
    return {
      score: 0,
      change: null,
      lastTestDate: null,
    };
  }

  try {
    const data = JSON.parse(stored);
    let currentScore = 0;

    // Extract score based on test type
    if (key === 'lastStrengthTest') {
      // Strength test has strengthIndex (0-100)
      currentScore = data.strengthIndex || 0;
    } else if (key === 'lastSpeedTest' || key === 'lastPowerTest' || key === 'lastAgilityTest') {
      // Speed/Power/Agility tests have speedScore/powerScore/agilityScore
      const scoreField = key === 'lastSpeedTest' ? 'speedScore'
        : key === 'lastPowerTest' ? 'powerScore'
        : 'agilityScore';
      currentScore = data[scoreField] || 0;
    }

    // Get previous test to calculate change
    const previousKey = `${key}_previous`;
    const previousStored = localStorage.getItem(previousKey);
    let change = null;

    if (previousStored) {
      try {
        const previousData = JSON.parse(previousStored);
        let previousScore = 0;

        if (key === 'lastStrengthTest') {
          previousScore = previousData.strengthIndex || 0;
        } else if (key === 'lastSpeedTest' || key === 'lastPowerTest' || key === 'lastAgilityTest') {
          const scoreField = key === 'lastSpeedTest' ? 'speedScore'
            : key === 'lastPowerTest' ? 'powerScore'
            : 'agilityScore';
          previousScore = previousData[scoreField] || 0;
        }

        if (previousScore > 0) {
          change = currentScore - previousScore;
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    return {
      score: currentScore,
      change,
      lastTestDate: data.dateISO || data.date || data.testDate || null,
    };
  } catch (e) {
    return {
      score: 0,
      change: null,
      lastTestDate: null,
    };
  }
}

/**
 * Get current week number (1-52)
 */
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

/**
 * Get start of week (Monday)
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

/**
 * Get end of week (Sunday)
 */
function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  return new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
}
