import type { Position } from '../types/exercise';
import type { TemplatesByType, TrainingTypeMeta } from '../types/template';
import type { KPISnapshot, ProjectionRow } from '../types/kpi';
import type { LeaderboardRow } from '../types/leaderboard';
import type { Notification } from '../types/notification';
import { globalCatalog } from './catalog';

/**
 * Mock user data stored in localStorage
 */
export interface MockUser {
  id: string;
  name: string;
  email: string;
  jerseyNumber?: number; // Optional for new players
  birthDate?: string; // ISO date string (YYYY-MM-DD)
  age: number; // Calculated from birthDate
  weightKg: number;
  heightCm: number;
  position: Position;
  role: 'player' | 'coach';
  sex?: 'male' | 'female'; // Added for strength testing benchmarks
  phone?: string; // Optional phone number (format: +43...)
  instagram?: string; // Optional Instagram handle
  snapchat?: string; // Optional Snapchat username
  tiktok?: string; // Optional TikTok handle
  hudl?: string; // Optional Hudl profile URL

  // Privacy Settings
  metricsPublic?: boolean; // Toggle to make metrics visible to other players (default: true)

  // Age Categories (SaaS multi-sport support)
  ageCategory?: string; // Player's age category (e.g., 'U13', 'U15', 'Seniors')
  coachCategories?: string[]; // Categories this coach manages (for coaches only)

  // AI Coach Configuration (personal - only used if team API not configured)
  aiCoachEnabled?: boolean; // Toggle to enable/disable AI coach
  aiApiKey?: string; // Personal OpenAI API key
}

/**
 * Calculate age from birth date
 */
export function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

export function saveUser(user: MockUser): void {
  // Save as current user
  localStorage.setItem('currentUser', JSON.stringify(user));

  // Also save to list of all users for coach assignment feature
  const usersKey = 'rhinos_users';
  const stored = localStorage.getItem(usersKey);
  let allUsers: MockUser[] = stored ? JSON.parse(stored) : [];

  // Check if user already exists (by email)
  const existingIndex = allUsers.findIndex(u => u.email === user.email);
  const isNewUser = existingIndex < 0;

  if (existingIndex >= 0) {
    // Update existing user
    allUsers[existingIndex] = user;
  } else {
    // Add new user
    allUsers.push(user);
  }

  localStorage.setItem(usersKey, JSON.stringify(allUsers));

  // Initialize default workout plans for new players
  if (isNewUser && user.role === 'player') {
    import('./workoutPlanTemplates').then(({ initializeDefaultWorkoutPlans }) => {
      initializeDefaultWorkoutPlans(user.id, user.position);
    });
  }
}

export function getUser(): MockUser | null {
  const data = localStorage.getItem('currentUser');
  return data ? JSON.parse(data) : null;
}

