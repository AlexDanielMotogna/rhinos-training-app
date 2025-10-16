/**
 * Block Info Types
 * Manages informational text for workout blocks
 */

export interface BlockInfo {
  id: string;
  blockName: string; // e.g., "Compound Lifts", "Accessory Work", "Speed Work"
  infoText: string; // The informational tooltip text
  trainingType: 'strength_conditioning' | 'sprints_speed'; // Which training type this belongs to
  createdAt: string;
  updatedAt: string;
}

export type BlockInfoPayload = Omit<BlockInfo, 'id' | 'createdAt' | 'updatedAt'>;
