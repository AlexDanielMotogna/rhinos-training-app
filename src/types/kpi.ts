export type PlayerLabel = 'MACHINE' | 'STEADY' | 'IRREGULAR' | 'LAZY';

export interface PerformanceScore {
  score: number;
  change: number | null; // Change since last test (null if no previous test)
  lastTestDate: string | null;
}

export interface KPISnapshot {
  // This Week
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

  // Performance Scores
  strengthScore: PerformanceScore;
  speedScore: PerformanceScore;
  powerScore: PerformanceScore;
  agilityScore: PerformanceScore;

  // Attendance
  totalTeamSessionsAttended: number;
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
