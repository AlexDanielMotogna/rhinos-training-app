import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  InputAdornment,
  Box,
  Chip,
  Typography,
  Tabs,
  Tab,
  IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { globalCatalog } from '../../services/catalog';
import type { Exercise, ExerciseCategory } from '../../types/exercise';
import { sanitizeYouTubeUrl } from '../../services/yt';

interface ExerciseSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}

export const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({
  open,
  onClose,
  onSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | 'All'>('All');
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);

  const categories: Array<ExerciseCategory | 'All'> = [
    'All',
    'Strength',
    'Speed',
    'COD',
    'Mobility',
    'Technique',
    'Conditioning',
  ];

  // Filter exercises
  const filteredExercises = globalCatalog.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || exercise.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelect = (exercise: Exercise) => {
    onSelect(exercise);
    setSearchTerm('');
    setSelectedCategory('All');
    setPreviewExercise(null);
  };

  const handleVideoClick = (exercise: Exercise, event: React.MouseEvent) => {
    event.stopPropagation();
    setPreviewExercise(exercise);
  };

  const getEmbedUrl = (url: string | undefined): string | null => {
    if (!url) return null;
    const sanitized = sanitizeYouTubeUrl(url);
    if (!sanitized) return null;

    const videoId = sanitized.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Select Exercise</DialogTitle>
      <DialogContent>
        {/* Video Preview */}
        {previewExercise && previewExercise.youtubeUrl && (
          <Box sx={{ mb: 3, borderRadius: 1, overflow: 'hidden', bgcolor: 'background.default', p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                {previewExercise.name}
              </Typography>
              <Typography
                variant="caption"
                color="primary"
                sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => setPreviewExercise(null)}
              >
                Close preview
              </Typography>
            </Box>
            <Box
              component="iframe"
              src={getEmbedUrl(previewExercise.youtubeUrl) || ''}
              sx={{
                width: '100%',
                height: 300,
                border: 'none',
                borderRadius: 1,
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </Box>
        )}

        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search exercises..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          autoFocus
        />

        {/* Category Tabs */}
        <Tabs
          value={selectedCategory}
          onChange={(_, value) => setSelectedCategory(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          {categories.map(cat => (
            <Tab key={cat} label={cat} value={cat} />
          ))}
        </Tabs>

        {/* Exercise List */}
        {filteredExercises.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No exercises found. Try a different search term or category.
            </Typography>
          </Box>
        ) : (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {filteredExercises.map((exercise) => (
              <ListItem
                key={exercise.id}
                disablePadding
                secondaryAction={
                  exercise.youtubeUrl ? (
                    <IconButton
                      edge="end"
                      aria-label="watch video"
                      onClick={(e) => handleVideoClick(exercise, e)}
                      size="small"
                      color="primary"
                    >
                      <PlayCircleOutlineIcon />
                    </IconButton>
                  ) : null
                }
              >
                <ListItemButton onClick={() => handleSelect(exercise)}>
                  <ListItemText
                    primary={exercise.name}
                    secondary={
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, alignItems: 'center' }}>
                        <Chip label={exercise.category} size="small" />
                        <Chip label={exercise.intensity} size="small" color="secondary" />
                        {exercise.youtubeUrl && (
                          <Chip
                            icon={<PlayCircleOutlineIcon sx={{ fontSize: '0.9rem' }} />}
                            label="Video"
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};
