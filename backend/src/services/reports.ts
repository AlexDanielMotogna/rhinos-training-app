import prisma from '../utils/prisma.js';

/**
 * Report Types
 */
export interface PlayerDailyReport {
  playerId: string;
  playerName: string;
  position: string;
  status: 'active' | 'partial' | 'absent';
  workoutsCompleted: number;
  workoutsAssigned: number;
  minutesTrained: number;
  currentScore: number;
  previousScore: number;
  scoreTrend: number;
  compliance: number;
  attendance: boolean;
  lastActive: string;
  daysTrainedInPeriod?: number;
  totalDaysInPeriod?: number;
  teamSessionsAttended?: number;
  totalTeamSessions?: number;
  frequencyPerWeek?: string;
}

export interface TeamSession {
  date: string;
  startTime: string;
  endTime: string;
  playersAttended: number;
  totalPlayers: number;
  location?: string;
  address?: string;
}

export interface ReportSummary {
  period: 'day' | 'week' | 'month';
  dateISO: string;
  totalPlayers: number;
  activePlayers: number;
  partialPlayers: number;
  absentPlayers: number;
  avgScore: number;
  avgCompliance: number;
  totalMinutes: number;
  avgMinutesPerPlayer: number;
  topPerformers: string[];
  needsAttention: string[];
  teamSessions?: TeamSession[];
}

export interface DailyReport {
  summary: ReportSummary;
  players: PlayerDailyReport[];
  generatedAt: string;
}

export interface WeeklyReport {
  summary: ReportSummary;
  players: PlayerDailyReport[];
  dailyBreakdown: {
    date: string;
    activePlayers: number;
    avgScore: number;
    totalMinutes: number;
  }[];
  generatedAt: string;
}

export interface MonthlyReport {
  summary: ReportSummary;
  players: PlayerDailyReport[];
  weeklyBreakdown: {
    week: string;
    activePlayers: number;
    avgScore: number;
    totalMinutes: number;
  }[];
  improvements: {
    playerId: string;
    playerName: string;
    improvement: number;
  }[];
  declines: {
    playerId: string;
    playerName: string;
    decline: number;
  }[];
  generatedAt: string;
}

/**
 * Calculate player score based on recent performance
 * Score is based on: points earned, workout completion, attendance
 */
async function calculatePlayerScore(userId: string, startDate: Date, endDate: Date): Promise<number> {
  // Get workout logs in period
  const workouts = await prisma.workoutLog.findMany({
    where: {
      userId,
      date: {
        gte: startDate.toISOString().split('T')[0],
        lte: endDate.toISOString().split('T')[0],
      },
    },
  });

  if (workouts.length === 0) return 0;

  // Get points data
  const currentWeek = getISOWeek(endDate);
  const weeklyPoints = await prisma.playerWeeklyPoints.findUnique({
    where: {
      userId_week: {
        userId,
        week: currentWeek,
      },
    },
  });

  // Calculate score (0-100)
  const pointsScore = weeklyPoints ? Math.min(100, (weeklyPoints.totalPoints / weeklyPoints.targetPoints) * 100) : 0;
  const workoutScore = (workouts.length / 7) * 100; // Assuming 7 days as ideal
  const completionScore = workouts.reduce((sum, w) => sum + (w.completionPercentage || 0), 0) / workouts.length;

  // Weighted average: 40% points, 30% frequency, 30% completion
  const score = (pointsScore * 0.4) + (workoutScore * 0.3) + (completionScore * 0.3);
  return Math.round(score);
}

/**
 * Get ISO week string for a given date
 */
function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

/**
 * Generate Daily Report for a specific date
 */
