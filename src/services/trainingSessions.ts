/**
 * Training Sessions Service
 * Manages team and private training sessions with backend + IndexedDB + localStorage support
 */

import type { TrainingSession, RSVPStatus, CheckInStatus } from '../types/trainingSession';
import { addNotification } from './mock';
import { trainingSessionService } from './api';
import { db, addToOutbox } from './db';
import { isOnline } from './sync';

const SESSIONS_KEY = 'rhinos_training_sessions';

/**
 * Get all training sessions
 * Priority: Backend (if online) -> IndexedDB -> localStorage
 */
export async function getAllSessions(): Promise<TrainingSession[]> {
  const online = isOnline();

  try {
    if (online) {
      // Fetch from backend
      console.log('🔄 Fetching training sessions from backend...');
      const sessions = await trainingSessionService.getAll() as TrainingSession[];

      // Update caches
      await db.trainingSessions.clear();
      await db.trainingSessions.bulkPut(sessions.map(s => ({
        ...s,
        version: 1,
        updatedAt: new Date().toISOString(),
      })));
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));

      console.log(`✅ Loaded ${sessions.length} sessions from backend`);
      return sessions;
    } else {
      // Load from IndexedDB cache
      console.log('📦 Loading sessions from cache...');
      const cached = await db.trainingSessions.toArray();

      if (cached.length > 0) {
        console.log(`📦 Loaded ${cached.length} sessions from IndexedDB`);
        return cached as TrainingSession[];
      }

      // Fallback to localStorage
      const stored = localStorage.getItem(SESSIONS_KEY);
      const sessions = stored ? JSON.parse(stored) : [];
      console.log(`📦 Loaded ${sessions.length} sessions from localStorage`);
      return sessions;
    }
  } catch (error) {
    console.error('❌ Failed to load sessions:', error);

    // Fallback to IndexedDB
    const cached = await db.trainingSessions.toArray();
    if (cached.length > 0) {
      return cached as TrainingSession[];
    }

    // Last resort: localStorage
    const stored = localStorage.getItem(SESSIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  }
}

/**
 * Get upcoming training sessions (future dates)
 */
export async function getUpcomingSessions(): Promise<TrainingSession[]> {
  const sessions = await getAllSessions();
  const now = new Date();
  return sessions
    .filter(session => new Date(`${session.date}T${session.time}`) >= now)
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });
}

/**
 * Get team sessions only
 */
export async function getTeamSessions(): Promise<TrainingSession[]> {
  const sessions = await getUpcomingSessions();
  return sessions.filter(s => s.sessionCategory === 'team');
}

/**
 * Get private sessions only
 */
export async function getPrivateSessions(): Promise<TrainingSession[]> {
  const sessions = await getUpcomingSessions();
  return sessions.filter(s => s.sessionCategory === 'private');
}

/**
 * Create a new training session
 */
export async function createSession(session: Omit<TrainingSession, 'id' | 'createdAt'>): Promise<TrainingSession> {
  const online = isOnline();

  const newSession: TrainingSession = {
    ...session,
    id: `session-${Date.now()}`,
    createdAt: new Date().toISOString(),
    checkIns: session.sessionCategory === 'team' ? [] : undefined,
  };

  // Save to localStorage first (immediate feedback)
  const sessions = await getAllSessions();
  sessions.push(newSession);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));

  // Save to IndexedDB
  await db.trainingSessions.put({
    ...newSession,
    updatedAt: new Date().toISOString(),
  });

  // Try to save to backend
  if (online) {
    try {
      const created = await trainingSessionService.create({
        creatorId: session.creatorId,
        creatorName: session.creatorName,
        sessionCategory: session.sessionCategory,
        type: session.type,
        title: session.title,
        location: session.location,
        address: session.address,
        date: session.date,
        time: session.time,
        description: session.description,
        attendees: session.attendees,
      }) as TrainingSession;

      console.log('✅ Session saved to backend:', created.id);

      // Update local caches with backend ID
      newSession.id = created.id;
      await db.trainingSessions.put({
        ...created,
        updatedAt: created.updatedAt || new Date().toISOString(),
      });
    } catch (error) {
      console.warn('⚠️ Failed to save session to backend, will sync later:', error);
      await addToOutbox('trainingSession', 'create', newSession);
    }
  } else {
    // Queue for sync when online
    await addToOutbox('trainingSession', 'create', newSession);
    console.log('📦 Session queued for sync when online');
  }

  // Notify all players about the new session
  notifyNewSession(newSession);

  return newSession;
}

/**
 * Update RSVP status for a session
 */
