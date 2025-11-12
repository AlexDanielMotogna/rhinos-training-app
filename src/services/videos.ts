import type { Video, VideoProgress } from '../types/video';
import { sanitizeYouTubeUrl, extractYouTubeVideoId } from './yt';
import { videoService } from './api';
import { isOnline } from './sync';

const VIDEOS_STORAGE_KEY = 'rhinos_videos';
const VIDEO_PROGRESS_STORAGE_KEY = 'rhinos_video_progress';

// Check if URL is a YouTube Short
export function isYouTubeShort(url: string): boolean {
  return url.includes('/shorts/') || url.includes('youtube.com/shorts');
}

// Export the robust extractYouTubeVideoId from yt.ts for backwards compatibility
export function getYouTubeVideoId(url: string): string | null {
  return extractYouTubeVideoId(url) || null;
}

/**
 * Sync videos from backend to localStorage
 * This should be called on app mount
 */
export async function syncVideosFromBackend(): Promise<void> {
  if (!isOnline()) {
    console.log('📦 Offline - skipping video sync');
    return;
  }

  try {
    console.log('🔄 Syncing videos from backend...');
    const backendVideos = await videoService.getAll();

    // Get current local videos
    const localData = localStorage.getItem(VIDEOS_STORAGE_KEY);
    const localVideos: any[] = localData ? JSON.parse(localData) : [];

    // Merge: compare timestamps to keep newer version
    const mergedVideos: any[] = [];
    const processedIds = new Set<string>();

    // Process backend videos
    for (const backendVideo of backendVideos) {
      const localVideo = localVideos.find(v => v.id === backendVideo.id);

      if (localVideo) {
        // Compare timestamps
        const localTime = new Date(localVideo.updatedAt).getTime();
        const backendTime = new Date(backendVideo.updatedAt).getTime();

        if (localTime > backendTime) {
          // Local is newer (e.g., draft edits) - keep local
          console.log('[VIDEOS] Local version is newer, keeping local:', localVideo.id);
          mergedVideos.push(localVideo);
        } else {
          // Backend is newer or same - use backend
          mergedVideos.push(backendVideo);
        }
      } else {
        // No local version - use backend
        mergedVideos.push(backendVideo);
      }

      processedIds.add(backendVideo.id);
    }

    // Add local-only videos (drafts not yet synced)
    for (const localVideo of localVideos) {
      if (!processedIds.has(localVideo.id)) {
        console.log('[VIDEOS] Found local-only video (draft):', localVideo.id);
        mergedVideos.push(localVideo);
      }
    }

    // Save merged videos
    localStorage.setItem(VIDEOS_STORAGE_KEY, JSON.stringify(mergedVideos));
    console.log(`✅ Videos synced successfully (${mergedVideos.length} videos)`);
  } catch (error) {
    console.warn('⚠️ Failed to sync videos from backend:', error);
  }
}

// Get all videos (from cache)
export function getAllVideos(): Video[] {
  const stored = localStorage.getItem(VIDEOS_STORAGE_KEY);
  if (!stored) return [];
  return JSON.parse(stored);
}

