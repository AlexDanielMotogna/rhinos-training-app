# 📱 Offline-First Implementation Guide

## Overview

The Rhinos Training App is built with **offline-first architecture**, allowing coaches and players to use the app even without internet connection. All data is synchronized automatically when connection is restored.

---

## 🏗️ Architecture

### Technology Stack

- **Dexie.js**: Modern IndexedDB wrapper for local data storage
- **Vite PWA Plugin**: Service Worker and Progressive Web App support
- **Workbox**: Cache strategies for API calls and assets
- **Outbox Pattern**: Queue for offline changes synchronization

### Data Flow

```
┌─────────────────┐
│   User Action   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      Online?      ┌──────────────┐
│  Check Network  │───────YES────────▶│  Save to DB  │
└────────┬────────┘                   └──────┬───────┘
         │                                    │
         NO                                   │
         │                                    │
         ▼                                    ▼
┌─────────────────┐                   ┌──────────────┐
│ Save to IndexDB │                   │ Add to Outbox│
└────────┬────────┘                   └──────┬───────┘
         │                                    │
         │                                    │
         └────────────────┬───────────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │  IndexedDB  │
                   └─────────────┘
                          │
                          │ When online
                          ▼
                   ┌─────────────┐
                   │ Sync to API │
                   └─────────────┘
```

---

## 📦 Local Storage Structure

### IndexedDB Tables

1. **trainingSessions** - Training sessions (team & private)
2. **attendance** - Attendance records and check-ins
3. **workouts** - Player workouts (offline logging)
4. **users** - Team roster (cached for offline)
5. **outbox** - Queue of pending sync items

### Data Schema

```typescript
interface LocalTrainingSession {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: Array<{userId, userName, status}>;
  // Sync metadata
  version: number;
  updatedAt: string;
  syncedAt?: string;
  isPinned?: boolean; // Manually pinned for offline
}

interface OutboxItem {
  id: string;
  entity: 'training' | 'attendance' | 'workout';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retries: number;
}
```

---

## 🔄 Synchronization Strategy

### 1. Prefetch (Download for Offline)

When online, the app automatically downloads:
- **Upcoming training sessions** (next 14 days)
- **Team roster** (all users)
- **Exercise catalog**

**Trigger:**
- On login
- Manual "Download for Offline" button
- Every 30 minutes (auto-refresh)

**Code:**
```typescript
import { prefetchUpcomingTrainings, prefetchTeamRoster } from './services/sync';

// Prefetch upcoming trainings
await prefetchUpcomingTrainings(14); // 14 days

// Prefetch team roster
await prefetchTeamRoster();
```

### 2. Offline Operations

When offline, all changes are saved to IndexedDB + Outbox:

```typescript
import { saveAttendanceOffline, saveWorkoutOffline } from './services/sync';

// Save attendance offline
await saveAttendanceOffline(
  sessionId,
  userId,
  userName,
  'present',
  checkInTime
);

// Save workout offline
await saveWorkoutOffline({
  userId,
  trainingType: 'strength',
  completedAt: new Date().toISOString(),
  exercises: [...],
});
```

### 3. Auto-Sync

When connection is restored:

1. **Automatic**: Listens for `window.online` event
2. **Manual**: Click sync button in OfflineIndicator
3. **Periodic**: Every 5 minutes when online

**Process:**
1. Get all items from outbox (ordered by timestamp)
2. For each item:
   - Send to backend API
   - If success → remove from outbox
   - If fail → increment retry counter
3. After sync → prefetch latest data

---

## 🎯 Use Cases

### Use Case 1: Coach Creates Training Plan (Online)

1. Coach creates training session in app
2. **Action:** `POST /api/trainings`
3. **Result:**
   - Saved to MongoDB
   - Cached in IndexedDB for offline access
   - Available to all players

### Use Case 2: Player Views Training (Offline)

1. Player opens app without internet
2. **Action:** Read from IndexedDB
3. **Result:**
   - Shows all prefetched training sessions
   - Shows team roster
   - Full functionality available