export async function updateRSVP(sessionId: string, userId: string, userName: string, status: RSVPStatus): Promise<void> {
  const online = isOnline();

  // Update local cache first
  const sessions = await getAllSessions();
  const session = sessions.find(s => s.id === sessionId);

  if (!session) return;

  // Find or add attendee
  const attendeeIndex = session.attendees.findIndex(a => a.userId === userId);

  if (attendeeIndex >= 0) {
    session.attendees[attendeeIndex].status = status;
  } else {
    session.attendees.push({ userId, userName, status });
  }

  // Update caches
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  await db.trainingSessions.put({
    ...session,
    updatedAt: new Date().toISOString(),
  });

  // Try to update backend
  if (online) {
    try {
      await trainingSessionService.updateRSVP(sessionId, userId, status);
      console.log('✅ RSVP updated on backend');
    } catch (error) {
      console.warn('⚠️ Failed to update RSVP on backend, will sync later:', error);
      await addToOutbox('trainingSession', 'rsvp', { sessionId, userId, status });
    }
  } else {
    await addToOutbox('trainingSession', 'rsvp', { sessionId, userId, status });
    console.log('📦 RSVP queued for sync when online');
  }
}

/**
 * Delete a training session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const online = isOnline();

  // Remove from caches
  const sessions = await getAllSessions();
  const filtered = sessions.filter(s => s.id !== sessionId);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(filtered));
  await db.trainingSessions.delete(sessionId);

  // Try to delete from backend
  if (online) {
    try {
      await trainingSessionService.delete(sessionId);
      console.log('✅ Session deleted from backend');
    } catch (error) {
      console.warn('⚠️ Failed to delete session from backend:', error);
      await addToOutbox('trainingSession', 'delete', { sessionId });
    }
  } else {
    await addToOutbox('trainingSession', 'delete', { sessionId });
    console.log('📦 Delete queued for sync when online');
  }
}

/**
 * Check if user can check in to a team session (15 min before to 15 min after start)
 */
export function canCheckIn(session: TrainingSession): boolean {
  if (session.sessionCategory !== 'team') return false;

  const now = new Date();
  const sessionStart = new Date(`${session.date}T${session.time}`);
  const fifteenMin = 15 * 60 * 1000;

  return now.getTime() >= sessionStart.getTime() - fifteenMin &&
         now.getTime() <= sessionStart.getTime() + fifteenMin;
}

/**
 * Check in user to a team session
 */
export async function checkInToSession(sessionId: string, userId: string, userName: string): Promise<void> {
  const online = isOnline();

  const sessions = await getAllSessions();
  const session = sessions.find(s => s.id === sessionId);

  if (!session || session.sessionCategory !== 'team') return;

  // Initialize checkIns array if not exists
  if (!session.checkIns) {
    session.checkIns = [];
  }

  // Check if already checked in
  const existingCheckIn = session.checkIns.find(c => c.userId === userId);
  if (existingCheckIn) return;

  // Determine status based on time
  const now = new Date();
  const sessionStart = new Date(`${session.date}T${session.time}`);
  const status: CheckInStatus = now <= sessionStart ? 'on_time' : 'late';

  session.checkIns.push({
    userId,
    userName,
    checkedInAt: now.toISOString(),
    status,
  });

  // Update caches
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  await db.trainingSessions.put({
    ...session,
    updatedAt: new Date().toISOString(),
  });

  // Try to update backend
  if (online) {
    try {
      await trainingSessionService.checkIn(sessionId, userId);
      console.log('✅ Check-in saved to backend');
    } catch (error) {
      console.warn('⚠️ Failed to save check-in to backend, will sync later:', error);
      await addToOutbox('trainingSession', 'checkin', { sessionId, userId });
    }
  } else {
    await addToOutbox('trainingSession', 'checkin', { sessionId, userId });
    console.log('📦 Check-in queued for sync when online');
  }
}

/**
 * Get check-in status for a user in a session
 */
export function getCheckInStatus(session: TrainingSession, userId: string): CheckInStatus | null {
  if (session.sessionCategory !== 'team') return null;

  const checkIn = session.checkIns?.find(c => c.userId === userId);
  if (checkIn) return checkIn.status;

  // If session time has passed and user didn't check in, they're absent
  const now = new Date();
  const sessionEnd = new Date(`${session.date}T${session.time}`);
  sessionEnd.setMinutes(sessionEnd.getMinutes() + 15); // 15 min after start

  if (now > sessionEnd) return 'absent';

  return null;
}

/**
 * Notify all players about a new training session
 */
function notifyNewSession(session: TrainingSession): void {
  const usersKey = 'rhinos_users';
  const stored = localStorage.getItem(usersKey);
  const users = stored ? JSON.parse(stored) : [];

  users.forEach((user: any) => {
    if (user.id !== session.creatorId && user.role === 'player') {
      addNotification({
        type: 'new_plan',
        title: 'New Training Session',
        message: `${session.creatorName} created a training session: ${session.title} at ${session.location} on ${formatDate(session.date)} at ${session.time}`,
        timestamp: new Date(),
        read: false,
        actionUrl: '/training-sessions',
      });
    }
  });
}

/**
 * Format date for display
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
