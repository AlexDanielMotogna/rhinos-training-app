/**
 * Division and Team types for season management
 */

export interface Team {
  id: string;
  name: string;
  divisionId: string;
  logoUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Division {
  id: string;
  name: string;
  conference: 'A' | 'B' | 'C' | 'D';
  season: string; // e.g., "2025"
  teams: Team[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DivisionFormData {
  name: string;
  conference: 'A' | 'B' | 'C' | 'D';
  season: string;
}

export interface TeamFormData {
  name: string;
  divisionId: string;
  logoUrl?: string;
}

export interface DivisionStandings {
  divisionId: string;
  divisionName: string;
  standings: TeamStanding[];
}

export interface TeamStanding {
  teamId: string;
  teamName: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  pointsDiff: number;
}
