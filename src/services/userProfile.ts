import type { MockUser } from './mock';
import { userService } from './api';

// Re-export MockUser as User (keeping backward compatibility for now)
export type { MockUser };
export type User = MockUser;

const CURRENT_USER_KEY = 'currentUser';
const ALL_USERS_KEY = 'rhinos_users';
const SYNCING_PROFILE_KEY = 'rhinos_syncing_profile';

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

/**
 * Get current user - alias for backward compatibility
 * Use getCurrentUser() instead
 */
export function getUser(): MockUser | null {
  return getCurrentUser();
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser(): MockUser | null {
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  return stored ? JSON.parse(stored) : null;
}

/**
 * Get all users from localStorage
 */
export function getAllUsers(): MockUser[] {
  try {
    const stored = localStorage.getItem(ALL_USERS_KEY);
    console.log('[USER PROFILE] getAllUsers() - stored value:', stored);

    if (!stored) {
      console.log('[USER PROFILE] getAllUsers() - no stored data, returning []');
      return [];
    }

    const parsed = JSON.parse(stored);
    console.log('[USER PROFILE] getAllUsers() - parsed:', parsed, 'Type:', typeof parsed, 'Is Array:', Array.isArray(parsed));

    // Ensure we always return an array
    const result = Array.isArray(parsed) ? parsed : [];
    console.log('[USER PROFILE] getAllUsers() - returning:', result);
    return result;
  } catch (error) {
    console.error('[USER PROFILE] Error parsing users from localStorage:', error);
    return [];
  }
}

/**
 * Save user to localStorage (local-first)
 */
export function saveUserLocal(user: MockUser): void {
  // Save as current user
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

  // Also save to list of all users for team directory
  const allUsers = getAllUsers();
  const existingIndex = allUsers.findIndex(u => u.email === user.email);

  if (existingIndex >= 0) {
    // Update existing user
    allUsers[existingIndex] = user;
  } else {
    // Add new user
    allUsers.push(user);
  }

  localStorage.setItem(ALL_USERS_KEY, JSON.stringify(allUsers));
}

/**
 * Save user - alias for backward compatibility
 * Use updateUserProfile() for backend sync instead
 */
export function saveUser(user: MockUser): void {
  saveUserLocal(user);
}

/**
 * Update current user profile with backend sync
 * This is the main function to use when updating user profile
 */
export async function updateUserProfile(updates: Partial<MockUser>): Promise<MockUser | null> {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.error('[USER PROFILE] No current user found');
    return null;
  }

  // Merge updates with current user
  const updatedUser: MockUser = {
    ...currentUser,
    ...updates,
  };

  // Save locally first
  saveUserLocal(updatedUser);
  console.log('[USER PROFILE] User profile updated locally');

  // Try to sync with backend if online
  const online = isOnline();
  if (online) {
    try {
      console.log('[USER PROFILE] Syncing user profile to backend...');
      const backendUser = await userService.updateProfile(updates);

      // Merge backend response with local data
      const mergedUser: MockUser = {
        ...updatedUser,
        ...backendUser,
      };

      // Update local storage with backend data
      saveUserLocal(mergedUser);
      console.log('[USER PROFILE] User profile synced to backend successfully');
      return mergedUser;
    } catch (error) {
      console.warn('[USER PROFILE] Failed to sync to backend, keeping local changes:', error);
      // Keep local changes even if backend sync fails
      return updatedUser;
    }
  } else {
    console.log('[USER PROFILE] Offline - profile saved locally only');
    return updatedUser;
  }
}

/**
 * Sync user profile from backend to localStorage
 * This should be called on app startup and when coming back online
 */
export async function syncUserProfileFromBackend(): Promise<void> {
  if (!isOnline()) {
    console.log('📦 Offline - skipping user profile sync');
    return;
  }

  // Check if already syncing to prevent duplicate calls
  const isSyncing = localStorage.getItem(SYNCING_PROFILE_KEY);
  if (isSyncing === 'true') {
    console.log('[USER PROFILE] Already syncing, skipping duplicate call');
    return;
  }

  try {
    // Set syncing flag
    localStorage.setItem(SYNCING_PROFILE_KEY, 'true');
    console.log('🔄 Syncing user profile from backend...');

    const backendUser = await userService.getProfile() as any;

    if (!backendUser) {
      console.log('ℹ️ No user profile found in backend');
      return;
    }

    console.log('📥 Received user profile from backend');

    // Get existing local user
    const localUser = getCurrentUser();

    if (!localUser) {
      // No local user, just save backend user
      console.log('[USER PROFILE] No local user, saving backend user');
      saveUserLocal(backendUser);
      return;
    }

    // Merge backend user with local user (backend takes precedence for most fields)
    const mergedUser: MockUser = {
      ...localUser,
      ...backendUser,
      // Keep local-only fields that might not be in backend
      id: backendUser.id || localUser.id,
      email: backendUser.email || localUser.email,
      role: backendUser.role || localUser.role,
    };

    // Save merged user
    saveUserLocal(mergedUser);
    console.log('✅ User profile synced from backend');
  } catch (error) {
    console.error('❌ Failed to sync user profile from backend:', error);
  } finally {
    // Clear syncing flag
    localStorage.removeItem(SYNCING_PROFILE_KEY);
  }
}

/**
 * Sync all users from backend (for team directory)
 * This should be called when viewing the team page
 */
export async function syncAllUsersFromBackend(): Promise<void> {
  if (!isOnline()) {
    console.log('📦 Offline - skipping all users sync');
    return;
  }

  try {
    console.log('🔄 Syncing all users from backend...');
    const backendUsersResponse = await userService.getAllUsers();

    // Ensure we have an array
    const backendUsers = Array.isArray(backendUsersResponse)
      ? backendUsersResponse
      : [];

    if (backendUsers.length === 0) {
      console.log('ℹ️ No users found in backend');
      return;
    }

    console.log(`📥 Received ${backendUsers.length} users from backend`);

    // Replace all users in localStorage with backend data
    localStorage.setItem(ALL_USERS_KEY, JSON.stringify(backendUsers));
    console.log('✅ All users synced from backend');
  } catch (error) {
    console.error('❌ Failed to sync all users from backend:', error);
  }
}

/**
 * Get user by ID with backend fallback
 */
export async function getUserById(userId: string): Promise<MockUser | null> {
  // First check local storage
  const allUsers = getAllUsers();
  const localUser = allUsers.find(u => u.id === userId);

  if (localUser) {
    return localUser;
  }

  // If not found locally and online, try backend
  if (isOnline()) {
    try {
      const backendUser = await userService.getUserById(userId) as MockUser;

      // Save to local cache
      if (backendUser) {
        const allUsers = getAllUsers();
        allUsers.push(backendUser);
        localStorage.setItem(ALL_USERS_KEY, JSON.stringify(allUsers));
      }

      return backendUser;
    } catch (error) {
      console.error('[USER PROFILE] Failed to fetch user from backend:', error);
      return null;
    }
  }

  return null;
}
