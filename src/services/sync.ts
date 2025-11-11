import {
  db,
  addToOutbox,
  getPendingOutboxItems,
  removeFromOutbox,
  markOutboxItemFailed,
  LocalTrainingSession,
  LocalAttendance,
  LocalWorkout,
} from './db';
import { getAuthToken } from './api';
import { toastService } from './toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Re-export addToOutbox for other services to use
export { addToOutbox };

// ========================================
// SYNC STATE
// ========================================

let isSyncing = false;
let lastSyncTimestamp: number | null = null;
let listenersRegistered = false;

/**
 * Check if device is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

// Define handlers outside to avoid duplicates
const handleOnline = () => {
  console.log('📡 Connection restored - starting sync...');
  toastService.online();
  syncAll();
};

const handleOffline = () => {
  console.log('📡 Connection lost - switching to offline mode');
  toastService.offline();
};

/**
 * Register online/offline listeners
 */
export function registerSyncListeners(): void {
  // Prevent duplicate registration
  if (listenersRegistered) {
    return;
  }

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  listenersRegistered = true;

  console.log('✅ Sync listeners registered');
}

// ========================================
// PREFETCH (Download for offline)
// ========================================

/**
 * Prefetch upcoming training sessions from server
 * Called when online to prepare for offline use
 */
export async function prefetchUpcomingTrainings(days: number = 14): Promise<void> {
  if (!isOnline()) {
    console.log('⚠️ Offline - cannot prefetch trainings');
    return;
  }

  const token = getAuthToken();
  if (!token) {
    console.log('⚠️ Not authenticated - cannot prefetch trainings');
    return;
  }

  try {
    console.log(`📥 Prefetching upcoming trainings (next ${days} days)...`);

    const from = new Date().toISOString().split('T')[0];
    const response = await fetch(
      `${API_URL}/trainings?from=${from}&days=${days}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const sessions: LocalTrainingSession[] = await response.json();

    // Save to IndexedDB
    for (const session of sessions) {
      const existing = await db.trainingSessions.get(session.id);

      // Only update if server version is newer
      if (!existing || session.updatedAt > existing.updatedAt) {
        await db.trainingSessions.put({
          ...session,
          syncedAt: new Date().toISOString(),
        });
        console.log(`✅ Cached session: ${session.title}`);
      }
    }

    lastSyncTimestamp = Date.now();
    console.log(`✅ Prefetch complete - ${sessions.length} sessions cached`);
  } catch (error) {
    console.error('❌ Prefetch failed:', error);
    throw error;
  }
}

/**
 * Prefetch team roster (all users)
 */
export async function prefetchTeamRoster(): Promise<void> {
  if (!isOnline()) return;

  const token = getAuthToken();
  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const users = await response.json();

    // Save to IndexedDB
    await db.users.bulkPut(
      users.map((u: any) => ({
        ...u,
        lastSyncedAt: new Date().toISOString(),
      }))
    );

    console.log(`✅ Cached ${users.length} team members`);
  } catch (error) {
    console.error('❌ Failed to prefetch team roster:', error);
  }
}

/**
 * Prefetch training types
 */
export async function prefetchTrainingTypes(): Promise<void> {
  if (!isOnline()) return;

  const token = getAuthToken();
  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/training-types`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const trainingTypes = await response.json();

    // Save to IndexedDB
    await db.trainingTypes.bulkPut(
      trainingTypes.map((tt: any) => ({
        ...tt,
        syncedAt: new Date().toISOString(),
      }))
    );

    console.log(`✅ Cached ${trainingTypes.length} training types`);
  } catch (error) {
    console.error('❌ Failed to prefetch training types:', error);
  }
}

/**
 * Prefetch training assignments for current user
 */
export async function prefetchTrainingAssignments(): Promise<void> {
  if (!isOnline()) return;

  const token = getAuthToken();
  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/assignments`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const assignments = await response.json();

    // Save to IndexedDB with enriched template data
    await db.trainingAssignments.bulkPut(
      assignments.map((a: any) => ({
        ...a,
        syncedAt: new Date().toISOString(),
      }))
    );

    console.log(`✅ Cached ${assignments.length} training assignments`);
  } catch (error) {
    console.error('❌ Failed to prefetch training assignments:', error);
  }
}

/**
 * Prefetch exercises catalog
 */
export async function prefetchExercises(): Promise<void> {
  if (!isOnline()) return;

  const token = getAuthToken();
  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/exercises`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const exercises = await response.json();

    // Save to IndexedDB
    await db.exercises.clear();
    await db.exercises.bulkPut(exercises);

    console.log(`✅ Cached ${exercises.length} exercises`);
  } catch (error) {
    console.error('❌ Failed to prefetch exercises:', error);
  }
}

