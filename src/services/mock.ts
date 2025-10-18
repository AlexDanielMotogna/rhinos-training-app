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
  if (existingIndex >= 0) {
    // Update existing user
    allUsers[existingIndex] = user;
  } else {
    // Add new user
    allUsers.push(user);
  }

  localStorage.setItem(usersKey, JSON.stringify(allUsers));
}

export function getUser(): MockUser | null {
  const data = localStorage.getItem('currentUser');
  return data ? JSON.parse(data) : null;
}

export function logout(): void {
  localStorage.removeItem('currentUser');
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
 * Mock notifications
 */
const NOTIFICATIONS_KEY = 'notifications';

export function getMockNotifications(): Notification[] {
  const stored = localStorage.getItem(NOTIFICATIONS_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    // Convert timestamp strings back to Date objects
    return parsed.map((n: any) => ({
      ...n,
      timestamp: new Date(n.timestamp),
    }));
  }

  // Default notifications
  const defaultNotifications: Notification[] = [
    {
      id: 'notif-1',
      type: 'new_plan',
      title: 'New Training Plan Available',
      message: 'Coach has created a new strength training plan for your position.',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      read: false,
      actionUrl: '/training',
    },
    {
      id: 'notif-2',
      type: 'new_exercise',
      title: 'New Exercise Added',
      message: 'Power Clean has been added to your training catalog.',
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      read: false,
      actionUrl: '/training',
    },
    {
      id: 'notif-3',
      type: 'attendance_reminder',
      title: 'Training Session Tomorrow',
      message: 'Reminder: Team training on Tuesday at 19:00.',
      timestamp: new Date(Date.now() - 86400000), // 1 day ago
      read: true,
      actionUrl: '/attendance',
    },
  ];

  saveNotifications(defaultNotifications);
  return defaultNotifications;
}

export function saveNotifications(notifications: Notification[]): void {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
}

export function markNotificationAsRead(id: string): void {
  const notifications = getMockNotifications();
  const updated = notifications.map((n) =>
    n.id === id ? { ...n, read: true } : n
  );
  saveNotifications(updated);
}

export function markAllNotificationsAsRead(): void {
  const notifications = getMockNotifications();
  const updated = notifications.map((n) => ({ ...n, read: true }));
  saveNotifications(updated);
}

export function addNotification(notification: Omit<Notification, 'id'>): void {
  const notifications = getMockNotifications();
  const newNotification: Notification = {
    ...notification,
    id: `notif-${Date.now()}`,
  };
  saveNotifications([newNotification, ...notifications]);
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
