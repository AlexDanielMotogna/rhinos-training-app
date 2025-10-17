import type { TrainingSession, RSVPStatus } from '../types/trainingSession';
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
 * Create a new training session
 */
export function createSession(session: Omit<TrainingSession, 'id' | 'createdAt'>): TrainingSession {
  const sessions = getAllSessions();
  const newSession: TrainingSession = {
    ...session,
    id: `session-${Date.now()}`,
    createdAt: new Date().toISOString(),
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
 * Notify all players about a new training session
 */
function notifyNewSession(session: TrainingSession): void {
  const usersKey = 'rhinos_users';
  const stored = localStorage.getItem(usersKey);
  const users = stored ? JSON.parse(stored) : [];

  users.forEach((user: any) => {
    if (user.id !== session.creatorId && user.role === 'player') {
      addNotification(user.id, {
        message: `${session.creatorName} created a training session: ${session.title} at ${session.location} on ${formatDate(session.date)} at ${session.time}`,
        type: 'info',
        ctaLabel: 'View Sessions',
        ctaLink: '/training-sessions',
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
