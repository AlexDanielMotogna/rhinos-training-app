export type Position = 'RB' | 'WR' | 'LB' | 'OL' | 'DB' | 'QB' | 'DL' | 'TE' | 'K/P';

/**
 * Exercise Category - Now stored in backend database
 */
export interface ExerciseCategoryData {
  id: string;
  key: string;  // Unique key (e.g., "strength", "speed", "cod")
  nameEN: string;
  nameDE: string;
  color: string;
  icon?: string;
  active: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Legacy type for backward compatibility
 * Now represents the category key (string) instead of union type
 */
export type ExerciseCategory = string;

export type Intensity = 'low' | 'mod' | 'high';

export interface Exercise {
  id: string;
  name: string;
  category: string;  // Now stores ExerciseCategoryData.key
  youtubeUrl?: string;
  positionTags?: Position[];
  intensity?: Intensity;
  isGlobal?: boolean;
  createdBy?: string;
  isCustom?: boolean;
  descriptionEN?: string;
  descriptionDE?: string;
}
