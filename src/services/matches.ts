import type { Match, MatchFormData } from '../types/match';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * Match service - backend only
 */

export async function getAllMatches(): Promise<Match[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/matches`, {
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
    console.error('Failed to fetch matches:', error);
    throw error;
  }
}

export async function getMatchById(id: string): Promise<Match | null> {
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
    console.error('Failed to fetch match:', error);
    throw error;
  }
}

export async function getMatchesByConference(conference: string): Promise<Match[]> {
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
    throw error;
  }
}

export async function getMatchesByWeek(week: number): Promise<Match[]> {
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
    throw error;
  }
}

export async function getMatchesByTeam(teamName: string): Promise<Match[]> {
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
    throw error;
  }
}

export async function createMatch(data: MatchFormData, createdBy: string): Promise<Match> {
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
    return {
      ...match,
      createdAt: match.createdAt ? new Date(match.createdAt) : undefined,
      updatedAt: match.updatedAt ? new Date(match.updatedAt) : undefined,
    };
  } catch (error) {
    console.error('Failed to create match:', error);
    throw error;
  }
}

export async function updateMatch(id: string, data: Partial<MatchFormData>): Promise<Match> {
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
    return {
      ...match,
      createdAt: match.createdAt ? new Date(match.createdAt) : undefined,
      updatedAt: match.updatedAt ? new Date(match.updatedAt) : undefined,
    };
  } catch (error) {
    console.error('Failed to update match:', error);
    throw error;
  }
}

export async function deleteMatch(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/matches/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete match');
    }
  } catch (error) {
    console.error('Failed to delete match:', error);
    throw error;
  }
}

export async function bulkCreateMatches(matchesData: MatchFormData[], createdBy: string): Promise<Match[]> {
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

    const matches = await response.json();
    return matches.map((m: any) => ({
      ...m,
      createdAt: m.createdAt ? new Date(m.createdAt) : undefined,
      updatedAt: m.updatedAt ? new Date(m.updatedAt) : undefined,
    }));
  } catch (error) {
    console.error('Failed to bulk create matches:', error);
    throw error;
  }
}

export async function clearAllMatches(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/matches`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to clear all matches');
    }
  } catch (error) {
    console.error('Failed to clear matches:', error);
    throw error;
  }
}