export async function generateDailyReport(date: Date = new Date()): Promise<DailyReport> {
  const dateStr = date.toISOString().split('T')[0];

  // Get all players
  const users = await prisma.user.findMany({
    where: { role: 'player' },
    select: {
      id: true,
      name: true,
      position: true,
    },
  });

  // Get team sessions for this day
  const teamSessions = await prisma.trainingSession.findMany({
    where: {
      date: dateStr,
    },
    select: {
      id: true,
      date: true,
      startTime: true,
      endTime: true,
      location: true,
      address: true,
    },
  });

  const players: PlayerDailyReport[] = [];
  let totalMinutes = 0;
  let activePlayers = 0;
  let partialPlayers = 0;
  let absentPlayers = 0;
  let totalScore = 0;
  let totalCompliance = 0;

  for (const user of users) {
    // Get workouts for today
    const workouts = await prisma.workoutLog.findMany({
      where: {
        userId: user.id,
        date: dateStr,
      },
    });

    // Get assigned plan
    const assignment = await prisma.trainingAssignment.findFirst({
      where: {
        playerId: user.id,
      },
      include: {
        template: true,
      },
    });

    const workoutsCompleted = workouts.length;
    const minutesTrained = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);
    const workoutsAssigned = assignment ? parseInt(assignment.template.frequencyPerWeek || '3') : 1;

    // Calculate scores
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const currentScore = await calculatePlayerScore(user.id, startOfDay, endOfDay);

    // Get previous day score
    const previousDay = new Date(date);
    previousDay.setDate(previousDay.getDate() - 1);
    const previousStartOfDay = new Date(previousDay);
    previousStartOfDay.setHours(0, 0, 0, 0);
    const previousEndOfDay = new Date(previousDay);
    previousEndOfDay.setHours(23, 59, 59, 999);
    const previousScore = await calculatePlayerScore(user.id, previousStartOfDay, previousEndOfDay);

    const scoreTrend = previousScore > 0 ? ((currentScore - previousScore) / previousScore) * 100 : 0;
    const compliance = workoutsAssigned > 0 ? (workoutsCompleted / workoutsAssigned) * 100 : 0;

    // Determine status
    let status: 'active' | 'partial' | 'absent';
    if (workoutsCompleted >= workoutsAssigned) {
      status = 'active';
      activePlayers++;
    } else if (workoutsCompleted > 0) {
      status = 'partial';
      partialPlayers++;
    } else {
      status = 'absent';
      absentPlayers++;
    }

    // Check attendance to team sessions
    const attendance = teamSessions.length > 0;  // Simplified - would need attendance tracking

    totalMinutes += minutesTrained;
    totalScore += currentScore;
    totalCompliance += compliance;

    players.push({
      playerId: user.id,
      playerName: user.name,
      position: user.position || 'N/A',
      status,
      workoutsCompleted,
      workoutsAssigned,
      minutesTrained,
      currentScore,
      previousScore,
      scoreTrend: Math.round(scoreTrend * 10) / 10,
      compliance: Math.round(compliance),
      attendance,
      lastActive: workouts.length > 0 ? dateStr : '',
      frequencyPerWeek: assignment?.template.frequencyPerWeek || '3',
    });
  }

  const totalPlayers = users.length;
  const avgScore = totalPlayers > 0 ? Math.round(totalScore / totalPlayers) : 0;
  const avgCompliance = totalPlayers > 0 ? Math.round(totalCompliance / totalPlayers) : 0;
  const avgMinutesPerPlayer = totalPlayers > 0 ? Math.round(totalMinutes / totalPlayers) : 0;

  // Top performers (highest scores)
  const topPerformers = players
    .sort((a, b) => b.currentScore - a.currentScore)
    .slice(0, 3)
    .map(p => p.playerId);

  // Needs attention (negative trends or low compliance)
  const needsAttention = players
    .filter(p => p.scoreTrend < -5 || p.compliance < 50)
    .sort((a, b) => a.scoreTrend - b.scoreTrend)
    .slice(0, 3)
    .map(p => p.playerId);

  // Format team sessions
  const formattedTeamSessions: TeamSession[] = teamSessions.map(session => ({
    date: session.date,
    startTime: session.startTime,
    endTime: session.endTime,
    playersAttended: 0, // Would need attendance tracking
    totalPlayers: totalPlayers,
    location: session.location,
    address: session.address,
  }));

  return {
    summary: {
      period: 'day',
      dateISO: dateStr,
      totalPlayers,
      activePlayers,
      partialPlayers,
      absentPlayers,
      avgScore,
      avgCompliance,
      totalMinutes,
      avgMinutesPerPlayer,
      topPerformers,
      needsAttention,
      teamSessions: formattedTeamSessions,
    },
    players: players.sort((a, b) => b.currentScore - a.currentScore),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate Weekly Report for a specific start date
 */
export async function generateWeeklyReport(startDate: Date = new Date()): Promise<WeeklyReport> {
  // Calculate week range
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  // Get all players
  const users = await prisma.user.findMany({
    where: { role: 'player' },
    select: {
      id: true,
      name: true,
      position: true,
    },
  });

  // Get team sessions for this week
  const teamSessions = await prisma.trainingSession.findMany({
    where: {
      date: {
        gte: startDateStr,
        lte: endDateStr,
      },
    },
  });

  const players: PlayerDailyReport[] = [];
  const dailyBreakdown: { date: string; activePlayers: number; avgScore: number; totalMinutes: number }[] = [];

  let totalMinutes = 0;
  let activePlayers = 0;
  let partialPlayers = 0;
  let absentPlayers = 0;
  let totalScore = 0;
  let totalCompliance = 0;

  for (const user of users) {
    // Get workouts for this week
    const workouts = await prisma.workoutLog.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDateStr,
          lte: endDateStr,
        },
      },
    });

    // Get assigned plan
    const assignment = await prisma.trainingAssignment.findFirst({
      where: {
        playerId: user.id,
      },
      include: {
        template: true,
      },
    });

    const workoutsCompleted = workouts.length;
    const minutesTrained = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);
    const workoutsAssigned = assignment ? parseInt(assignment.template.frequencyPerWeek || '3') : 3;
    const daysTrainedInPeriod = new Set(workouts.map(w => w.date)).size;

    // Calculate score
    const currentScore = await calculatePlayerScore(user.id, startDate, endDate);

    // Get previous week score
    const previousWeekStart = new Date(startDate);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);
    const previousWeekEnd = new Date(previousWeekStart);
    previousWeekEnd.setDate(previousWeekEnd.getDate() + 6);
    const previousScore = await calculatePlayerScore(user.id, previousWeekStart, previousWeekEnd);

    const scoreTrend = previousScore > 0 ? ((currentScore - previousScore) / previousScore) * 100 : 0;
    const compliance = workoutsAssigned > 0 ? (workoutsCompleted / workoutsAssigned) * 100 : 0;

    // Determine status
    let status: 'active' | 'partial' | 'absent';
    if (workoutsCompleted >= workoutsAssigned) {
      status = 'active';
      activePlayers++;
    } else if (workoutsCompleted > 0) {
      status = 'partial';
      partialPlayers++;
    } else {
      status = 'absent';
      absentPlayers++;
    }

    totalMinutes += minutesTrained;
    totalScore += currentScore;
    totalCompliance += compliance;

    players.push({
      playerId: user.id,
      playerName: user.name,
      position: user.position || 'N/A',
      status,
      workoutsCompleted,
      workoutsAssigned,
      minutesTrained,
      currentScore,
      previousScore,
      scoreTrend: Math.round(scoreTrend * 10) / 10,
      compliance: Math.round(compliance),
      attendance: true, // Simplified
      lastActive: workouts.length > 0 ? workouts[workouts.length - 1].date : '',
      daysTrainedInPeriod,
      totalDaysInPeriod: 7,
      teamSessionsAttended: 0, // Would need attendance tracking
      totalTeamSessions: teamSessions.length,
      frequencyPerWeek: assignment?.template.frequencyPerWeek || '3',
    });
  }

  // Generate daily breakdown
  for (let i = 0; i < 7; i++) {
    const day = new Date(startDate);
    day.setDate(day.getDate() + i);
    const dayStr = day.toISOString().split('T')[0];

    const dayWorkouts = await prisma.workoutLog.findMany({
      where: {
        date: dayStr,
      },
    });

    const activeDayPlayers = new Set(dayWorkouts.map(w => w.userId)).size;
    const dayMinutes = dayWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0);

    dailyBreakdown.push({
      date: dayStr,
      activePlayers: activeDayPlayers,
      avgScore: 0, // Simplified for now
      totalMinutes: dayMinutes,
    });
  }

  const totalPlayers = users.length;
  const avgScore = totalPlayers > 0 ? Math.round(totalScore / totalPlayers) : 0;
  const avgCompliance = totalPlayers > 0 ? Math.round(totalCompliance / totalPlayers) : 0;
  const avgMinutesPerPlayer = totalPlayers > 0 ? Math.round(totalMinutes / totalPlayers) : 0;

  // Top performers
  const topPerformers = players
    .sort((a, b) => b.currentScore - a.currentScore)
    .slice(0, 3)
    .map(p => p.playerId);

  // Needs attention
  const needsAttention = players
    .filter(p => p.scoreTrend < -5 || p.compliance < 50)
    .sort((a, b) => a.scoreTrend - b.scoreTrend)
    .slice(0, 3)
    .map(p => p.playerId);

  return {
    summary: {
      period: 'week',
      dateISO: startDateStr,
      totalPlayers,
      activePlayers,
      partialPlayers,
      absentPlayers,
      avgScore,
      avgCompliance,
      totalMinutes,
      avgMinutesPerPlayer,
      topPerformers,
      needsAttention,
    },
    players: players.sort((a, b) => b.currentScore - a.currentScore),
    dailyBreakdown,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate Monthly Report for a specific month (YYYY-MM)
 */
export async function generateMonthlyReport(month: string): Promise<MonthlyReport> {
  // Parse month (format: YYYY-MM)
  const [year, monthNum] = month.split('-').map(Number);
  const startDate = new Date(year, monthNum - 1, 1);
  const endDate = new Date(year, monthNum, 0); // Last day of month

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  // Get all players
  const users = await prisma.user.findMany({
    where: { role: 'player' },
    select: {
      id: true,
      name: true,
      position: true,
    },
  });

  const players: PlayerDailyReport[] = [];
  const improvements: { playerId: string; playerName: string; improvement: number }[] = [];
  const declines: { playerId: string; playerName: string; decline: number }[] = [];

  let totalMinutes = 0;
  let activePlayers = 0;
  let partialPlayers = 0;
  let absentPlayers = 0;
  let totalScore = 0;
  let totalCompliance = 0;

  for (const user of users) {
    // Get workouts for this month
    const workouts = await prisma.workoutLog.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDateStr,
          lte: endDateStr,
        },
      },
    });

    // Get assigned plan
    const assignment = await prisma.trainingAssignment.findFirst({
      where: {
        playerId: user.id,
      },
      include: {
        template: true,
      },
    });

    const workoutsCompleted = workouts.length;
    const minutesTrained = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);
    const daysInMonth = endDate.getDate();
    const expectedWorkouts = assignment ? Math.ceil((parseInt(assignment.template.frequencyPerWeek || '3') * daysInMonth) / 7) : daysInMonth / 7;

    // Calculate score
    const currentScore = await calculatePlayerScore(user.id, startDate, endDate);

    // Get previous month score
    const previousMonthStart = new Date(startDate);
    previousMonthStart.setMonth(previousMonthStart.getMonth() - 1);
    const previousMonthEnd = new Date(previousMonthStart.getFullYear(), previousMonthStart.getMonth() + 1, 0);
    const previousScore = await calculatePlayerScore(user.id, previousMonthStart, previousMonthEnd);

    const scoreTrend = previousScore > 0 ? ((currentScore - previousScore) / previousScore) * 100 : 0;
    const compliance = expectedWorkouts > 0 ? (workoutsCompleted / expectedWorkouts) * 100 : 0;

    // Track improvements and declines
    if (scoreTrend >= 10) {
      improvements.push({
        playerId: user.id,
        playerName: user.name,
        improvement: Math.round(scoreTrend * 10) / 10,
      });
    } else if (scoreTrend <= -10) {
      declines.push({
        playerId: user.id,
        playerName: user.name,
        decline: Math.round(Math.abs(scoreTrend) * 10) / 10,
      });
    }

    // Determine status
    let status: 'active' | 'partial' | 'absent';
    if (workoutsCompleted >= expectedWorkouts) {
      status = 'active';
      activePlayers++;
    } else if (workoutsCompleted > 0) {
      status = 'partial';
      partialPlayers++;
    } else {
      status = 'absent';
      absentPlayers++;
    }

    totalMinutes += minutesTrained;
    totalScore += currentScore;
    totalCompliance += compliance;

    players.push({
      playerId: user.id,
      playerName: user.name,
      position: user.position || 'N/A',
      status,
      workoutsCompleted,
      workoutsAssigned: Math.round(expectedWorkouts),
      minutesTrained,
      currentScore,
      previousScore,
      scoreTrend: Math.round(scoreTrend * 10) / 10,
      compliance: Math.round(compliance),
      attendance: true, // Simplified
      lastActive: workouts.length > 0 ? workouts[workouts.length - 1].date : '',
      daysTrainedInPeriod: new Set(workouts.map(w => w.date)).size,
      totalDaysInPeriod: daysInMonth,
      frequencyPerWeek: assignment?.template.frequencyPerWeek || '3',
    });
  }

  // Generate weekly breakdown
  const weeklyBreakdown: { week: string; activePlayers: number; avgScore: number; totalMinutes: number }[] = [];
  let currentWeekStart = new Date(startDate);

  while (currentWeekStart <= endDate) {
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);
    if (currentWeekEnd > endDate) {
      currentWeekEnd.setTime(endDate.getTime());
    }

    const weekWorkouts = await prisma.workoutLog.findMany({
      where: {
        date: {
          gte: currentWeekStart.toISOString().split('T')[0],
          lte: currentWeekEnd.toISOString().split('T')[0],
        },
      },
    });

    const activeWeekPlayers = new Set(weekWorkouts.map(w => w.userId)).size;
    const weekMinutes = weekWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0);

    weeklyBreakdown.push({
      week: getISOWeek(currentWeekStart),
      activePlayers: activeWeekPlayers,
      avgScore: 0, // Simplified
      totalMinutes: weekMinutes,
    });

    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }

  const totalPlayers = users.length;
  const avgScore = totalPlayers > 0 ? Math.round(totalScore / totalPlayers) : 0;
  const avgCompliance = totalPlayers > 0 ? Math.round(totalCompliance / totalPlayers) : 0;
  const avgMinutesPerPlayer = totalPlayers > 0 ? Math.round(totalMinutes / totalPlayers) : 0;

  // Top performers
  const topPerformers = players
    .sort((a, b) => b.currentScore - a.currentScore)
    .slice(0, 3)
    .map(p => p.playerId);

  // Needs attention
  const needsAttention = players
    .filter(p => p.scoreTrend < -5 || p.compliance < 50)
    .sort((a, b) => a.scoreTrend - b.scoreTrend)
    .slice(0, 3)
    .map(p => p.playerId);

  // Sort improvements and declines
  improvements.sort((a, b) => b.improvement - a.improvement);
  declines.sort((a, b) => b.decline - a.decline);

  return {
    summary: {
      period: 'month',
      dateISO: startDateStr,
      totalPlayers,
      activePlayers,
      partialPlayers,
      absentPlayers,
      avgScore,
      avgCompliance,
      totalMinutes,
      avgMinutesPerPlayer,
      topPerformers,
      needsAttention,
    },
    players: players.sort((a, b) => b.currentScore - a.currentScore),
    weeklyBreakdown,
    improvements: improvements.slice(0, 5),
    declines: declines.slice(0, 5),
    generatedAt: new Date().toISOString(),
  };
}
