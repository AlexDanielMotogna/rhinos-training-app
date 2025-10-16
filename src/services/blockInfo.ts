/**
 * Block Info Service
 * Manages block informational text in localStorage
 */

import type { BlockInfo, BlockInfoPayload } from '../types/blockInfo';

// Re-export types for convenience
export type { BlockInfo, BlockInfoPayload };

const BLOCK_INFO_KEY = 'rhinos_block_info';

/**
 * Get all block info
 */
export function getAllBlockInfo(): BlockInfo[] {
  const data = localStorage.getItem(BLOCK_INFO_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Get block info by block name and training type
 */
export function getBlockInfo(blockName: string, trainingType: 'strength_conditioning' | 'sprints_speed'): BlockInfo | null {
  const allInfo = getAllBlockInfo();
  return allInfo.find(
    (info) => info.blockName === blockName && info.trainingType === trainingType
  ) || null;
}

/**
 * Create or update block info
 */
export function saveBlockInfo(payload: BlockInfoPayload): BlockInfo {
  const allInfo = getAllBlockInfo();

  // Check if this block info already exists
  const existingIndex = allInfo.findIndex(
    (info) => info.blockName === payload.blockName && info.trainingType === payload.trainingType
  );

  if (existingIndex !== -1) {
    // Update existing
    const updated: BlockInfo = {
      ...allInfo[existingIndex],
      infoText: payload.infoText,
      updatedAt: new Date().toISOString(),
    };
    allInfo[existingIndex] = updated;
    localStorage.setItem(BLOCK_INFO_KEY, JSON.stringify(allInfo));
    return updated;
  } else {
    // Create new
    const newInfo: BlockInfo = {
      id: crypto.randomUUID(),
      ...payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    allInfo.push(newInfo);
    localStorage.setItem(BLOCK_INFO_KEY, JSON.stringify(allInfo));
    return newInfo;
  }
}

/**
 * Delete block info
 */
export function deleteBlockInfo(id: string): boolean {
  const allInfo = getAllBlockInfo();
  const filtered = allInfo.filter((info) => info.id !== id);

  if (filtered.length !== allInfo.length) {
    localStorage.setItem(BLOCK_INFO_KEY, JSON.stringify(filtered));
    return true;
  }

  return false;
}

/**
 * Initialize default block info if none exists
 */
export function initializeDefaultBlockInfo(): void {
  const existing = getAllBlockInfo();

  if (existing.length === 0) {
    // Add default info for common blocks
    const defaults: BlockInfoPayload[] = [
      {
        blockName: 'Compound Lifts',
        trainingType: 'strength_conditioning',
        infoText: 'Multi-joint exercises that work multiple muscle groups simultaneously. These are the foundation of your strength program (e.g., Squat, Bench Press, Deadlift). Use heavier weights and focus on proper form.',
      },
      {
        blockName: 'Accessory Work',
        trainingType: 'strength_conditioning',
        infoText: 'Supplementary exercises that target specific muscle groups to support the main lifts. These help prevent injuries, correct muscle imbalances, and improve overall performance (e.g., Lunges, Rows, Pull-ups). Use moderate weights with controlled movements.',
      },
    ];

    defaults.forEach((payload) => saveBlockInfo(payload));
  }
}
