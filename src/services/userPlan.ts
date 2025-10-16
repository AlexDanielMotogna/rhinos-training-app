/**
 * User Plan Service
 * Manages user-created workout plan templates in localStorage
 */

import type { UserPlanTemplate, UserPlanPayload } from '../types/userPlan';

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
export function createUserPlan(payload: UserPlanPayload): UserPlanTemplate {
  const data = localStorage.getItem(USER_PLANS_KEY);
  const allPlans: UserPlanTemplate[] = data ? JSON.parse(data) : [];

  const newPlan: UserPlanTemplate = {
    id: crypto.randomUUID(),
    ...payload,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timesCompleted: 0,
  };

  allPlans.push(newPlan);
  localStorage.setItem(USER_PLANS_KEY, JSON.stringify(allPlans));

  return newPlan;
}

/**
 * Update an existing plan
 */
export function updateUserPlan(planId: string, updates: Partial<UserPlanPayload>): UserPlanTemplate | null {
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

  allPlans[index] = updatedPlan;
  localStorage.setItem(USER_PLANS_KEY, JSON.stringify(allPlans));

  return updatedPlan;
}

/**
 * Delete a plan
 */
export function deleteUserPlan(planId: string): boolean {
  const data = localStorage.getItem(USER_PLANS_KEY);
  const allPlans: UserPlanTemplate[] = data ? JSON.parse(data) : [];
  const filtered = allPlans.filter(plan => plan.id !== planId);

  if (filtered.length !== allPlans.length) {
    localStorage.setItem(USER_PLANS_KEY, JSON.stringify(filtered));
    return true;
  }

  return false;
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
export function duplicateUserPlan(planId: string): UserPlanTemplate | null {
  const originalPlan = getUserPlan(planId);
  if (!originalPlan) return null;

  const duplicatedPlan = createUserPlan({
    userId: originalPlan.userId,
    name: `${originalPlan.name} (Copy)`,
    exercises: originalPlan.exercises.map(ex => ({ ...ex, id: crypto.randomUUID() })),
  });

  return duplicatedPlan;
}
