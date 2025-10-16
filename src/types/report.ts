import type { Position } from './exercise';

export type ReportPeriod = 'day' | 'week' | 'month';

export type PlayerStatus = 'active' | 'partial' | 'absent';

export interface PlayerDailyReport {
  playerId: string;
  playerName: string;
  position: Position;
  status: PlayerStatus;
  workoutsCompleted: number;
  workoutsAssigned: number;
  minutesTrained: number;
  currentScore: number;
  previousScore: number;
  scoreTrend: number; // percentage change
  compliance: number; // 0-100
  attendance: boolean;
  lastActive: string; // ISO date
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