/**
 * Prefetch training sessions for offline use
 */
export async function prefetchTrainingSessions(): Promise<void> {
  if (!isOnline()) return;

  const token = getAuthToken();
  if (!token) return;

  try {
    // Fetch upcoming sessions (next 30 days)
    const today = new Date().toISOString().split('T')[0];
    const response = await fetch(`${API_URL}/trainings?from=${today}&days=30`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const sessions = await response.json();

    // Save to IndexedDB
    await db.trainingSessions.clear();
    await db.trainingSessions.bulkPut(sessions.map((s: any) => ({
      ...s,
      version: 1,
      updatedAt: s.updatedAt || new Date().toISOString(),
    })));

    console.log(`✅ Cached ${sessions.length} training sessions`);
  } catch (error) {
    console.error('❌ Failed to prefetch training sessions:', error);
  }
}

// ========================================
// OFFLINE OPERATIONS
// ========================================

/**
 * Save attendance offline (will sync later)
 */
export async function saveAttendanceOffline(
  sessionId: string,
  userId: string,
  userName: string,
  status: 'present' | 'absent' | 'late',
  checkInTime?: string
): Promise<void> {
  const attendance: LocalAttendance = {
    id: crypto.randomUUID(),
    sessionId,
    userId,
    userName,
    status,
    checkInTime,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Save to local DB
  await db.attendance.put(attendance);

  // Add to outbox for sync
  await addToOutbox('attendance', 'create', attendance);

  console.log('✅ Attendance saved offline - will sync when online');
}

/**
 * Save workout offline (will sync later)
 */
export async function saveWorkoutOffline(workout: Omit<LocalWorkout, 'id'>): Promise<void> {
  const workoutWithId: LocalWorkout = {
    ...workout,
    id: crypto.randomUUID(),
  };

  // Save to local DB
  await db.workouts.put(workoutWithId);

  // Add to outbox for sync
  await addToOutbox('workout', 'create', workoutWithId);

  console.log('✅ Workout saved offline - will sync when online');
}

/**
 * Update training session offline
 */
export async function updateTrainingOffline(
  sessionId: string,
  updates: Partial<LocalTrainingSession>
): Promise<void> {
  const session = await db.trainingSessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found in local database');
  }

  const updated = {
    ...session,
    ...updates,
    updatedAt: new Date().toISOString(),
    version: session.version + 1,
  };

  await db.trainingSessions.put(updated);
  await addToOutbox('training', 'update', { id: sessionId, ...updates });

  console.log('✅ Training updated offline - will sync when online');
}

// ========================================
// SYNC TO SERVER
// ========================================

/**
 * Sync all pending changes to server
 */
export async function syncAll(): Promise<void> {
  if (!isOnline()) {
    console.log('⚠️ Offline - cannot sync');
    return;
  }

  if (isSyncing) {
    console.log('⚠️ Sync already in progress');
    return;
  }

  const token = getAuthToken();
  if (!token) {
    console.log('⚠️ Not authenticated - cannot sync');
    return;
  }

  isSyncing = true;

  try {
    console.log('🔄 Starting sync...');

    const items = await getPendingOutboxItems();

    if (items.length === 0) {
      console.log('✅ Nothing to sync');
      return;
    }

    console.log(`📤 Syncing ${items.length} items...`);

    let syncedCount = 0;
    let failedCount = 0;

    for (const item of items) {
      try {
        await syncItem(item, token);
        await removeFromOutbox(item.id);
        syncedCount++;
        console.log(`✅ Synced ${item.entity} ${item.action}`);
      } catch (error: any) {
        failedCount++;
        await markOutboxItemFailed(item.id, error.message);
        console.error(`❌ Failed to sync ${item.entity}:`, error);

        // Stop syncing if too many failures (network might be unstable)
        if (failedCount > 5) {
          console.log('⚠️ Too many failures - stopping sync');
          break;
        }
      }
    }

    lastSyncTimestamp = Date.now();
    console.log(`✅ Sync complete - ${syncedCount} synced, ${failedCount} failed`);

    // Show success toast only if items were synced
    if (syncedCount > 0) {
      toastService.syncSuccess();
    }

    // Show error toast if there were failures
    if (failedCount > 0) {
      toastService.syncError();
    }

    // After sync, prefetch latest data
    await Promise.all([
      prefetchUpcomingTrainings(),
      prefetchTeamRoster(),
      prefetchTrainingTypes(),
      prefetchTrainingAssignments(),
      prefetchExercises(),
    ]);
  } catch (error) {
    console.error('❌ Sync failed:', error);
    toastService.syncError();
  } finally {
    isSyncing = false;
  }
}

/**
 * Sync a single outbox item
 */
async function syncItem(item: any, token: string): Promise<void> {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  let url = '';
  let method = 'POST';
  let body = JSON.stringify(item.data);

  // Determine endpoint based on entity and action
  switch (item.entity) {
    case 'attendance':
      url = `${API_URL}/attendance`;
      if (item.action === 'update') {
        url += `/${item.data.id}`;
        method = 'PATCH';
      }
      break;

    case 'workout':
      url = `${API_URL}/workouts`;
      if (item.action === 'update') {
        url += `/${item.data.id}`;
        method = 'PATCH';
      }
      break;

    case 'training':
      url = `${API_URL}/trainings`;
      if (item.action === 'update') {
        url += `/${item.data.id}`;
        method = 'PATCH';
      } else if (item.action === 'delete') {
        url += `/${item.data.id}`;
        method = 'DELETE';
        body = '';
      }
      break;

    case 'trainingSession':
      if (item.action === 'create') {
        url = `${API_URL}/training-sessions`;
        method = 'POST';
      } else if (item.action === 'rsvp') {
        url = `${API_URL}/training-sessions/${item.data.sessionId}/rsvp`;
        method = 'POST';
        body = JSON.stringify({ userId: item.data.userId, status: item.data.status });
      } else if (item.action === 'checkin') {
        url = `${API_URL}/training-sessions/${item.data.sessionId}/checkin`;
        method = 'POST';
        body = JSON.stringify({ userId: item.data.userId });
      } else if (item.action === 'delete') {
        url = `${API_URL}/training-sessions/${item.data.sessionId}`;
        method = 'DELETE';
        body = '';
      } else {
        throw new Error(`Unknown action for trainingSession: ${item.action}`);
      }
      break;

    case 'assignment':
      url = `${API_URL}/assignments`;
      if (item.action === 'update') {
        url += `/${item.data.id}`;
        method = 'PATCH';
      } else if (item.action === 'delete') {
        url += `/${item.data.id}`;
        method = 'DELETE';
        body = '';
      }
      break;

    case 'userPlan':
      url = `${API_URL}/user-plans`;
      if (item.action === 'create') {
        method = 'POST';
      } else if (item.action === 'update') {
        url += `/${item.data.id}`;
        method = 'PATCH';
      } else if (item.action === 'delete') {
        url += `/${item.data.id}`;
        method = 'DELETE';
        body = '';
      }
      break;

    default:
      throw new Error(`Unknown entity type: ${item.entity}`);
  }

  const response = await fetch(url, {
    method,
    headers,
    body: method !== 'DELETE' ? body : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Sync failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ========================================
// HYBRID DATA FETCHING
// ========================================

/**
 * Get training session - tries local first, then server if online
 */
export async function getTrainingSession(id: string): Promise<LocalTrainingSession | null> {
  // Try local first
  const local = await db.trainingSessions.get(id);
  if (local) {
    console.log('📦 Loaded from local cache');
    return local;
  }

  // If online, fetch from server
  if (isOnline()) {
    const token = getAuthToken();
    if (!token) return null;

    try {
      const response = await fetch(`${API_URL}/trainings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) return null;

      const session = await response.json();

      // Cache it for offline
      await db.trainingSessions.put({
        ...session,
        syncedAt: new Date().toISOString(),
      });

      console.log('📡 Loaded from server');
      return session;
    } catch (error) {
      console.error('Failed to fetch from server:', error);
      return null;
    }
  }

  console.log('⚠️ Session not available offline');
  return null;
}

/**
 * Get sync status
 */
export function getSyncStatus() {
  return {
    isSyncing,
    lastSyncTimestamp,
    isOnline: isOnline(),
  };
}
