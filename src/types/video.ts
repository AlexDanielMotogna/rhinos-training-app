export type VideoType = 'position' | 'route' | 'coverage';
export type VideoStatus = 'draft' | 'published';
export type VideoLevel = 'intro' | 'intermediate' | 'advanced';
export type Unit = 'Offense' | 'Defense' | 'Special Teams';

// Position tags
export type PositionTag = 'QB' | 'RB' | 'WR' | 'TE' | 'OL' | 'DL' | 'LB' | 'DB' | 'K/P';

// Route tags
export type RouteTag =
  | 'Slant'
  | 'Out'
  | 'Curl'
  | 'Post'
  | 'Wheel'
  | 'Dig'
  | 'Corner'
  | 'Comeback'
  | 'Screen'
  | 'Go/Fade'
  | 'Hitch'
  | 'Cross'
  | 'Drag'
  | 'Seam'
  | 'Flag';

// Coverage tags
export type CoverageTag =
  | 'Cover 0'
  | 'Cover 1'
  | 'Cover 2'
  | 'Cover 3'
  | 'Cover 4'
  | 'Cover 6'
  | 'Quarters'
  | 'Palms'
  | 'Tampa 2'
  | 'Man'
  | 'Zone'
  | 'Match';

export interface Video {
  id: string;
  type: VideoType;
  title: string;
  description: string; // Can be markdown
  youtubeUrl: string; // Sanitized URL
  status: VideoStatus;
  level?: VideoLevel;
  unit?: Unit;

  // Tags based on type
  positions?: PositionTag[];
  routes?: RouteTag[];
  coverages?: CoverageTag[];

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string; // Coach ID
  order: number; // For custom ordering
  isPinned?: boolean; // Featured/highlighted
}

// Player progress tracking
export interface VideoProgress {
  id: string;
  videoId: string;
  playerId: string;
  lastTimestamp: number; // Seconds watched
  totalDuration: number; // Total video duration in seconds
  percentWatched: number; // 0-100
  completed: boolean; // True if watched > 90%
  lastWatchedAt: string;
}

export type WatchStatus = 'new' | 'in-progress' | 'completed';
