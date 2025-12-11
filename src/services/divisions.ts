import type { Division, DivisionFormData, Team, TeamFormData } from '../types/division';

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

/**
 * Division service - backend only
 */

// Division CRUD operations
export async function getAllDivisions(): Promise<Division[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/divisions`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const divisions = await response.json();
    return divisions.map((d: any) => ({
      ...d,
      createdAt: d.createdAt ? new Date(d.createdAt) : undefined,
      updatedAt: d.updatedAt ? new Date(d.updatedAt) : undefined,
    }));
  } catch (error) {
    console.error('Failed to fetch divisions:', error);
    throw error;
  }
}

export async function getDivisionById(id: string): Promise<Division | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/divisions/${id}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const division = await response.json();
    return {
      ...division,
      createdAt: division.createdAt ? new Date(division.createdAt) : undefined,
      updatedAt: division.updatedAt ? new Date(division.updatedAt) : undefined,
    };
  } catch (error) {
    console.error('Failed to fetch division:', error);
    throw error;
  }
}

export async function getDivisionsBySeason(season: string): Promise<Division[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/divisions/season/${season}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const divisions = await response.json();
    return divisions.map((d: any) => ({
      ...d,
      createdAt: d.createdAt ? new Date(d.createdAt) : undefined,
      updatedAt: d.updatedAt ? new Date(d.updatedAt) : undefined,
    }));
  } catch (error) {
    console.error('Failed to fetch divisions by season:', error);
    throw error;
  }
}

export async function createDivision(data: DivisionFormData): Promise<Division> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/divisions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create division');
    }

    const division = await response.json();
    return {
      ...division,
      createdAt: division.createdAt ? new Date(division.createdAt) : undefined,
      updatedAt: division.updatedAt ? new Date(division.updatedAt) : undefined,
    };
  } catch (error) {
    console.error('Failed to create division:', error);
    throw error;
  }
}

export async function updateDivision(id: string, data: Partial<DivisionFormData>): Promise<Division> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/divisions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update division');
    }

    const division = await response.json();
    return {
      ...division,
      createdAt: division.createdAt ? new Date(division.createdAt) : undefined,
      updatedAt: division.updatedAt ? new Date(division.updatedAt) : undefined,
    };
  } catch (error) {
    console.error('Failed to update division:', error);
    throw error;
  }
}

export async function deleteDivision(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/divisions/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete division');
    }
  } catch (error) {
    console.error('Failed to delete division:', error);
    throw error;
  }
}

// Team CRUD operations
export async function getAllTeams(): Promise<Team[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/teams`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const teams = await response.json();
    return teams.map((t: any) => ({
      ...t,
      createdAt: t.createdAt ? new Date(t.createdAt) : undefined,
      updatedAt: t.updatedAt ? new Date(t.updatedAt) : undefined,
    }));
  } catch (error) {
    console.error('Failed to fetch teams:', error);
    throw error;
  }
}

export async function getTeamById(id: string): Promise<Team | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/teams/${id}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const team = await response.json();
    return {
      ...team,
      createdAt: team.createdAt ? new Date(team.createdAt) : undefined,
      updatedAt: team.updatedAt ? new Date(team.updatedAt) : undefined,
    };
  } catch (error) {
    console.error('Failed to fetch team:', error);
    throw error;
  }
}

export async function getTeamsByDivision(divisionId: string): Promise<Team[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/teams/division/${divisionId}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const teams = await response.json();
    return teams.map((t: any) => ({
      ...t,
      createdAt: t.createdAt ? new Date(t.createdAt) : undefined,
      updatedAt: t.updatedAt ? new Date(t.updatedAt) : undefined,
    }));
  } catch (error) {
    console.error('Failed to fetch teams by division:', error);
    throw error;
  }
}

export async function createTeam(data: TeamFormData): Promise<Team> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create team');
    }

    const team = await response.json();
    return {
      ...team,
      createdAt: team.createdAt ? new Date(team.createdAt) : undefined,
      updatedAt: team.updatedAt ? new Date(team.updatedAt) : undefined,
    };
  } catch (error) {
    console.error('Failed to create team:', error);
    throw error;
  }
}

export async function updateTeam(id: string, data: Partial<TeamFormData>): Promise<Team> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/teams/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update team');
    }

    const team = await response.json();
    return {
      ...team,
      createdAt: team.createdAt ? new Date(team.createdAt) : undefined,
      updatedAt: team.updatedAt ? new Date(team.updatedAt) : undefined,
    };
  } catch (error) {
    console.error('Failed to update team:', error);
    throw error;
  }
}

export async function deleteTeam(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/teams/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete team');
    }
  } catch (error) {
    console.error('Failed to delete team:', error);
    throw error;
  }
}
