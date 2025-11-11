/**
 * User Plan Service
 * Manages user-created workout plan templates with backend + localStorage support
 */

import type { UserPlanTemplate, UserPlanPayload } from '../types/userPlan';
import { userPlanService } from './api';
import { isOnline, addToOutbox } from './sync';

const USER_PLANS_KEY = 'rhinos_user_plans';
const SYNCING_PLANS_KEY = 'rhinos_syncing_plans';
const DELETED_PLANS_KEY = 'rhinos_deleted_plans'; // Track plans deleted by user

/**
 * Get all plans for a user (synchronous - localStorage only)
 */
export function getUserPlans(userId: string): UserPlanTemplate[] {
  const data = localStorage.getItem(USER_PLANS_KEY);
  const allPlans: UserPlanTemplate[] = data ? JSON.parse(data) : [];
  return allPlans.filter(plan => plan.userId === userId);
}

/**
 * Get all plans for a user (async - tries backend first, falls back to localStorage)
 */
export async function getUserPlansFromBackend(userId: string): Promise<UserPlanTemplate[]> {
  console.log('[USER PLANS] 🚀 Starting getUserPlansFromBackend for user:', userId);
  const online = isOnline();
  console.log('[USER PLANS] 🌐 Online status:', online);
  
  if (online) {
    try {
      console.log('[USER PLANS] 📡 Loading plans from backend for user:', userId);
      await syncUserPlansFromBackend(userId);
      console.log('[USER PLANS] ✅ Synced plans from backend successfully');
    } catch (error) {
      console.error('[USER PLANS] ❌ Failed to load from backend:', error);
      console.warn('[USER PLANS] ⚠️ Falling back to localStorage');
    }
  } else {
    console.log('[USER PLANS] 📱 Offline - using localStorage only');
  }
  
  // Return from localStorage (which now contains backend data if sync succeeded)
  const localPlans = getUserPlans(userId);
  console.log('[USER PLANS] 📦 Returning plans from localStorage:', localPlans.length, 'plans');
  console.log('[USER PLANS] 📋 Plan details:', localPlans.map(p => ({ id: p.id, name: p.name, userId: p.userId })));
  return localPlans;
}

/**
 * Get a specific plan by ID
 */
export function getUserPlan(planId: string): UserPlanTemplate | null {
  const data = localStorage.getItem(USER_PLANS_KEY);
  const allPlans: UserPlanTemplate[] = data ? JSON.parse(data) : [];
  return allPlans.find(plan => plan.id === planId) || null;
}

/**
 * Create a new plan
 */
export async function createUserPlan(payload: UserPlanPayload): Promise<UserPlanTemplate> {
  const data = localStorage.getItem(USER_PLANS_KEY);
  const allPlans: UserPlanTemplate[] = data ? JSON.parse(data) : [];

  const now = new Date().toISOString();
  const newPlan: UserPlanTemplate = {
    id: crypto.randomUUID(),
    ...payload,
    createdAt: now,
    updatedAt: now,
    timesCompleted: 0,
  };

  // Save to localStorage first (immediate feedback)
  allPlans.push(newPlan);
  localStorage.setItem(USER_PLANS_KEY, JSON.stringify(allPlans));

  // Try to save to backend if online
  const online = isOnline();
  if (online) {
    try {
      console.log('[USER PLANS] Saving plan to backend:', newPlan.name);
      const backendPlan = await userPlanService.create({
        name: newPlan.name,
        trainingType: 'custom', // Default training type
        exercises: newPlan.exercises,
        notes: '',
        timesCompleted: newPlan.timesCompleted,
        createdAt: newPlan.createdAt,
        updatedAt: newPlan.updatedAt,
      });

      // Update local plan with backend ID
      newPlan.id = backendPlan.id;
      const index = allPlans.findIndex(p => p.createdAt === newPlan.createdAt && p.name === newPlan.name);
      if (index !== -1) {
        allPlans[index] = newPlan;
        localStorage.setItem(USER_PLANS_KEY, JSON.stringify(allPlans));
      }

      console.log('[USER PLANS] Plan saved to backend:', backendPlan.id);
    } catch (error) {
      console.warn('[USER PLANS] Failed to save plan to backend, will sync later:', error);
    }
  }

  return newPlan;
}

/**
 * Update an existing plan
 */
