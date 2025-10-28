/**
 * User Plan Service
 * Manages user-created workout plan templates with backend + localStorage support
 */

import type { UserPlanTemplate, UserPlanPayload } from '../types/userPlan';
import { userPlanService } from './api';
import { isOnline } from './sync';

const USER_PLANS_KEY = 'rhinos_user_plans';

/**
 * Get all plans for a user
 */
export function getUserPlans(userId: string): UserPlanTemplate[] {
  const data = localStorage.getItem(USER_PLANS_KEY);
  const allPlans: UserPlanTemplate[] = data ? JSON.parse(data) : [];
  return allPlans.filter(plan => plan.userId === userId);
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

  // Try to delete from backend if online
  const online = isOnline();
  if (online) {
    try {
      console.log('[USER PLANS] Deleting plan from backend:', planId);
      await userPlanService.delete(planId);
      console.log('[USER PLANS] Plan deleted from backend');
    } catch (error) {
      console.warn('[USER PLANS] Failed to delete plan from backend:', error);
    }
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
    console.log('[USER PLANS] Syncing plans from backend for user:', userId);
    const backendPlans = await userPlanService.getAll() as any[];
    console.log(`[USER PLANS] Loaded ${backendPlans.length} plans from backend`);

    // Get current local plans
    const data = localStorage.getItem(USER_PLANS_KEY);
    const localPlans: UserPlanTemplate[] = data ? JSON.parse(data) : [];

    // Create a map of backend plans by ID
    const backendPlanMap = new Map<string, any>();
    backendPlans.forEach(plan => {
      backendPlanMap.set(plan.id, plan);
    });

    // Merge: backend plans take precedence
    const mergedPlans: UserPlanTemplate[] = [];
    const processedIds = new Set<string>();

    // Add backend plans (they're the source of truth)
    for (const backendPlan of backendPlans) {
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

    // Add local-only plans (not yet synced to backend)
    for (const localPlan of localPlans) {
      if (!processedIds.has(localPlan.id)) {
        console.log('[USER PLANS] Found local-only plan, will sync to backend:', localPlan.id);
        mergedPlans.push(localPlan);

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
        } catch (error) {
          console.warn('[USER PLANS] Failed to sync local plan to backend:', error);
        }
      }
    }

    // Save merged plans to localStorage
    localStorage.setItem(USER_PLANS_KEY, JSON.stringify(mergedPlans));
    console.log(`[USER PLANS] Sync complete - ${mergedPlans.length} total plans`);
  } catch (error) {
    console.error('[USER PLANS] Failed to sync from backend:', error);
  }
}
