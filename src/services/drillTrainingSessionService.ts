import { drillTrainingSessionService as drillSessionApi } from './api';
import { isOnline } from './sync';

const DRILL_TRAINING_SESSIONS_KEY = 'rhinos_drill_training_sessions';

export interface DrillTrainingSession {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD format
  drills: string[]; // Array of drill IDs
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ========================================
// SYNC FUNCTIONS
// ========================================

export async function syncDrillTrainingSessionsFromBackend(): Promise<void> {
  if (!isOnline()) {
    console.log('📦 Offline - skipping drill training sessions sync');
    return;
  }

  try {
    console.log('🔄 Syncing drill training sessions from backend...');
    const backendSessions = await drillSessionApi.getAll();

    // Save in localStorage as cache
    localStorage.setItem(DRILL_TRAINING_SESSIONS_KEY, JSON.stringify(backendSessions));
    console.log(`✅ Drill training sessions synced successfully (${backendSessions.length} sessions)`);
  } catch (error) {
    console.warn('⚠️ Failed to sync drill training sessions:', error);
  }
}

// ========================================
// LOCAL STORAGE FUNCTIONS (Cache + Offline)
// ========================================

export const drillTrainingSessionService = {
  getAllSessions(): DrillTrainingSession[] {
    try {
      const data = localStorage.getItem(DRILL_TRAINING_SESSIONS_KEY);
      if (!data) return [];

      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) {
        console.error('[drillTrainingSessionService] getAllSessions: parsed data is not an array:', parsed);
        return [];
      }
      return parsed;
    } catch (error) {
      console.error('[drillTrainingSessionService] getAllSessions: error parsing data:', error);
      return [];
    }
  },

  getSessionById(id: string): DrillTrainingSession | undefined {
    const sessions = this.getAllSessions();
    return sessions.find(s => s.id === id);
  },

  async createSession(data: {
    name: string;
    date: string;
    drills: string[];
    notes?: string;
  }): Promise<DrillTrainingSession> {
    if (isOnline()) {
      try {
        // Create on backend
        const newSession = await drillSessionApi.create(data);

        // Update local cache
        const sessions = this.getAllSessions();
        sessions.push(newSession);
        localStorage.setItem(DRILL_TRAINING_SESSIONS_KEY, JSON.stringify(sessions));

        return newSession;
      } catch (error) {
        console.error('Failed to create session on backend:', error);
        throw error;
      }
    } else {
      throw new Error('Cannot create session while offline');
    }
  },

  async updateSession(
    id: string,
    data: {
      name?: string;
      date?: string;
      drills?: string[];
      notes?: string;
    }
  ): Promise<DrillTrainingSession> {
    if (isOnline()) {
      try {
        // Update on backend
        const updatedSession = await drillSessionApi.update(id, data);

        // Update local cache
        const sessions = this.getAllSessions();
        const index = sessions.findIndex(s => s.id === id);
        if (index !== -1) {
          sessions[index] = updatedSession;
          localStorage.setItem(DRILL_TRAINING_SESSIONS_KEY, JSON.stringify(sessions));
        }

        return updatedSession;
      } catch (error) {
        console.error('Failed to update session on backend:', error);
        throw error;
      }
    } else {
      throw new Error('Cannot update session while offline');
    }
  },

  async deleteSession(id: string): Promise<boolean> {
    if (isOnline()) {
      try {
        // Delete from backend
        await drillSessionApi.delete(id);

        // Update local cache
        const sessions = this.getAllSessions();
        const filtered = sessions.filter(s => s.id !== id);
        localStorage.setItem(DRILL_TRAINING_SESSIONS_KEY, JSON.stringify(filtered));

        return true;
      } catch (error) {
        console.error('Failed to delete session from backend:', error);
        throw error;
      }
    } else {
      throw new Error('Cannot delete session while offline');
    }
  },
};
