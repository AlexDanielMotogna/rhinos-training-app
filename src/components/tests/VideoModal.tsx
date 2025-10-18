import React from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { sanitizeYouTubeUrl } from '../../services/yt';

interface VideoModalProps {
  open: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
}

export const VideoModal: React.FC<VideoModalProps> = ({ open, onClose, videoUrl, title }) => {
  // Get embedded YouTube URL
  const getEmbedUrl = (url: string | undefined): string | null => {
    if (!url) return null;
    const sanitized = sanitizeYouTubeUrl(url);
    if (!sanitized) return null;

    // Convert watch URL to embed URL
    const videoId = sanitized.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const embedUrl = getEmbedUrl(videoUrl);

  if (!embedUrl) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {title}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: 'text.secondary' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ borderRadius: 1, overflow: 'hidden' }}>
          <Box
            component="iframe"
            src={embedUrl}
            sx={{
              width: '100%',
              height: { xs: 250, sm: 400, md: 500 },
              border: 'none',
              borderRadius: 1,
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
};