export async function logout(): Promise<void> {
  try {
    // Call backend logout endpoint to clear httpOnly cookie
    await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/logout`, {
      method: 'POST',
      credentials: 'include', // IMPORTANT: Send cookie
    });
  } catch (error) {
    console.error('Logout API call failed:', error);
    // Continue with local logout even if API call fails
  }

  // Remove user data from localStorage (token is in httpOnly cookie now)
  localStorage.removeItem('currentUser');

  // Dispatch a custom event to notify all components of the logout
  // This allows immediate UI updates without polling
  window.dispatchEvent(new CustomEvent('user-logout'));

  console.log('🔓 User logged out successfully');
}

/**
 * Get all registered users (for team directory feature)
 */
export function getAllUsers(): MockUser[] {
  const usersKey = 'rhinos_users';
  const stored = localStorage.getItem(usersKey);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Mock training types
 */
export function getTrainingTypes(): TrainingTypeMeta[] {
  return [
    {
      key: 'strength_conditioning',
      nameEN: 'Strength & Conditioning',
      nameDE: 'Kraft & Kondition',
      season: 'off-season',
      active: true,
    },
    {
      key: 'sprints_speed',
      nameEN: 'Sprints / Speed',
      nameDE: 'Sprints / Geschwindigkeit',
      season: 'off-season',
      active: true,
    },
  ];
}

/**
 * Mock templates for position
 */
export function getTemplatesForPosition(position: Position): TemplatesByType {
  // Strength & Conditioning template
  const scTemplate = {
    blocks: [
      {
        order: 1,
        title: 'Compound Lifts',
        items: [
          globalCatalog.find((e) => e.id === 'ex-001')!, // Squat
          globalCatalog.find((e) => e.id === 'ex-002')!, // Bench Press
          globalCatalog.find((e) => e.id === 'ex-003')!, // Deadlift
        ],
      },
      {
        order: 2,
        title: 'Accessory Work',
        items: [
          globalCatalog.find((e) => e.id === 'ex-009')!, // Lunges
          globalCatalog.find((e) => e.id === 'ex-008')!, // Dumbbell Rows
          globalCatalog.find((e) => e.id === 'ex-007')!, // Pull-ups
        ],
      },
    ],
  };

  // Sprints/Speed template
  const speedTemplate = {
    blocks: [
      {
        order: 1,
        title: 'Speed Work',
        items: [
          globalCatalog.find((e) => e.id === 'ex-044')!, // Form Running
          globalCatalog.find((e) => e.id === 'ex-014')!, // 10-Yard Sprint
          globalCatalog.find((e) => e.id === 'ex-015')!, // Flying 20s
        ],
      },
      {
        order: 2,
        title: 'Agility',
        items: [
          globalCatalog.find((e) => e.id === 'ex-022')!, // L-Drill
          globalCatalog.find((e) => e.id === 'ex-024')!, // Cone Drills
        ],
      },
    ],
  };

  return {
    strength_conditioning: {
      [position]: scTemplate,
    },
    sprints_speed: {
      [position]: speedTemplate,
    },
  };
}

/**
 * Mock KPI data
 */
export function getMockKPIs(): KPISnapshot {
  return {
    currentWeek: 1,
    totalWeeks: 52,
    trainingCompliance: 85,
    coachPlansCompleted: 2,
    coachPlansAssigned: 3,
    teamSessionsAttended: 2,
    teamSessionsTotal: 2,
    freeWorkouts: 1,
    freeWorkoutsMinutes: 60,
    totalVolume: 240,
    strengthScore: { score: 75, change: 5, lastTestDate: '2025-01-15' },
    speedScore: { score: 68, change: null, lastTestDate: null },
    powerScore: { score: 80, change: -2, lastTestDate: '2025-01-10' },
    agilityScore: { score: 72, change: 3, lastTestDate: '2025-01-12' },
    totalTeamSessionsAttended: 45,
    totalTeamSessionsScheduled: 50,
    attendanceRate: 90,
    attendanceStatus: 'on_time',
  };
}

/**
 * Mock 12-week projection
 */
export function getMockProjection(): ProjectionRow[] {
  return Array.from({ length: 12 }, (_, i) => ({
    week: i + 1,
    score: Math.min(78 + i * 2, 100),
    compliance: Math.min(70 + i * 1.5, 95),
    totalMin: 240 + i * 5,
  }));
}

/**
 * Mock leaderboard data
 */
export function getMockLeaderboard(): LeaderboardRow[] {
  const positions: Position[] = ['RB', 'WR', 'LB', 'OL', 'DB', 'QB', 'DL', 'TE'];
  const names = [
    'John Smith',
    'Mike Johnson',
    'Chris Brown',
    'David Wilson',
    'James Davis',
    'Robert Miller',
    'Tom Anderson',
    'Alex Taylor',
  ];

  return names.map((name, idx) => ({
    rank: idx + 1,
    playerName: name,
    position: positions[idx],
    scoreAvg: 95 - idx * 3,
    compliancePct: 90 - idx * 2,
    attendancePct: 95 - idx * 1,
    freeSharePct: 15 + idx * 2,
  }));
}

/**
 * Mock notifications - DEPRECATED
 * Notifications now come from backend via notificationService in api.ts
 * These functions are kept for backward compatibility but return empty data
 */
const NOTIFICATIONS_KEY = 'notifications';

/**
 * Clean up old mock notifications from localStorage
 * Should be called once on app initialization
 */
export function cleanupMockNotifications(): void {
  localStorage.removeItem(NOTIFICATIONS_KEY);
  console.log('[CLEANUP] Removed mock notifications from localStorage');
}

export function getMockNotifications(): Notification[] {
  // Return empty array - notifications now come from backend
  return [];
}

export function saveNotifications(notifications: Notification[]): void {
  // No-op - notifications are managed by backend
  console.warn('[DEPRECATED] saveNotifications() is deprecated. Notifications are managed by backend.');
}

export function markNotificationAsRead(id: string): void {
  // No-op - use notificationService.markAsRead() instead
  console.warn('[DEPRECATED] markNotificationAsRead() is deprecated. Use notificationService.markAsRead() instead.');
}

export function markAllNotificationsAsRead(): void {
  // No-op - use notificationService.markAllAsRead() instead
  console.warn('[DEPRECATED] markAllNotificationsAsRead() is deprecated. Use notificationService.markAllAsRead() instead.');
}

export function addNotification(notification: Omit<Notification, 'id'>): void {
  // No-op - notifications are created by backend
  console.warn('[DEPRECATED] addNotification() is deprecated. Notifications are created by backend.');
}

/**
 * Initialize demo profiles for development/testing
 * These profiles will be available across all browsers
 */
export function initializeDemoProfiles(): void {
  const usersKey = 'rhinos_users';

  // Define demo profiles
  const demoProfiles: MockUser[] = [
    {
      id: 'demo-coach-1',
      name: 'Coach Mike',
      email: 'coach@rhinos.com',
      role: 'coach',
      jerseyNumber: 0,
      age: 0,
      weightKg: 0,
      heightCm: 0,
      position: 'RB',
      sex: 'male',
    },
    {
      id: 'demo-player-1',
      name: 'John Doe',
      email: 'player1@rhinos.com',
      role: 'player',
      jerseyNumber: 23,
      age: 22,
      weightKg: 95,
      heightCm: 180,
      position: 'RB',
      sex: 'male',
    },
    {
      id: 'demo-player-2',
      name: 'Mike Johnson',
      email: 'player2@rhinos.com',
      role: 'player',
      jerseyNumber: 84,
      age: 24,
      weightKg: 88,
      heightCm: 185,
      position: 'WR',
      sex: 'male',
    },
    {
      id: 'demo-player-3',
      name: 'David Smith',
      email: 'player3@rhinos.com',
      role: 'player',
      jerseyNumber: 87,
      age: 23,
      weightKg: 102,
      heightCm: 193,
      position: 'TE',
      sex: 'male',
    },
    {
      id: 'demo-player-4',
      name: 'Chris Brown',
      email: 'player4@rhinos.com',
      role: 'player',
      jerseyNumber: 54,
      age: 25,
      weightKg: 110,
      heightCm: 188,
      position: 'LB',
      sex: 'male',
    },
  ];

  const stored = localStorage.getItem(usersKey);
  let existingUsers: MockUser[] = stored ? JSON.parse(stored) : [];

  // Add demo profiles if they don't already exist
  demoProfiles.forEach(demoUser => {
    const exists = existingUsers.find(u => u.email === demoUser.email);
    if (!exists) {
      existingUsers.push(demoUser);
    }
  });

  localStorage.setItem(usersKey, JSON.stringify(existingUsers));
  console.log('✅ Demo profiles ensured:', demoProfiles.length, 'profiles available');
}
