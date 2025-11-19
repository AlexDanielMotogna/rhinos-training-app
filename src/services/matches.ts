import type { Match, MatchFormData } from '../types/match';

const STORAGE_KEY = 'rhinos_matches';

/**
 * Mock service for match schedule (Spielplan)
 * This will be replaced with real API calls when backend is available
 */

export async function getAllMatches(): Promise<Match[]> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const matches = JSON.parse(stored);
      return matches.map((m: any) => ({
        ...m,
        createdAt: m.createdAt ? new Date(m.createdAt) : undefined,
        updatedAt: m.updatedAt ? new Date(m.updatedAt) : undefined,
      }));
    }
    return [];
  } catch (error) {
    console.error('Failed to load matches:', error);
    return [];
  }
}

export async function getMatchById(id: string): Promise<Match | null> {
  const matches = await getAllMatches();
  return matches.find(m => m.id === id) || null;
}

export async function getMatchesByConference(conference: string): Promise<Match[]> {
  const matches = await getAllMatches();
  return matches.filter(m => m.conference === conference);
}

export async function getMatchesByWeek(week: number): Promise<Match[]> {
  const matches = await getAllMatches();
  return matches.filter(m => m.week === week);
}

export async function getMatchesByTeam(teamName: string): Promise<Match[]> {
  const matches = await getAllMatches();
  return matches.filter(
    m => m.homeTeam === teamName || m.awayTeam === teamName
  );
}

export async function createMatch(data: MatchFormData, createdBy: string): Promise<Match> {
  const matches = await getAllMatches();

  const newMatch: Match = {
    id: Date.now().toString(),
    ...data,
    createdBy,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  matches.push(newMatch);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(matches));

  return newMatch;
}

export async function updateMatch(id: string, data: Partial<MatchFormData>): Promise<Match> {
  const matches = await getAllMatches();
  const index = matches.findIndex(m => m.id === id);

  if (index === -1) {
    throw new Error('Match not found');
  }

  const updatedMatch: Match = {
    ...matches[index],
    ...data,
    updatedAt: new Date(),
  };

  matches[index] = updatedMatch;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(matches));

  return updatedMatch;
}

export async function deleteMatch(id: string): Promise<void> {
  const matches = await getAllMatches();
  const filtered = matches.filter(m => m.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export async function bulkCreateMatches(matchesData: MatchFormData[], createdBy: string): Promise<Match[]> {
  const existingMatches = await getAllMatches();

  const newMatches: Match[] = matchesData.map((data, index) => ({
    id: (Date.now() + index).toString(),
    ...data,
    createdBy,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  const allMatches = [...existingMatches, ...newMatches];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allMatches));

  return newMatches;
}

export async function clearAllMatches(): Promise<void> {
  localStorage.removeItem(STORAGE_KEY);
}
