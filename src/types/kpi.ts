export type PlayerLabel = 'MACHINE' | 'STEADY' | 'IRREGULAR' | 'LAZY';

export interface PerformanceScore {
  score: number;
  change: number | null; // Change since last test (null if no previous test)
  lastTestDate: string | null;
}

export interface KPISnapshot {
  // Selected Week (or current if not specified)
  currentWeek: number; // Week number (1-52)
  totalWeeks: number; // Total weeks in year (52)
  trainingCompliance: number; // Overall compliance percentage
  coachPlansCompleted: number;
  coachPlansAssigned: number;
  teamSessionsAttended: number;
  teamSessionsTotal: number;
  freeWorkouts: number;
  freeWorkoutsMinutes: number;
  totalVolume: number; // Total minutes this week

  // Overall Totals (all time)
  overallTotalWorkouts: number;
  overallTotalMinutes: number;
  overallCoachWorkouts: number;
  overallFreeWorkouts: number;

  // Performance Scores
  strengthScore: PerformanceScore;
  speedScore: PerformanceScore;
  powerScore: PerformanceScore;
  agilityScore: PerformanceScore;

  // Attendance (based on poll votes)
  totalTeamSessionsAttended: number; // Voted 'training' or 'present'
  totalTeamSessionsScheduled: number;
  attendanceRate: number; // Percentage
  attendanceStatus: 'on_time' | 'late' | 'absent' | 'no_recent_session';
}

export interface ProjectionRow {
  week: number;
  score: number;
  compliance: number;
  totalMin: number;
}
