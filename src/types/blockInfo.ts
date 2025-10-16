/**
 * Block Info Types
 * Manages informational text for workout blocks
 *
 * Multi-language support ready for database integration:
 * - infoText_en: English text
 * - infoText_de: German text
 * This structure makes it easy to add more languages in the future
 */

export interface BlockInfo {
  id: string;
  blockName: string; // e.g., "Compound Lifts", "Accessory Work", "Speed Work"
  infoText_en: string; // English informational tooltip text
  infoText_de: string; // German informational tooltip text
  trainingType: 'strength_conditioning' | 'sprints_speed'; // Which training type this belongs to
  createdAt: string;
  updatedAt: string;
}

export type BlockInfoPayload = Omit<BlockInfo, 'id' | 'createdAt' | 'updatedAt'>;
