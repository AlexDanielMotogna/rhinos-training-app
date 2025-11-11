import Dexie, { Table } from 'dexie';

// ========================================
// DATABASE SCHEMA (IndexedDB)
// ========================================

export interface LocalTrainingSession {
  id: string;
  creatorId: string;
  creatorName: string;
  sessionCategory: 'team' | 'private';
  type: 'gym' | 'outdoor' | 'coach-plan' | 'free-training';
  title: string;
  location: string;
  address?: string;
  date: string; // ISO date
  time: string; // HH:mm
  description?: string;
  attendees: Array<{
    userId: string;
    userName: string;
    status: 'going' | 'maybe' | 'not-going' | 'pending';
  }>;
  checkIns?: Array<{
    userId: string;
    userName: string;
    status: string;
    time: string;
  }>;
  // Metadata for sync
  version: number;
  updatedAt: string; // ISO datetime
  syncedAt?: string; // Last sync time
  isPinned?: boolean; // User manually pinned for offline
}

export interface LocalAttendance {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  status: 'present' | 'absent' | 'late';
  checkInTime?: string;
  notes?: string;
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface LocalWorkout {
  id: string;
  userId: string;
  planId?: string;
  trainingType: 'strength' | 'sprints';
  completedAt: string; // ISO datetime
  exercises: Array<{
    exerciseId: string;
    name: string;
    sets: Array<{
      reps?: number;
      kg?: number;
      rpe?: number;
      time?: string;
      distance?: number;
    }>;
  }>;
  notes?: string;
  // Metadata
  syncedAt?: string;
}

export interface OutboxItem {
  id: string;
  entity: 'training' | 'attendance' | 'workout' | 'user' | 'assignment' | 'trainingSession' | 'rsvp' | 'checkin' | 'attendancePoll' | 'userPlan';
  action: 'create' | 'update' | 'delete' | 'rsvp' | 'checkin' | 'vote' | 'close';
  data: any;
  timestamp: number;
  retries: number;
  error?: string;
}

export interface LocalUser {
  id: string;
  email: string;
  name: string;
  role: 'player' | 'coach';
  jerseyNumber?: number;
  position?: string;
  age?: number;
  weightKg?: number;
  heightCm?: number;
  sex?: 'male' | 'female';
  avatarUrl?: string;
  // Metadata
  lastSyncedAt?: string;
}

export interface LocalTrainingType {
  id: string;
  key: string;
  nameEN: string;
  nameDE: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  // Metadata
  syncedAt?: string;
}

export interface LocalTrainingAssignment {
  id: string;
  templateId: string;
  playerIds: string[];
  assignedBy: string;
  startDate: string;
  endDate?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  // Enriched template data (cached for offline)
  template?: {
    id: string;
    trainingTypeId: string;
    trainingTypeName: string;
    positions: string[];
    blocks: any[];
    durationWeeks: number;
    frequencyPerWeek: string;
    weeklyNotes: string;
  };
  // Metadata
  syncedAt?: string;
}

export interface LocalAttendancePoll {
  id: string;
  sessionId: string;
  sessionName: string;
  sessionDate: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
  votes: Array<{
    userId: string;
    userName: string;
    option: 'training' | 'present' | 'absent';
    timestamp: string;
  }>;
  // Metadata
  updatedAt: string;
}

// ========================================
// DEXIE DATABASE CLASS
// ========================================

class RhinosDatabase extends Dexie {
  trainingSessions!: Table<LocalTrainingSession, string>;
  attendance!: Table<LocalAttendance, string>;
  workouts!: Table<LocalWorkout, string>;
  users!: Table<LocalUser, string>;
  trainingTypes!: Table<LocalTrainingType, string>;
  trainingAssignments!: Table<LocalTrainingAssignment, string>;
  exercises!: Table<any, string>;
  attendancePolls!: Table<LocalAttendancePoll, string>;
  outbox!: Table<OutboxItem, string>;

