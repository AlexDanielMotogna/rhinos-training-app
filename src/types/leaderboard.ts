import type { Position } from './exercise';

export interface LeaderboardRow {
  rank: number;
  playerName: string;
  position: Position;
  scoreAvg: number;
  compliancePct: number;
  attendancePct: number;
  freeSharePct: number;
}
