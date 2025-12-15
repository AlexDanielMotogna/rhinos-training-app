import type { TeamSession, AttendanceRow, Weekday } from '../types/attendance';
import { getAllTeamSessions } from './trainingSessions';

/**
 * Get all team training sessions from the database (past and future)
 * Returns sessions created by coaches
 */
export async function getUpcomingTeamSessions(): Promise<TeamSession[]> {
  try {
    const trainingSessions = await getAllTeamSessions();

    // Convert TrainingSession to TeamSession format
    return trainingSessions.map(session => {
      const [year, month, day] = session.date.split('-').map(Number);
      const [hours, minutes] = session.time.split(':').map(Number);

      const start = new Date(year, month - 1, day, hours, minutes, 0, 0);

      // Default end time: 2 hours after start
      const end = new Date(start);
      end.setHours(end.getHours() + 2);

      return {
        id: session.id,
        title: session.title,
        location: session.location,
        start,
        end,
      };
    });
  } catch (error) {
    console.error('Failed to load team sessions:', error);
    return [];
  }
}

/**
 * Convert team sessions to attendance rows with default status
 */
export function sessionsToAttendanceRows(
  sessions: TeamSession[],
  checkedInSessions: Set<string> = new Set()
): AttendanceRow[] {
  return sessions.map((session) => {
    const dateISO = session.start.toISOString().split('T')[0];
    const dayOfWeek = session.start.getDay();
    const weekdays: Weekday[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekday = weekdays[dayOfWeek];

    const startTime = session.start.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const endTime = session.end.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    return {
      dateISO,
      weekday,
      start: startTime,
      end: endTime,
      title: (session as any).title,
      location: (session as any).location,
      status: checkedInSessions.has(dateISO) ? 'on_time' : 'absent',
      editable: false, // Only coach can edit
    };
  });
}

/**
 * Check if current time is within check-in window (15 min before to 15 min after start)
 */
export function canCheckIn(session: TeamSession): boolean {
  const now = new Date();
  const start = session.start.getTime();
  const fifteenMin = 15 * 60 * 1000;

  return now.getTime() >= start - fifteenMin && now.getTime() <= start + fifteenMin;
}
