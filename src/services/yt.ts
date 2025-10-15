/**
 * YouTube URL sanitizer
 * Accepts only youtube.com or youtu.be URLs
 * Returns embed URL or undefined if invalid
 */
export function sanitizeYouTubeUrl(url: string): string | undefined {
  if (!url || typeof url !== 'string') {
    return undefined;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return undefined;
  }

  try {
    const urlObj = new URL(trimmed);
    let videoId: string | null = null;

    // Handle youtube.com URLs
    if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
      // Standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
      if (urlObj.pathname === '/watch') {
        videoId = urlObj.searchParams.get('v');
      }
      // Embed URL: https://www.youtube.com/embed/VIDEO_ID
      else if (urlObj.pathname.startsWith('/embed/')) {
        videoId = urlObj.pathname.split('/embed/')[1]?.split('?')[0];
      }
    }
    // Handle youtu.be URLs: https://youtu.be/VIDEO_ID
    else if (urlObj.hostname === 'youtu.be') {
      videoId = urlObj.pathname.slice(1).split('?')[0];
    }

    // Validate video ID (should be alphanumeric, underscores, hyphens, 11 chars typically)
    if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return `https://www.youtube.com/embed/${videoId}`;
    }

    return undefined;
  } catch {
    return undefined;
  }
}
