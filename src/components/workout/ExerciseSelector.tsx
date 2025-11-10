import React, { useState, useEffect } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
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
import { exerciseService } from '../../services/api';
import { db } from '../../services/db';
import { isOnline } from '../../services/sync';
import type { Exercise, ExerciseCategory, MuscleGroup } from '../../types/exercise';
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
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | 'All'>('All');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | 'All'>('All');
  const [exercises, setExercises] = useState<Exercise[]>([]);
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

  const muscleGroups: Array<MuscleGroup | 'All'> = [
    'All',
    'legs',
    'chest',
    'back',
    'shoulders',
    'arms',
    'core',
    'full-body',
  ];

  // Load exercises from backend when dialog opens
  useEffect(() => {
    const loadExercises = async () => {
      console.log('🔍 ExerciseSelector - open:', open, 'current exercises:', exercises.length);

      if (!open) return;

      const online = isOnline();
      console.log('🌐 Online status:', online);

      try {
        if (online) {
          // Always fetch from backend when online
          console.log('🔄 Fetching exercises from backend...');
          const backendExercises = await exerciseService.getAll() as Exercise[];
          console.log('📥 Received from backend:', backendExercises.length, 'exercises');
          console.log('📥 Backend exercises:', backendExercises.map(e => e.name));

          // Cache in IndexedDB
          await db.exercises.clear();
          await db.exercises.bulkPut(backendExercises);

          setExercises(backendExercises);
          console.log(`✅ Loaded ${backendExercises.length} exercises from backend`);
        } else {
          // Load from IndexedDB cache when offline
          console.log('📦 Loading from cache...');
          const cachedExercises = await db.exercises.toArray();

          if (cachedExercises.length > 0) {
            setExercises(cachedExercises as Exercise[]);
            console.log(`📦 Loaded ${cachedExercises.length} exercises from cache`);
          } else {
            // Fallback to hardcoded catalog only if offline AND no cache
            console.warn('⚠️ Offline with no cache - using fallback catalog');
            setExercises(globalCatalog);
            console.log(`⚠️ Using fallback catalog (${globalCatalog.length} exercises)`);
          }
        }
      } catch (error) {
        console.error('❌ Failed to load exercises:', error);
        // Try to use cache even if backend fails
        const cachedExercises = await db.exercises.toArray();
        if (cachedExercises.length > 0) {
          console.log('📦 Falling back to cached exercises');
          setExercises(cachedExercises as Exercise[]);
        } else {
          // Last resort: hardcoded catalog
          console.warn('⚠️ Using fallback catalog due to error (${globalCatalog.length} exercises)');
          setExercises(globalCatalog);
        }
      }
    };

    loadExercises();
  }, [open]);

  // Filter exercises
  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || exercise.category === selectedCategory;
    const matchesMuscleGroup = selectedMuscleGroup === 'All' ||
      (exercise.muscleGroups && exercise.muscleGroups.includes(selectedMuscleGroup));
    return matchesSearch && matchesCategory && matchesMuscleGroup;
  });

  const handleSelect = (exercise: Exercise) => {
    onSelect(exercise);
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedMuscleGroup('All');
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

        {/* Muscle Group Tabs */}
        <Tabs
          value={selectedMuscleGroup}
          onChange={(_, value) => setSelectedMuscleGroup(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          {muscleGroups.map(group => (
            <Tab
              key={group}
              label={group === 'All' ? t('muscleGroup.all') : t(`muscleGroup.${group}` as any)}
              value={group}
            />
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
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Chip label={exercise.category} size="small" />
                        {exercise.muscleGroups && exercise.muscleGroups.map((group) => (
                          <Chip
                            key={group}
                            label={t(`muscleGroup.${group}` as any)}
                            size="small"
                            variant="outlined"
                            color="secondary"
                          />
                        ))}
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
