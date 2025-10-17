import type { Video, VideoProgress, VideoType } from '../types/video';
import { sanitizeYouTubeUrl } from './yt';

const VIDEOS_STORAGE_KEY = 'rhinos_videos';
const VIDEO_PROGRESS_STORAGE_KEY = 'rhinos_video_progress';

// Get all videos
export function getAllVideos(): Video[] {
  const stored = localStorage.getItem(VIDEOS_STORAGE_KEY);
  if (!stored) return getMockVideos();
  return JSON.parse(stored);
}

// Get published videos only (for players)
export function getPublishedVideos(): Video[] {
  return getAllVideos()
    .filter(v => v.status === 'published')
    .sort((a, b) => {
      // Pinned first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // Then by order
      return a.order - b.order;
    });
}

// Get videos by type
export function getVideosByType(type: VideoType): Video[] {
  return getPublishedVideos().filter(v => v.type === type);
}

// Get video by ID
export function getVideoById(id: string): Video | undefined {
  return getAllVideos().find(v => v.id === id);
}

// Create video (coach only)
export function createVideo(video: Omit<Video, 'id' | 'createdAt' | 'updatedAt' | 'order'>): Video {
  const videos = getAllVideos();
  const newVideo: Video = {
    ...video,
    id: crypto.randomUUID(),
    youtubeUrl: sanitizeYouTubeUrl(video.youtubeUrl) || video.youtubeUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    order: videos.length,
  };
  videos.push(newVideo);
  localStorage.setItem(VIDEOS_STORAGE_KEY, JSON.stringify(videos));
  return newVideo;
}

// Update video (coach only)
export function updateVideo(id: string, updates: Partial<Video>): Video | null {
  const videos = getAllVideos();
  const index = videos.findIndex(v => v.id === id);
  if (index === -1) return null;

  const updatedVideo = {
    ...videos[index],
    ...updates,
    updatedAt: new Date().toISOString(),
    youtubeUrl: updates.youtubeUrl
      ? sanitizeYouTubeUrl(updates.youtubeUrl) || updates.youtubeUrl
      : videos[index].youtubeUrl,
  };

  videos[index] = updatedVideo;
  localStorage.setItem(VIDEOS_STORAGE_KEY, JSON.stringify(videos));
  return updatedVideo;
}

// Delete video (coach only)
export function deleteVideo(id: string): boolean {
  const videos = getAllVideos();
  const filtered = videos.filter(v => v.id !== id);
  if (filtered.length === videos.length) return false;

  localStorage.setItem(VIDEOS_STORAGE_KEY, JSON.stringify(filtered));

  // Also delete all progress for this video
  const progress = getAllVideoProgress();
  const filteredProgress = progress.filter(p => p.videoId !== id);
  localStorage.setItem(VIDEO_PROGRESS_STORAGE_KEY, JSON.stringify(filteredProgress));

  return true;
}

// Video Progress Functions

export function getAllVideoProgress(): VideoProgress[] {
  const stored = localStorage.getItem(VIDEO_PROGRESS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function getPlayerVideoProgress(playerId: string, videoId: string): VideoProgress | undefined {
  return getAllVideoProgress().find(p => p.playerId === playerId && p.videoId === videoId);
}

export function updateVideoProgress(
  playerId: string,
  videoId: string,
  timestamp: number,
  duration: number
): VideoProgress {
  const allProgress = getAllVideoProgress();
  const existingIndex = allProgress.findIndex(
    p => p.playerId === playerId && p.videoId === videoId
  );

  const percentWatched = duration > 0 ? Math.round((timestamp / duration) * 100) : 0;
  const completed = percentWatched >= 90;

  const progress: VideoProgress = {
    id: existingIndex >= 0 ? allProgress[existingIndex].id : crypto.randomUUID(),
    videoId,
    playerId,
    lastTimestamp: timestamp,
    totalDuration: duration,
    percentWatched,
    completed,
    lastWatchedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    allProgress[existingIndex] = progress;
  } else {
    allProgress.push(progress);
  }

  localStorage.setItem(VIDEO_PROGRESS_STORAGE_KEY, JSON.stringify(allProgress));
  return progress;
}

export function getPlayerProgressForAllVideos(playerId: string): Record<string, VideoProgress> {
  const progress = getAllVideoProgress().filter(p => p.playerId === playerId);
  return progress.reduce((acc, p) => {
    acc[p.videoId] = p;
    return acc;
  }, {} as Record<string, VideoProgress>);
}

// Mock data for initial setup
function getMockVideos(): Video[] {
  return [
    {
      id: '1',
      type: 'position',
      title: 'Running Back Fundamentals',
      description: 'Learn the basics of playing running back: stance, footwork, ball security, and vision.',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      status: 'published',
      level: 'intro',
      unit: 'Offense',
      positions: ['RB'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'coach1',
      order: 0,
      isPinned: true,
    },
    {
      id: '2',
      type: 'route',
      title: 'Slant Route Technique',
      description: 'Master the slant route: release, angle, catching in traffic.',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      status: 'published',
      level: 'intermediate',
      unit: 'Offense',
      positions: ['WR', 'TE'],
      routes: ['Slant'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'coach1',
      order: 1,
    },
    {
      id: '3',
      type: 'coverage',
      title: 'Cover 3 Zone Responsibilities',
      description: 'Understanding Cover 3 zone defense: deep thirds, flat zones, hook zones.',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      status: 'published',
      level: 'advanced',
      unit: 'Defense',
      positions: ['DB', 'LB'],
      coverages: ['Cover 3', 'Zone'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'coach1',
      order: 2,
    },
  ];
}
