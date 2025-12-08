/**
 * User Plan Service
 * Manages user-created workout plan templates with backend + localStorage support
 */

import type { UserPlanTemplate, UserPlanPayload } from '../types/userPlan';
import { userPlanService } from './api';

const USER_PLANS_KEY = 'rhinos_user_plans';
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
 * Get all plans for a user from backend
 */
export async function getUserPlansFromBackend(userId: string): Promise<UserPlanTemplate[]> {
  console.log('[USER PLANS] Loading plans from backend for user:', userId);

  try {
    const backendPlans = await userPlanService.getAll() as UserPlanTemplate[];

    // Filter plans for this user (backend returns all user's plans already)
    const userBackendPlans = backendPlans.filter(p => p.userId === userId);

    // Update localStorage cache
    const allPlans = JSON.parse(localStorage.getItem(USER_PLANS_KEY) || '[]');
    const otherPlans = allPlans.filter((p: UserPlanTemplate) => p.userId !== userId);
    const mergedPlans = [...otherPlans, ...userBackendPlans];
    localStorage.setItem(USER_PLANS_KEY, JSON.stringify(mergedPlans));

    console.log('[USER PLANS] Loaded', userBackendPlans.length, 'plans from backend');
    return userBackendPlans;
  } catch (error) {
    console.error('[USER PLANS] Failed to load from backend:', error);
    // Fallback to localStorage
    return getUserPlans(userId);
  }
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

  // Try to save to backend
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
    console.error('[USER PLANS] Failed to save plan to backend:', error);
    // Continue with localStorage version
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

  // Update backend
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
    console.log('[USER PLANS] Plan updated successfully on backend');
  } catch (error) {
    console.error('[USER PLANS] Failed to update plan on backend:', error);
    throw error;
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

  // Try to delete from backend
  try {
    console.log('[USER PLANS] Deleting plan from backend:', planId);
    await userPlanService.delete(planId);
    console.log('[USER PLANS] Plan deleted from backend');
  } catch (error) {
    console.warn('[USER PLANS] Failed to delete plan from backend:', error);
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