### Use Case 3: Mark Attendance During Training (Offline)

**Scenario:** Team is at outdoor field, no WiFi available

1. Coach marks attendance for players
2. **Action:**
   ```typescript
   await saveAttendanceOffline(sessionId, playerId, 'present')
   ```
3. **Result:**
   - Saved to IndexedDB
   - Added to outbox
   - Shows as "Pending Sync" in UI

4. **Later (when online):**
   - Auto-sync triggers
   - `POST /api/attendance` (bulk sync)
   - Outbox cleared
   - UI shows "Synced ✓"

### Use Case 4: Player Logs Workout (Offline)

**Scenario:** Player trains in gym with no signal

1. Player logs workout:
   - Squat: 3x5 @ 100kg
   - Bench: 3x8 @ 80kg

2. **Action:**
   ```typescript
   await saveWorkoutOffline({
     userId: player.id,
     trainingType: 'strength',
     exercises: [
       {exerciseId: 'squat', sets: [{reps: 5, kg: 100, rpe: 8}]},
       {exerciseId: 'bench', sets: [{reps: 8, kg: 80, rpe: 7}]},
     ],
   })
   ```

3. **Result:**
   - Saved locally
   - Added to outbox
   - Shows in "My Workouts" immediately

4. **Later (when online):**
   - Auto-sync sends workout to server
   - Appears in coach dashboard
   - Counts toward player statistics

---

## 🔧 Implementation Guide

### Step 1: Setup PWA

Already configured in `vite.config.ts`:

```typescript
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    runtimeCaching: [
      {
        urlPattern: /^https?:\/\/localhost:5000\/api\/.*/i,
        handler: 'NetworkFirst', // Try network, fallback to cache
        options: {
          cacheName: 'api-cache',
          expiration: { maxAgeSeconds: 60 * 60 * 24 }, // 24h
        },
      },
    ],
  },
})
```

### Step 2: Use Offline Hook

```typescript
import { useOffline } from '../hooks/useOffline';

function MyComponent() {
  const { isOnline, isSyncing, pendingSyncItems, prefetch, manualSync } = useOffline();

  return (
    <div>
      {!isOnline && <Alert>Offline Mode</Alert>}
      {pendingSyncItems > 0 && <Badge>{pendingSyncItems} pending</Badge>}

      <Button onClick={() => prefetch(14)}>
        Download for Offline
      </Button>

      <Button onClick={manualSync} disabled={isSyncing}>
        Sync Now
      </Button>
    </div>
  );
}
```

### Step 3: Hybrid Data Fetching

Always try local first, then server:

```typescript
import { getTrainingSession } from './services/sync';

// Get training (local first, then server if online)
const session = await getTrainingSession(sessionId);

if (!session) {
  alert('Training not available offline. Please download it.');
}
```

---

## 📊 Monitoring & Debugging

### Check Offline Status

Use the **OfflineIndicator** component in AppBar:

- 🟢 **Green cloud**: Online & synced
- 🟡 **Yellow badge**: Pending sync items
- 🔴 **Red cloud**: Offline mode
- 🔄 **Rotating**: Syncing...

### View IndexedDB

**Chrome DevTools:**
1. Open DevTools → Application tab
2. IndexedDB → RhinosTrainingDB
3. Inspect tables:
   - trainingSessions
   - attendance
   - workouts
   - outbox

### Check Service Worker

1. DevTools → Application → Service Workers
2. See registration status
3. View cache storage

### Debug Sync

Console logs show sync progress:

```
📥 Prefetching upcoming trainings (next 14 days)...
✅ Cached session: Team Practice - Strength
✅ Prefetch complete - 12 sessions cached

🔄 Starting sync...
📤 Syncing 3 items...
✅ Synced attendance create
✅ Synced workout create
✅ Sync complete - 3 synced, 0 failed
```

---

## ⚙️ Configuration

