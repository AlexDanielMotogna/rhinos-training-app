import type { Position } from './exercise';

export type ReportPeriod = 'day' | 'week' | 'month';

export type PlayerStatus = 'active' | 'partial' | 'absent';

export interface PlayerDailyReport {
  playerId: string;
  playerName: string;
  position: Position;
  ageCategory?: string;
  status: PlayerStatus;
  workoutsCompleted: number;
  workoutsAssigned: number; // Based on frequencyPerWeek from assigned training plan
  minutesTrained: number;
  currentScore: number;
  previousScore: number;
  scoreTrend: number; // percentage change
  compliance: number; // 0-100
  attendance: boolean;
  lastActive: string; // ISO date
  daysTrainedInPeriod?: number; // For weekly/monthly reports
  totalDaysInPeriod?: number; // For weekly/monthly reports (7 for week, ~30 for month)
  teamSessionsAttended?: number; // For weekly/monthly reports
  totalTeamSessions?: number; // For weekly/monthly reports
  frequencyPerWeek?: string; // From training plan (e.g., "2-3", "3", "4-5")
}

export interface TeamSession {
  date: string; // ISO date
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  playersAttended: number;
  totalPlayers: number;
  location?: string; // Venue/facility name
  address?: string; // City/address
}

export interface ReportSummary {
  period: ReportPeriod;
  dateISO: string;
  totalPlayers: number;
  activePlayers: number; // trained something
  partialPlayers: number; // trained but not all assigned
  absentPlayers: number; // didn't train
  avgScore: number;
  avgCompliance: number;
  totalMinutes: number;
  avgMinutesPerPlayer: number;
  topPerformers: string[]; // player IDs
  needsAttention: string[]; // player IDs with declining performance
  teamSessions?: TeamSession[]; // Team training sessions (for daily/weekly/monthly)
}

export interface DailyReport {
  summary: ReportSummary;
  players: PlayerDailyReport[];
  generatedAt: string; // ISO datetime
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
    improvement: number; // percentage
  }[];
  declines: {
    playerId: string;
    playerName: string;
    decline: number; // percentage
  }[];
  generatedAt: string;
}
