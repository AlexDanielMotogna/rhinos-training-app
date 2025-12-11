/**
 * User Plan Service
 * Manages user-created workout plan templates - reads from backend only
 */

import type { UserPlanTemplate, UserPlanPayload } from '../types/userPlan';
import { userPlanService } from './api';

/**
 * Get all plans for a user from backend
 */
export async function getUserPlans(userId: string): Promise<UserPlanTemplate[]> {
  try {
    console.log('[USER PLANS] Loading plans from backend for user:', userId);
    const backendPlans = await userPlanService.getAll() as UserPlanTemplate[];

    // Backend already filters by userId
    console.log('[USER PLANS] Loaded', backendPlans.length, 'plans from backend');
    return backendPlans || [];
  } catch (error) {
    console.error('[USER PLANS] Failed to load from backend:', error);
    return [];
  }
}

/**
 * Alias for getUserPlans - for backwards compatibility
 */
export const getUserPlansFromBackend = getUserPlans;

/**
 * Get a specific plan by ID from backend
 */
export async function getUserPlan(planId: string): Promise<UserPlanTemplate | null> {
  try {
    // Note: Backend doesn't have a getById endpoint for plans yet
    // So we fetch all and filter
    const allPlans = await userPlanService.getAll() as UserPlanTemplate[];
    return allPlans.find(plan => plan.id === planId) || null;
  } catch (error) {
    console.error('[USER PLANS] Failed to get plan from backend:', error);
    return null;
  }
}

/**
 * Create a new plan in backend
 */
export async function createUserPlan(payload: UserPlanPayload): Promise<UserPlanTemplate> {
  try {
    console.log('[USER PLANS] Creating plan on backend:', payload.name);
    const backendPlan = await userPlanService.create({
      name: payload.name,
      trainingType: 'custom',
      exercises: payload.exercises,
      notes: '',
      timesCompleted: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }) as UserPlanTemplate;

    console.log('[USER PLANS] Plan created on backend:', backendPlan.id);
    return backendPlan;
  } catch (error) {
    console.error('[USER PLANS] Failed to create plan on backend:', error);
    throw error;
  }
}

/**
 * Update an existing plan in backend
 */
export async function updateUserPlan(planId: string, updates: Partial<UserPlanPayload>): Promise<UserPlanTemplate | null> {
  try {
    console.log('[USER PLANS] Updating plan on backend:', planId);
    const updatedPlan = await userPlanService.update(planId, {
      name: updates.name,
      trainingType: 'custom',
      exercises: updates.exercises,
      notes: '',
      updatedAt: new Date().toISOString(),
    }) as UserPlanTemplate;

    console.log('[USER PLANS] Plan updated successfully on backend');
    return updatedPlan;
  } catch (error) {
    console.error('[USER PLANS] Failed to update plan on backend:', error);
    throw error;
  }
}

/**
 * Delete a plan from backend
 */
export async function deleteUserPlan(planId: string): Promise<boolean> {
  try {
    console.log('[USER PLANS] Deleting plan from backend:', planId);
    await userPlanService.delete(planId);
    console.log('[USER PLANS] Plan deleted from backend');
    return true;
  } catch (error) {
    console.error('[USER PLANS] Failed to delete plan from backend:', error);
    throw error;
  }
}

/**
 * Mark a plan as used (update lastUsed and increment timesCompleted)
 */
export async function markPlanAsUsed(planId: string): Promise<void> {
  try {
    // Fetch current plan
    const plan = await getUserPlan(planId);
    if (!plan) {
      console.warn('[USER PLANS] Plan not found:', planId);
      return;
    }

    // Update with new usage data
    await userPlanService.update(planId, {
      lastUsed: new Date().toISOString(),
      timesCompleted: (plan.timesCompleted || 0) + 1,
      updatedAt: new Date().toISOString(),
    });

    console.log('[USER PLANS] Plan marked as used:', planId);
  } catch (error) {
    console.error('[USER PLANS] Failed to mark plan as used:', error);
    // Don't throw - this is not critical
  }
}

/**
 * Duplicate a plan
 */
export async function duplicateUserPlan(planId: string): Promise<UserPlanTemplate | null> {
  try {
    const originalPlan = await getUserPlan(planId);
    if (!originalPlan) return null;

    const duplicatedPlan = await createUserPlan({
      userId: originalPlan.userId,
      name: `${originalPlan.name} (Copy)`,
      exercises: originalPlan.exercises.map(ex => ({ ...ex, id: crypto.randomUUID() })),
    });

    return duplicatedPlan;
  } catch (error) {
    console.error('[USER PLANS] Failed to duplicate plan:', error);
    return null;
  }
}

/**
 * Clear legacy localStorage data
 */
export function clearLegacyStorage(): void {
  console.log('[USER PLANS] Clearing legacy localStorage');
  localStorage.removeItem('rhinos_user_plans');
  localStorage.removeItem('rhinos_deleted_plans');
}