export async function updateUserPlan(planId: string, updates: Partial<UserPlanPayload>): Promise<UserPlanTemplate | null> {
  const data = localStorage.getItem(USER_PLANS_KEY);
  const allPlans: UserPlanTemplate[] = data ? JSON.parse(data) : [];
  const index = allPlans.findIndex(plan => plan.id === planId);

  if (index === -1) {
    return null;
  }

  const updatedPlan: UserPlanTemplate = {
    ...allPlans[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  // Update localStorage first
  allPlans[index] = updatedPlan;
  localStorage.setItem(USER_PLANS_KEY, JSON.stringify(allPlans));

  // Try to update backend if online
  const online = isOnline();
  if (online) {
    try {
      console.log('[USER PLANS] Updating plan on backend:', planId);
      await userPlanService.update(planId, {
        name: updatedPlan.name,
        trainingType: 'custom',
        exercises: updatedPlan.exercises,
        notes: '',
        timesCompleted: updatedPlan.timesCompleted,
        updatedAt: updatedPlan.updatedAt,
      });
      console.log('[USER PLANS] Plan updated on backend');
    } catch (error) {
      console.warn('[USER PLANS] Failed to update plan on backend:', error);
    }
  }

  return updatedPlan;
}

/**
 * Delete a plan
 */
export async function deleteUserPlan(planId: string): Promise<boolean> {
  const data = localStorage.getItem(USER_PLANS_KEY);
  const allPlans: UserPlanTemplate[] = data ? JSON.parse(data) : [];
  const filtered = allPlans.filter(plan => plan.id !== planId);

  if (filtered.length === allPlans.length) {
    return false;
  }

  // Delete from localStorage first
  localStorage.setItem(USER_PLANS_KEY, JSON.stringify(filtered));

  // Mark plan as deleted to prevent re-sync
  const deletedData = localStorage.getItem(DELETED_PLANS_KEY);
  const deletedPlans = new Set<string>(deletedData ? JSON.parse(deletedData) : []);
  deletedPlans.add(planId);
  localStorage.setItem(DELETED_PLANS_KEY, JSON.stringify(Array.from(deletedPlans)));
  console.log('[USER PLANS] Marked plan as deleted:', planId);

  // Try to delete from backend if online, or add to outbox if offline
  const online = isOnline();
  if (online) {
    try {
      console.log('[USER PLANS] Deleting plan from backend:', planId);
      await userPlanService.delete(planId);
      console.log('[USER PLANS] Plan deleted from backend');
    } catch (error) {
      console.warn('[USER PLANS] Failed to delete plan from backend, adding to outbox:', error);
      // If delete failed while online, add to outbox for retry
      await addToOutbox('userPlan', 'delete', { id: planId });
    }
  } else {
    // Offline: add to outbox for sync when online
    console.log('[USER PLANS] Offline - adding deletion to outbox for later sync');
    await addToOutbox('userPlan', 'delete', { id: planId });
  }

  return true;
}

/**
 * Mark a plan as used (update lastUsed and increment timesCompleted)
 */
export function markPlanAsUsed(planId: string): void {
  const data = localStorage.getItem(USER_PLANS_KEY);
  const allPlans: UserPlanTemplate[] = data ? JSON.parse(data) : [];
  const index = allPlans.findIndex(plan => plan.id === planId);

  if (index !== -1) {
    allPlans[index].lastUsed = new Date().toISOString();
    allPlans[index].timesCompleted += 1;
    allPlans[index].updatedAt = new Date().toISOString();
    localStorage.setItem(USER_PLANS_KEY, JSON.stringify(allPlans));
  }
}

/**
 * Duplicate a plan
 */
export async function duplicateUserPlan(planId: string): Promise<UserPlanTemplate | null> {
  const originalPlan = getUserPlan(planId);
  if (!originalPlan) return null;

  const duplicatedPlan = await createUserPlan({
    userId: originalPlan.userId,
    name: `${originalPlan.name} (Copy)`,
    exercises: originalPlan.exercises.map(ex => ({ ...ex, id: crypto.randomUUID() })),
  });

  return duplicatedPlan;
}

/**
 * Sync user plans from backend
 * Merges backend data with local cache
 */
export async function syncUserPlansFromBackend(userId: string): Promise<void> {
  const online = isOnline();

  if (!online) {
    console.log('[USER PLANS] Offline - skipping backend sync');
    return;
  }

  try {
    console.log('[USER PLANS] 📡 Starting sync from backend for user:', userId);
    const backendPlans = await userPlanService.getAll() as any[];
    console.log(`[USER PLANS] 📥 API response: ${backendPlans.length} plans from backend`);
    console.log('[USER PLANS] 🔍 Raw backend data:', backendPlans);

    // Get current local plans
    const data = localStorage.getItem(USER_PLANS_KEY);
    const localPlans: UserPlanTemplate[] = data ? JSON.parse(data) : [];

    // Create a map of backend plans by ID
    const backendPlanMap = new Map<string, any>();
    backendPlans.forEach(plan => {
      backendPlanMap.set(plan.id, plan);
    });

    // Get list of deleted plans to filter them out
    const deletedData = localStorage.getItem(DELETED_PLANS_KEY);
    const deletedPlans = new Set<string>(deletedData ? JSON.parse(deletedData) : []);

    // Merge: backend plans take precedence
    const mergedPlans: UserPlanTemplate[] = [];
    const processedIds = new Set<string>();

    // Add backend plans (they're the source of truth)
    for (const backendPlan of backendPlans) {
      // Skip plans that were marked as deleted by user
      if (deletedPlans.has(backendPlan.id)) {
        console.log('[USER PLANS] Skipping plan marked as deleted:', backendPlan.id, backendPlan.name);
        continue;
      }

      const transformedPlan: UserPlanTemplate = {
        id: backendPlan.id,
        userId: backendPlan.userId,
        name: backendPlan.name,
        exercises: backendPlan.exercises || [],
        warmupMinutes: backendPlan.warmupMinutes,
        createdAt: backendPlan.createdAt,
        updatedAt: backendPlan.updatedAt,
        lastUsed: backendPlan.lastUsed,
        timesCompleted: backendPlan.timesCompleted || 0,
      };

      mergedPlans.push(transformedPlan);
      processedIds.add(transformedPlan.id);
    }

    // Get currently syncing plans to prevent duplicates
    const syncingData = localStorage.getItem(SYNCING_PLANS_KEY);
    const syncingPlans = new Set<string>(syncingData ? JSON.parse(syncingData) : []);

    // Add local-only plans (not yet synced to backend)
    for (const localPlan of localPlans) {
      if (!processedIds.has(localPlan.id)) {
        // Skip plans that were marked as deleted
        if (deletedPlans.has(localPlan.id)) {
          console.log('[USER PLANS] Plan was deleted by user, removing from local cache:', localPlan.id, localPlan.name);
          continue;
        }

        // Check if this plan has a MongoDB ID (24 hex chars)
        const isMongoId = /^[0-9a-f]{24}$/i.test(localPlan.id);

        if (isMongoId) {
          // This plan was deleted from backend, don't re-upload it
          console.log('[USER PLANS] Plan was deleted from backend, removing from local cache:', localPlan.id, localPlan.name);
          // Don't add to mergedPlans - this will remove it from localStorage
          continue;
        }

        // Check if already syncing this plan
        const planKey = `${localPlan.name}-${localPlan.createdAt}`;
        if (syncingPlans.has(planKey)) {
          console.warn('[USER PLANS] Plan already being synced, skipping:', planKey);
          continue;
        }

        console.log('[USER PLANS] Found local-only plan (new), will sync to backend:', localPlan.id);

        // Mark as syncing
        syncingPlans.add(planKey);
        localStorage.setItem(SYNCING_PLANS_KEY, JSON.stringify(Array.from(syncingPlans)));

        // Try to sync to backend
        try {
          const backendPlan = await userPlanService.create({
            name: localPlan.name,
            trainingType: 'custom', // Default training type
            exercises: localPlan.exercises,
            notes: '',
            timesCompleted: localPlan.timesCompleted,
            createdAt: localPlan.createdAt,
            updatedAt: localPlan.updatedAt,
          });
          console.log('[USER PLANS] Local plan synced to backend:', backendPlan);

          // Update local plan with backend ID to prevent future duplicates
          const updatedPlan: UserPlanTemplate = {
            ...localPlan,
            id: backendPlan.id, // Use backend ID from now on
          };
          mergedPlans.push(updatedPlan);
          processedIds.add(backendPlan.id);

          // Remove from syncing set (success)
          syncingPlans.delete(planKey);
        } catch (error) {
          console.warn('[USER PLANS] Failed to sync local plan to backend:', error);
          // If sync failed, keep local plan as-is
          mergedPlans.push(localPlan);
          // Remove from syncing set (failed, can retry later)
          syncingPlans.delete(planKey);
        }

        localStorage.setItem(SYNCING_PLANS_KEY, JSON.stringify(Array.from(syncingPlans)));
      }
    }

    // Save merged plans to localStorage
    localStorage.setItem(USER_PLANS_KEY, JSON.stringify(mergedPlans));
    console.log(`[USER PLANS] Sync complete - ${mergedPlans.length} total plans`);
  } catch (error) {
    console.error('[USER PLANS] Failed to sync from backend:', error);
  }
}
