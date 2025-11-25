/**
 * Match/Game Types for Spielplan (Season Schedule)
 */

export type Conference = 'A' | 'B' | 'C' | 'D';

export interface Match {
  id: string;
  spielnummer: string;      // e.g., "25201"
  homeTeam: string;          // e.g., "Gladiators"
  awayTeam: string;          // e.g., "Rhinos"
  date: string;              // ISO date string "2025-03-29"
  kickoff: string;           // Time "14:00"
  spielort: string;          // Location "Colosseum Noricum"
  week: number;              // Week number (1-8)
  weekLabel: string;         // e.g., "Woche 1 - 29./30.März"
  conference: Conference;
  homeScore?: number | null;  // Home team score
  awayScore?: number | null;  // Away team score
  isRelegation?: boolean;    // Relegation game
  isSemifinal?: boolean;     // Semifinal
  isIronBowl?: boolean;      // Iron Bowl (Championship)
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MatchFormData {
  spielnummer: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  kickoff: string;
  spielort: string;
  week: number;
  weekLabel: string;
  conference: Conference;
  homeScore?: number | null;
  awayScore?: number | null;
  isRelegation?: boolean;
  isSemifinal?: boolean;
  isIronBowl?: boolean;
}

export interface WeekGroup {
  week: number;
  weekLabel: string;
  matches: Match[];
}

export interface ConferenceSchedule {
  conference: Conference;
  weeks: WeekGroup[];
}
