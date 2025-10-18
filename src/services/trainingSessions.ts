import type { TrainingSession, RSVPStatus, CheckInStatus } from '../types/trainingSession';
import { addNotification } from './mock';

const SESSIONS_KEY = 'rhinos_training_sessions';

/**
 * Get all training sessions
 */
export function getAllSessions(): TrainingSession[] {
  const stored = localStorage.getItem(SESSIONS_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Get upcoming training sessions (future dates)
 */
export function getUpcomingSessions(): TrainingSession[] {
  const sessions = getAllSessions();
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
export function getTeamSessions(): TrainingSession[] {
  return getUpcomingSessions().filter(s => s.sessionCategory === 'team');
}

/**
 * Get private sessions only
 */
export function getPrivateSessions(): TrainingSession[] {
  return getUpcomingSessions().filter(s => s.sessionCategory === 'private');
}

/**
 * Create a new training session
 */
export function createSession(session: Omit<TrainingSession, 'id' | 'createdAt'>): TrainingSession {
  const sessions = getAllSessions();
  const newSession: TrainingSession = {
    ...session,
    id: `session-${Date.now()}`,
    createdAt: new Date().toISOString(),
    checkIns: session.sessionCategory === 'team' ? [] : undefined,
  };

  sessions.push(newSession);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));

  // Notify all players about the new session
  notifyNewSession(newSession);

  return newSession;
}

/**
 * Update RSVP status for a session
 */
export function updateRSVP(sessionId: string, userId: string, userName: string, status: RSVPStatus): void {
  const sessions = getAllSessions();
  const session = sessions.find(s => s.id === sessionId);

  if (!session) return;

  // Find or add attendee
  const attendeeIndex = session.attendees.findIndex(a => a.userId === userId);

  if (attendeeIndex >= 0) {
    session.attendees[attendeeIndex].status = status;
  } else {
    session.attendees.push({ userId, userName, status });
  }

  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

/**
 * Delete a training session
 */
export function deleteSession(sessionId: string): void {
  const sessions = getAllSessions();
  const filtered = sessions.filter(s => s.id !== sessionId);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(filtered));
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
export function checkInToSession(sessionId: string, userId: string, userName: string): void {
  const sessions = getAllSessions();
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

  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
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
