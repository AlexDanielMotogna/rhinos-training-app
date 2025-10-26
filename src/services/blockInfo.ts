/**
 * Block Info Service
 * Manages block informational text via backend API
 */

import { apiCall } from './api';

export interface BlockInfo {
  id: string;
  blockName: string;
  trainingType: string; // MongoDB ID
  trainingTypeKey?: string; // Training type key (e.g., 'strength_conditioning')
  infoText_en: string;
  infoText_de: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BlockInfoPayload {
  blockName: string;
  trainingType: string;
  infoText_en: string;
  infoText_de: string;
}

/**
 * Get all block info from backend
 */
export async function getAllBlockInfo(): Promise<BlockInfo[]> {
  try {
    return await apiCall('/block-info') as BlockInfo[];
  } catch (error) {
    console.error('Error loading block info:', error);
    return [];
  }
}

/**
 * Get block info by block name and training type
 * @param blockName - The name of the block
 * @param trainingType - Can be either the training type key (e.g., 'strength_conditioning') or MongoDB ID
 */
export async function getBlockInfo(blockName: string, trainingType: string): Promise<BlockInfo | null> {
  const allInfo = await getAllBlockInfo();

  // Debug logging
  console.log('🔍 getBlockInfo - Searching for:', { blockName, trainingType });
  console.log('📋 Available block info:', allInfo.map(info => ({
    blockName: info.blockName,
    trainingType: info.trainingType,
    trainingTypeKey: info.trainingTypeKey
  })));

  const found = allInfo.find(
    (info) =>
      info.blockName === blockName &&
      (info.trainingType === trainingType || info.trainingTypeKey === trainingType)
  );

  console.log('✅ Found block info:', found || 'NOT FOUND');

  return found || null;
}

/**
 * Create new block info
 */
export async function createBlockInfo(payload: BlockInfoPayload): Promise<BlockInfo> {
  return await apiCall('/block-info', {
    method: 'POST',
    body: JSON.stringify(payload),
  }) as BlockInfo;
}

/**
 * Update block info
 */
export async function updateBlockInfo(id: string, payload: Partial<BlockInfoPayload>): Promise<BlockInfo> {
  return await apiCall(`/block-info/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }) as BlockInfo;
}

/**
 * Delete block info
 */
export async function deleteBlockInfo(id: string): Promise<boolean> {
  try {
    await apiCall(`/block-info/${id}`, {
      method: 'DELETE',
    });
    return true;
  } catch (error) {
    console.error('Error deleting block info:', error);
    return false;
  }
}