// Get published videos only (for players)
export function getPublishedVideos(): Video[] {
  return getAllVideos()
    .filter(v => v.status === 'published')
    .sort((a, b) => {
      // Sort by pinned first, then by order, then by most recent
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (a.order !== b.order) return a.order - b.order;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}

// Get videos by type
export function getVideosByType(type: string): Video[] {
  return getAllVideos().filter(v => v.type === type);
}

// Get video by ID
export function getVideoById(id: string): Video | undefined {
  return getAllVideos().find(v => v.id === id);
}

/**
 * Create video (coach only) - Backend first
 */
export async function createVideo(video: {
  title: string;
  description?: string;
  youtubeUrl: string;
  type: 'position' | 'route' | 'coverage';
  status?: 'draft' | 'published';
  level?: 'intro' | 'intermediate' | 'advanced';
  unit?: 'Offense' | 'Defense' | 'Special Teams';
  positions?: string[];
  routes?: string[];
  coverages?: string[];
  createdBy: string;
  order?: number;
  isPinned?: boolean;
}): Promise<Video> {
  if (!isOnline()) {
    throw new Error('Cannot create video while offline');
  }

  try {
    // Sanitize YouTube URL
    const sanitizedUrl = sanitizeYouTubeUrl(video.youtubeUrl) || video.youtubeUrl;

    const newVideo = await videoService.create({
      ...video,
      youtubeUrl: sanitizedUrl,
    });

    // Update cache
    const videos = getAllVideos();
    videos.push(newVideo);
    localStorage.setItem(VIDEOS_STORAGE_KEY, JSON.stringify(videos));

    console.log('✅ Video created:', newVideo.title);
    return newVideo;
  } catch (error) {
    console.error('Failed to create video:', error);
    throw error;
  }
}

/**
 * Update video (coach only) - Backend first
 */
export async function updateVideo(id: string, updates: {
  title?: string;
  description?: string;
  youtubeUrl?: string;
  type?: 'position' | 'route' | 'coverage';
  status?: 'draft' | 'published';
  level?: 'intro' | 'intermediate' | 'advanced' | null;
  unit?: 'Offense' | 'Defense' | 'Special Teams' | null;
  positions?: string[];
  routes?: string[];
  coverages?: string[];
  order?: number;
  isPinned?: boolean;
}): Promise<Video> {
  if (!isOnline()) {
    throw new Error('Cannot update video while offline');
  }

  try {
    // Sanitize YouTube URL if provided
    const sanitizedUpdates = { ...updates };
    if (updates.youtubeUrl) {
      sanitizedUpdates.youtubeUrl = sanitizeYouTubeUrl(updates.youtubeUrl) || updates.youtubeUrl;
    }

    const updatedVideo = await videoService.update(id, sanitizedUpdates);

    // Update cache
    const videos = getAllVideos();
    const index = videos.findIndex(v => v.id === id);
    if (index !== -1) {
      videos[index] = updatedVideo;
      localStorage.setItem(VIDEOS_STORAGE_KEY, JSON.stringify(videos));
    }

    console.log('✅ Video updated:', updatedVideo.title);
    return updatedVideo;
  } catch (error) {
    console.error('Failed to update video:', error);
    throw error;
  }
}

/**
 * Delete video (coach only) - Backend first
 */
export async function deleteVideo(id: string): Promise<void> {
  if (!isOnline()) {
    throw new Error('Cannot delete video while offline');
  }

  try {
    await videoService.delete(id);

    // Update cache
    const videos = getAllVideos();
    const filtered = videos.filter(v => v.id !== id);
    localStorage.setItem(VIDEOS_STORAGE_KEY, JSON.stringify(filtered));

    // Also delete all progress for this video from cache
    const progress = getAllVideoProgress();
    const filteredProgress = progress.filter(p => p.videoId !== id);
    localStorage.setItem(VIDEO_PROGRESS_STORAGE_KEY, JSON.stringify(filteredProgress));

    console.log('✅ Video deleted');
  } catch (error) {
    console.error('Failed to delete video:', error);
    throw error;
  }
}

// ========================================
// VIDEO PROGRESS FUNCTIONS
// ========================================

/**
 * Get all video progress from cache
 */
export function getAllVideoProgress(): VideoProgress[] {
  const stored = localStorage.getItem(VIDEO_PROGRESS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Get player's progress for a specific video
 */
export function getPlayerVideoProgress(playerId: string, videoId: string): VideoProgress | undefined {
  return getAllVideoProgress().find(p => p.playerId === playerId && p.videoId === videoId);
}

/**
 * Update video progress - Backend first
 */
export async function updateVideoProgress(
  playerId: string,
  videoId: string,
  timestamp: number,
  duration: number
): Promise<VideoProgress> {
  const percentWatched = duration > 0 ? Math.round((timestamp / duration) * 100) : 0;
  const completed = percentWatched >= 90;

  const progressData = {
    lastTimestamp: timestamp,
    totalDuration: duration,
    percentWatched,
    completed,
  };

  // Save to backend if online
  if (isOnline()) {
    try {
      const backendProgress = await videoService.saveProgress(videoId, progressData);

      // Update local cache
      const allProgress = getAllVideoProgress();
      const existingIndex = allProgress.findIndex(
        p => p.playerId === playerId && p.videoId === videoId
      );

      const progress: VideoProgress = {
        id: backendProgress.id,
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
    } catch (error) {
      console.warn('Failed to save progress to backend, saving locally:', error);
      // Fall through to local save
    }
  }

  // Local save only (offline mode)
  const allProgress = getAllVideoProgress();
  const existingIndex = allProgress.findIndex(
    p => p.playerId === playerId && p.videoId === videoId
  );

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

/**
 * Get all progress for a player
 */
export function getPlayerProgressForAllVideos(playerId: string): Record<string, VideoProgress> {
  const progress = getAllVideoProgress().filter(p => p.playerId === playerId);
  return progress.reduce((acc, p) => {
    acc[p.videoId] = p;
    return acc;
  }, {} as Record<string, VideoProgress>);
}

/**
 * Sync video progress from backend (optional - for coach viewing player progress)
 */
export async function syncVideoProgressFromBackend(userId: string): Promise<void> {
  if (!isOnline()) {
    console.log('📦 Offline - skipping video progress sync');
    return;
  }

  try {
    const backendProgress = await videoService.getUserProgress(userId);

    // Get current local progress
    const localData = localStorage.getItem(VIDEO_PROGRESS_STORAGE_KEY);
    const localProgress: any[] = localData ? JSON.parse(localData) : [];

    // Merge: compare timestamps to keep newer version
    const mergedProgress: any[] = [];
    const processedIds = new Set<string>();

    // Process backend progress
    for (const backendItem of backendProgress) {
      const localItem = localProgress.find(p => p.videoId === backendItem.videoId);

      if (localItem) {
        // Compare timestamps
        const localTime = new Date(localItem.lastWatchedAt).getTime();
        const backendTime = new Date(backendItem.lastWatchedAt).getTime();

        if (localTime > backendTime) {
          // Local is newer - keep local
          console.log('[VIDEO PROGRESS] Local progress is newer for video:', localItem.videoId);
          mergedProgress.push(localItem);
        } else {
          // Backend is newer or same - use backend
          mergedProgress.push(backendItem);
        }
      } else {
        // No local version - use backend
        mergedProgress.push(backendItem);
      }

      processedIds.add(backendItem.videoId);
    }

    // Add local-only progress (not yet synced)
    for (const localItem of localProgress) {
      if (!processedIds.has(localItem.videoId)) {
        console.log('[VIDEO PROGRESS] Found local-only progress for video:', localItem.videoId);
        mergedProgress.push(localItem);
      }
    }

    // Save merged progress
    localStorage.setItem(VIDEO_PROGRESS_STORAGE_KEY, JSON.stringify(mergedProgress));
    console.log('✅ Video progress synced from backend');
  } catch (error) {
    console.warn('⚠️ Failed to sync video progress:', error);
  }
}
