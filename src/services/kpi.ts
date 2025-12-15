import type { KPISnapshot, PerformanceScore } from '../types/kpi';
import { getWorkoutLogsByUser } from './workoutLog';
import { getTrainingAssignments } from './trainingBuilder';
import { getAllPolls } from './attendancePollService';

/**
 * Calculate KPIs for a user
 * @param userId - User ID
 * @param weekOffset - Optional: 0 = current week, -1 = last week, etc.
 */
export async function calculateKPIs(userId: string, weekOffset: number = 0): Promise<KPISnapshot> {
  const now = new Date();

  // Calculate target week based on offset
  const targetDate = new Date(now);
  targetDate.setDate(targetDate.getDate() + (weekOffset * 7));

  const currentWeek = getWeekNumber(targetDate);

  // Get week boundaries (Monday to Sunday)
  const weekStart = getWeekStart(targetDate);
  const weekEnd = getWeekEnd(targetDate);

  // Get ALL workout logs for this user (from backend)
  const allLogs = await getWorkoutLogsByUser(userId, false);

  // Filter logs for selected week
  const thisWeekLogs = allLogs.filter(log => {
    const logDate = new Date(log.date);
    return logDate >= weekStart && logDate <= weekEnd;
  });

  // Calculate workout compliance
  const assignments = getTrainingAssignments();
  const activeAssignments = assignments.filter((a: any) => {
    const startDate = new Date(a.startDate);
    return startDate <= targetDate && a.playerIds?.includes(userId);
  });

  // For this week, count expected coach plan workouts
  const coachPlansAssigned = activeAssignments.length > 0 ? 3 : 0;
  const coachPlansCompleted = thisWeekLogs.filter(log => log.source === 'coach').length;

  // Get all polls for attendance tracking
  const allPolls = await getAllPolls();

  // Filter polls for selected week
  const pollsThisWeek = allPolls.filter(poll => {
    const pollDate = new Date(poll.sessionDate);
    return pollDate >= weekStart && pollDate <= weekEnd;
  });

  // Count attendance based on poll votes (training or present = attended)
  let teamSessionsAttended = 0;
  let attendanceStatus: 'on_time' | 'late' | 'absent' | 'no_recent_session' = 'no_recent_session';

  pollsThisWeek.forEach(poll => {
    const userVote = poll.votes?.find(v => v.userId === userId);
    if (userVote) {
      if (userVote.option === 'training' || userVote.option === 'present') {
        teamSessionsAttended++;
        attendanceStatus = 'on_time'; // Voted to attend
      } else if (userVote.option === 'absent') {
        attendanceStatus = 'absent';
      }
    }
  });

  // Free workouts for selected week
  const freeWorkouts = thisWeekLogs.filter(log => log.source === 'player');
  const freeWorkoutsMinutes = freeWorkouts.reduce((sum, log) => {
    return sum + (log.duration || 0);
  }, 0);

  // Total volume for selected week
  const totalVolume = thisWeekLogs.reduce((sum, log) => sum + (log.duration || 60), 0);

  // Calculate overall compliance for selected week
  const totalExpected = coachPlansAssigned + pollsThisWeek.length;
  const totalCompleted = coachPlansCompleted + teamSessionsAttended;
  const trainingCompliance = totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 100;

  // Performance scores from localStorage
  const strengthScore = getPerformanceScore('lastStrengthTest');
  const speedScore = getPerformanceScore('lastSpeedTest');
  const powerScore = getPerformanceScore('lastPowerTest');
  const agilityScore = getPerformanceScore('lastAgilityTest');

  // OVERALL TOTALS (all time)
  const overallTotalWorkouts = allLogs.length;
  const overallTotalMinutes = allLogs.reduce((sum, log) => sum + (log.duration || 60), 0);
  const overallCoachWorkouts = allLogs.filter(log => log.source === 'coach').length;
  const overallFreeWorkouts = allLogs.filter(log => log.source === 'player').length;

  // Overall attendance stats (all time) - based on poll votes
  let totalTeamSessionsAttended = 0;
  const totalTeamSessionsScheduled = allPolls.length;

  allPolls.forEach(poll => {
    const userVote = poll.votes?.find(v => v.userId === userId);
    if (userVote && (userVote.option === 'training' || userVote.option === 'present')) {
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
    teamSessionsTotal: pollsThisWeek.length,
    freeWorkouts: freeWorkouts.length,
    freeWorkoutsMinutes,
    totalVolume,
    // Overall totals
    overallTotalWorkouts,
    overallTotalMinutes,
    overallCoachWorkouts,
    overallFreeWorkouts,
    // Performance scores
    strengthScore,
    speedScore,
    powerScore,
    agilityScore,
    // Attendance
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
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of week (Sunday)
 */
function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
  end.setHours(23, 59, 59, 999);
  return end;
}
