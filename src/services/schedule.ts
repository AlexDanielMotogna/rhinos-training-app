import type { TeamSession, AttendanceRow, Weekday } from '../types/attendance';

/**
 * Generate team training sessions for Tue & Thu 19:00-21:00 (Europe/Vienna)
 * Returns the next 4 sessions from today
 */
export function getUpcomingTeamSessions(): TeamSession[] {
  const sessions: TeamSession[] = [];
  const now = new Date();
  const viennaTZ = 'Europe/Vienna';

  // Get next 14 days to ensure we capture at least 4 Tue/Thu
  for (let i = 0; i < 14; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);

    const dayOfWeek = date.getDay();
    // Tuesday = 2, Thursday = 4
    if (dayOfWeek === 2 || dayOfWeek === 4) {
      const start = new Date(date);
      start.setHours(19, 0, 0, 0);

      const end = new Date(date);
      end.setHours(21, 0, 0, 0);

      sessions.push({ start, end });

      if (sessions.length >= 4) break;
    }
  }

  return sessions;
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
    const weekday: Weekday = dayOfWeek === 2 ? 'Tue' : 'Thu';

    return {
      dateISO,
      weekday,
      start: '19:00',
      end: '21:00',
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
