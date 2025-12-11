/**
 * User profile service - backend only
 */

import type { MockUser } from './mock';
import { userService } from './api';

// Re-export MockUser as User (keeping backward compatibility for now)
export type { MockUser };
export type User = MockUser;

const CURRENT_USER_KEY = 'currentUser';
const ALL_USERS_KEY = 'rhinos_users';

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
 */
export function getUser(): MockUser | null {
  return getCurrentUser();
}

/**
 * Get current user from localStorage
 * Also validates that auth token exists - if not, clear user data
 */
export function getCurrentUser(): MockUser | null {
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  if (!stored) return null;

  // Verify auth token exists - if user exists but token doesn't, clear user data
  const authToken = localStorage.getItem('authToken');
  if (!authToken) {
    console.warn('[AUTH] User found but no auth token - clearing user data');
    localStorage.removeItem(CURRENT_USER_KEY);
    return null;
  }

  return JSON.parse(stored);
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
 */
export function saveUser(user: MockUser): void {
  saveUserLocal(user);
}

/**
 * Update current user profile with backend sync
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
    console.warn('[USER PROFILE] Failed to sync to backend:', error);
    throw error;
  }
}

/**
 * Sync user profile from backend to localStorage
 */
export async function syncUserProfileFromBackend(): Promise<void> {
  try {
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
  }
}

/**
 * Sync all users from backend (for team directory)
 */
export async function syncAllUsersFromBackend(): Promise<void> {
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

  // Try backend
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