### Prefetch Settings

```typescript
// src/services/sync.ts

// Number of days to prefetch
const PREFETCH_DAYS = 14;

// Auto-prefetch interval (milliseconds)
const AUTO_PREFETCH_INTERVAL = 30 * 60 * 1000; // 30 minutes

// Max retries for failed sync
const MAX_SYNC_RETRIES = 5;
```

### Cache Cleanup

Automatic cleanup runs on app start:

```typescript
import { cleanupOldData } from './services/db';

// Delete data older than 30 days (unpinned only)
await cleanupOldData();
```

---

## 🚀 Best Practices

### 1. Pin Important Sessions

```typescript
import { pinSession, unpinSession } from './services/db';

// Pin for offline (never auto-deleted)
await pinSession(sessionId);

// Unpin (will be auto-cleaned after 30 days)
await unpinSession(sessionId);
```

### 2. Handle Conflicts

If server data is newer:

```typescript
const local = await db.trainingSessions.get(id);
const server = await fetch(`/api/trainings/${id}`);

if (server.updatedAt > local.updatedAt) {
  // Server wins - overwrite local
  await db.trainingSessions.put(server);
} else {
  // Local wins - send to server
  await syncToServer(local);
}
```

### 3. Show Offline UI

```typescript
{!isOnline && (
  <Alert severity="warning">
    You are offline. Changes will be synced when connection is restored.
  </Alert>
)}

{pendingSyncItems > 0 && (
  <Chip label={`${pendingSyncItems} pending sync`} color="warning" />
)}
```

### 4. Prefetch on Login

```typescript
// In Auth.tsx after successful login
await prefetchUpcomingTrainings(14);
await prefetchTeamRoster();
```

---

## 📱 Testing Offline Mode

### Chrome DevTools

1. Open DevTools → Network tab
2. Change throttling to "Offline"
3. Test all features:
   - View trainings ✓
   - Mark attendance ✓
   - Log workouts ✓
   - View team roster ✓

### Real Device Testing

1. Build PWA: `npm run build`
2. Serve: `npm run preview`
3. Open on mobile device
4. Turn off WiFi/mobile data
5. Test offline functionality

---

## 🔒 Security Considerations

1. **JWT Token**: Stored in localStorage (90-day expiration)
2. **Sensitive Data**: Not cached offline (only training data)
3. **Sync Authentication**: All sync requests include Bearer token
4. **HTTPS Required**: PWA only works on HTTPS (or localhost)

---

## 📚 API Reference

### Sync Service

```typescript
// Prefetch data
prefetchUpcomingTrainings(days: number): Promise<void>
prefetchTeamRoster(): Promise<void>

// Offline operations
saveAttendanceOffline(sessionId, userId, status): Promise<void>
saveWorkoutOffline(workout): Promise<void>
updateTrainingOffline(sessionId, updates): Promise<void>

// Manual sync
syncAll(): Promise<void>

// Hybrid fetching
getTrainingSession(id): Promise<LocalTrainingSession | null>
```

### Database Service

```typescript
// Queries
getUpcomingTrainingSessions(): Promise<LocalTrainingSession[]>
getPinnedSessions(): Promise<LocalTrainingSession[]>

// Pin management
pinSession(sessionId): Promise<void>
unpinSession(sessionId): Promise<void>

// Outbox
addToOutbox(entity, action, data): Promise<string>
getPendingOutboxItems(): Promise<OutboxItem[]>

// Cleanup
cleanupOldData(): Promise<void>
getDbStats(): Promise<Stats>
```

---

## 🎓 Summary

✅ **Offline-First**: App works fully without internet
✅ **Auto-Sync**: Changes sync automatically when online
✅ **Prefetch**: Smart caching of upcoming trainings
✅ **Conflict Resolution**: Server wins by timestamp
✅ **PWA Support**: Installable on mobile devices
✅ **Real-time Status**: Visual indicators for sync state

**Ready for the field! 🏈**