  constructor() {
    super('RhinosTrainingDB');

    // Version 1: Original schema
    this.version(1).stores({
      trainingSessions: 'id, date, sessionCategory, isPinned, updatedAt',
      attendance: 'id, sessionId, userId, updatedAt',
      workouts: 'id, userId, completedAt, syncedAt',
      users: 'id, email, role',
      outbox: 'id, entity, timestamp',
    });

    // Version 2: Add training types and assignments for offline support
    this.version(2).stores({
      trainingSessions: 'id, date, sessionCategory, isPinned, updatedAt',
      attendance: 'id, sessionId, userId, updatedAt',
      workouts: 'id, userId, completedAt, syncedAt',
      users: 'id, email, role',
      trainingTypes: 'id, key, isActive, syncedAt',
      trainingAssignments: 'id, templateId, assignedBy, active, syncedAt, *playerIds',
      outbox: 'id, entity, timestamp',
    });

    // Version 3: Add exercises for My Plans offline support
    this.version(3).stores({
      trainingSessions: 'id, date, sessionCategory, isPinned, updatedAt',
      attendance: 'id, sessionId, userId, updatedAt',
      workouts: 'id, userId, completedAt, syncedAt',
      users: 'id, email, role',
      trainingTypes: 'id, key, isActive, syncedAt',
      trainingAssignments: 'id, templateId, assignedBy, active, syncedAt, *playerIds',
      exercises: 'id, name, category, isGlobal',
      outbox: 'id, entity, timestamp',
    });

    // Version 4: Add attendance polls for offline support
    this.version(4).stores({
      trainingSessions: 'id, date, sessionCategory, isPinned, updatedAt',
      attendance: 'id, sessionId, userId, updatedAt',
      workouts: 'id, userId, completedAt, syncedAt',
      users: 'id, email, role',
      trainingTypes: 'id, key, isActive, syncedAt',
      trainingAssignments: 'id, templateId, assignedBy, active, syncedAt, *playerIds',
      exercises: 'id, name, category, isGlobal',
      attendancePolls: 'id, sessionId, isActive, expiresAt, updatedAt',
      outbox: 'id, entity, timestamp',
    });
  }
}

export const db = new RhinosDatabase();

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Get upcoming training sessions (next 14 days)
 */
export async function getUpcomingTrainingSessions(): Promise<LocalTrainingSession[]> {
  const today = new Date().toISOString().split('T')[0];
  const twoWeeksFromNow = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  return db.trainingSessions
    .where('date')
    .between(today, twoWeeksFromNow, true, true)
    .toArray();
}

/**
 * Get pinned sessions (available offline)
 */
export async function getPinnedSessions(): Promise<LocalTrainingSession[]> {
  return db.trainingSessions.where('isPinned').equals(1).toArray();
}

/**
 * Pin a session for offline access
 */
export async function pinSession(sessionId: string): Promise<void> {
  await db.trainingSessions.update(sessionId, { isPinned: true });
}

/**
 * Unpin a session
 */
export async function unpinSession(sessionId: string): Promise<void> {
  await db.trainingSessions.update(sessionId, { isPinned: false });
}

/**
 * Add item to outbox for later sync
 */
export async function addToOutbox(
  entity: OutboxItem['entity'],
  action: OutboxItem['action'],
  data: any
): Promise<string> {
  const id = crypto.randomUUID();
  await db.outbox.add({
    id,
    entity,
    action,
    data,
    timestamp: Date.now(),
    retries: 0,
  });
  return id;
}

/**
 * Get all pending outbox items
 */
export async function getPendingOutboxItems(): Promise<OutboxItem[]> {
  return db.outbox.orderBy('timestamp').toArray();
}

/**
 * Remove item from outbox after successful sync
 */
export async function removeFromOutbox(id: string): Promise<void> {
  await db.outbox.delete(id);
}

/**
 * Mark outbox item as failed
 */
export async function markOutboxItemFailed(id: string, error: string): Promise<void> {
  const item = await db.outbox.get(id);
  if (item) {
    await db.outbox.update(id, {
      retries: item.retries + 1,
      error,
    });
  }
}

/**
 * Clear old data (older than 30 days)
 */
export async function cleanupOldData(): Promise<void> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  // Delete old unpinned sessions
  await db.trainingSessions
    .where('date')
    .below(thirtyDaysAgo)
    .and((session) => !session.isPinned)
    .delete();

  // Delete old workouts
  await db.workouts
    .where('completedAt')
    .below(thirtyDaysAgo)
    .delete();
}

/**
 * Get active training assignments for a player
 */
export async function getPlayerAssignments(playerId: string): Promise<LocalTrainingAssignment[]> {
  const allAssignments = await db.trainingAssignments.toArray();

  // Filter assignments that include this player
  return allAssignments.filter(a =>
    a.active &&
    a.playerIds.includes(playerId)
  );
}

/**
 * Get all training types
 */
export async function getCachedTrainingTypes(): Promise<LocalTrainingType[]> {
  return db.trainingTypes
    .where('isActive')
    .equals(1)
    .sortBy('order');
}

/**
 * Get database statistics
 */
export async function getDbStats() {
  const [sessions, attendance, workouts, users, trainingTypes, assignments, outbox] = await Promise.all([
    db.trainingSessions.count(),
    db.attendance.count(),
    db.workouts.count(),
    db.users.count(),
    db.trainingTypes.count(),
    db.trainingAssignments.count(),
    db.outbox.count(),
  ]);

  return {
    trainingSessions: sessions,
    attendance,
    workouts,
    users,
    trainingTypes,
    trainingAssignments: assignments,
    pendingSync: outbox,
  };
}
