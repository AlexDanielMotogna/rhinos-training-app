/**
 * Training Sessions Service
 * Manages team and private training sessions
 */

import type { TrainingSession, RSVPStatus, CheckInStatus } from '../types/trainingSession';
import { addNotification } from './mock';
import { trainingSessionService } from './api';

/**
 * Get all training sessions from backend
 */
export async function getAllSessions(): Promise<TrainingSession[]> {
  try {
    console.log('🔄 Fetching training sessions from backend...');
    const backendSessions = await trainingSessionService.getAll() as TrainingSession[];
    console.log(`✅ Loaded ${backendSessions.length} sessions from backend`);
    return backendSessions;
  } catch (error) {
    console.error('❌ Failed to load sessions from backend:', error);
    throw error;
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

    console.log('✅ Session created on backend:', created.id);

    // Notify all players about the new session
    notifyNewSession(created);

    return created;
  } catch (error) {
    console.error('❌ Failed to create session:', error);
    throw error;
  }
}

/**
 * Update RSVP status for a session
 */
export async function updateRSVP(sessionId: string, userId: string, userName: string, status: RSVPStatus): Promise<void> {

  try {
    await trainingSessionService.updateRSVP(sessionId, userId, status);
    console.log('✅ RSVP updated on backend');
  } catch (error) {
    console.error('❌ Failed to update RSVP:', error);
    throw error;
  }
}

/**
 * Delete a training session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  try {
    await trainingSessionService.delete(sessionId);
    console.log('✅ Session deleted from backend');
  } catch (error) {
    console.error('❌ Failed to delete session:', error);
    throw error;
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
  try {
    await trainingSessionService.checkIn(sessionId, userId);
    console.log('✅ Check-in saved to backend');
  } catch (error) {
    console.error('❌ Failed to check in:', error);
    throw error;
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
