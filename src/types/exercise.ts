export type Position = 'RB' | 'WR' | 'LB' | 'OL' | 'DB' | 'QB' | 'DL' | 'TE' | 'K/P';

export type ExerciseCategory =
  | 'Strength'
  | 'Speed'
  | 'COD'
  | 'Mobility'
  | 'Technique'
  | 'Conditioning'
  | 'Recovery'
  | 'Plyometrics';

export type Intensity = 'low' | 'mod' | 'high';

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  youtubeUrl?: string;
  positionTags?: Position[];
  intensity?: Intensity;
  isGlobal?: boolean;
  createdBy?: string;
  isCustom?: boolean;
  descriptionEN?: string;
  descriptionDE?: string;
}
