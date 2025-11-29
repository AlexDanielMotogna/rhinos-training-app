import { isOnline } from './online';
import type { Match, MatchFormData } from '../types/match';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const STORAGE_KEY = 'rhinos_matches';

/**
 * Match service with backend support and offline fallback
 */

// Helper to sync matches from backend to localStorage
async function syncMatchesFromBackend(): Promise<Match[]> {
  if (!isOnline()) {
    return getMatchesFromStorage();
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/matches`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const matches = await response.json();

    // Store in localStorage as cache
    localStorage.setItem(STORAGE_KEY, JSON.stringify(matches));

    return matches.map((m: any) => ({
      ...m,
      createdAt: m.createdAt ? new Date(m.createdAt) : undefined,
      updatedAt: m.updatedAt ? new Date(m.updatedAt) : undefined,
    }));
  } catch (error) {
    console.error('Failed to sync matches from backend:', error);
    // Fallback to localStorage
    return getMatchesFromStorage();
  }
}

function getMatchesFromStorage(): Match[] {
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
  } catch (error) {
    console.error('Failed to load matches from storage:', error);
  }
  return [];
}

export async function getAllMatches(): Promise<Match[]> {
  return syncMatchesFromBackend();
}

export async function getMatchById(id: string): Promise<Match | null> {
  if (isOnline()) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/matches/${id}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const match = await response.json();
      return {
        ...match,
        createdAt: match.createdAt ? new Date(match.createdAt) : undefined,
        updatedAt: match.updatedAt ? new Date(match.updatedAt) : undefined,
      };
    } catch (error) {
      console.error('Failed to fetch match from backend:', error);
    }
  }

  // Fallback to local storage
  const matches = getMatchesFromStorage();
  return matches.find(m => m.id === id) || null;
}

export async function getMatchesByConference(conference: string): Promise<Match[]> {
  if (isOnline()) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/matches/conference/${conference}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const matches = await response.json();
      return matches.map((m: any) => ({
        ...m,
        createdAt: m.createdAt ? new Date(m.createdAt) : undefined,
        updatedAt: m.updatedAt ? new Date(m.updatedAt) : undefined,
      }));
    } catch (error) {
      console.error('Failed to fetch matches by conference:', error);
    }
  }

  const matches = getMatchesFromStorage();
  return matches.filter(m => m.conference === conference);
}

export async function getMatchesByWeek(week: number): Promise<Match[]> {
  if (isOnline()) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/matches/week/${week}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const matches = await response.json();
      return matches.map((m: any) => ({
        ...m,
        createdAt: m.createdAt ? new Date(m.createdAt) : undefined,
        updatedAt: m.updatedAt ? new Date(m.updatedAt) : undefined,
      }));
    } catch (error) {
      console.error('Failed to fetch matches by week:', error);
    }
  }

  const matches = getMatchesFromStorage();
  return matches.filter(m => m.week === week);
}

export async function getMatchesByTeam(teamName: string): Promise<Match[]> {
  if (isOnline()) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/matches/team/${teamName}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const matches = await response.json();
      return matches.map((m: any) => ({
        ...m,
        createdAt: m.createdAt ? new Date(m.createdAt) : undefined,
        updatedAt: m.updatedAt ? new Date(m.updatedAt) : undefined,
      }));
    } catch (error) {
      console.error('Failed to fetch matches by team:', error);
    }
  }

  const matches = getMatchesFromStorage();
  return matches.filter(m => m.homeTeam === teamName || m.awayTeam === teamName);
}

export async function createMatch(data: MatchFormData, createdBy: string): Promise<Match> {
  if (isOnline()) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...data, createdBy }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create match');
      }

      const match = await response.json();

      // Update cache
      await syncMatchesFromBackend();

      return {
        ...match,
        createdAt: match.createdAt ? new Date(match.createdAt) : undefined,
        updatedAt: match.updatedAt ? new Date(match.updatedAt) : undefined,
      };
    } catch (error) {
      console.error('Failed to create match on backend:', error);
      throw error;
    }
  }

  // Offline fallback (localStorage)
  const matches = getMatchesFromStorage();
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
  if (isOnline()) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/matches/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update match');
      }

      const match = await response.json();

      // Update cache
      await syncMatchesFromBackend();

      return {
        ...match,
        createdAt: match.createdAt ? new Date(match.createdAt) : undefined,
        updatedAt: match.updatedAt ? new Date(match.updatedAt) : undefined,
      };
    } catch (error) {
      console.error('Failed to update match on backend:', error);
      throw error;
    }
  }

  // Offline fallback
  const matches = getMatchesFromStorage();
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
  if (isOnline()) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/matches/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete match');
      }

      // Update cache
      await syncMatchesFromBackend();
      return;
    } catch (error) {
      console.error('Failed to delete match on backend:', error);
      throw error;
    }
  }

  // Offline fallback
  const matches = getMatchesFromStorage();
  const filtered = matches.filter(m => m.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export async function bulkCreateMatches(matchesData: MatchFormData[], createdBy: string): Promise<Match[]> {
  if (isOnline()) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/matches/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ matches: matchesData, createdBy }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to bulk create matches');
      }

      // Update cache
      const allMatches = await syncMatchesFromBackend();
      return allMatches;
    } catch (error) {
      console.error('Failed to bulk create matches on backend:', error);
      throw error;
    }
  }

  // Offline fallback
  const existingMatches = getMatchesFromStorage();
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
  if (isOnline()) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/matches`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to clear all matches');
      }

      // Clear cache
      localStorage.removeItem(STORAGE_KEY);
      return;
    } catch (error) {
      console.error('Failed to clear matches on backend:', error);
      throw error;
    }
  }

  // Offline fallback
  localStorage.removeItem(STORAGE_KEY);
}
