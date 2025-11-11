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
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import AddIcon from '@mui/icons-material/Add';
import { globalCatalog } from '../../services/catalog';
import { exerciseService } from '../../services/api';
import { db } from '../../services/db';
import { isOnline } from '../../services/sync';
import type { Exercise, ExerciseCategory, MuscleGroup } from '../../types/exercise';
import { sanitizeYouTubeUrl } from '../../services/yt';
import { ExerciseFormDialog } from '../exercise/ExerciseFormDialog';

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
  const [showAddExerciseDialog, setShowAddExerciseDialog] = useState(false);

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

  // Force refresh exercises from backend
  const forceRefresh = async () => {
    console.log('🔄 Force refreshing exercises from backend...');
    try {
      const backendExercises = await exerciseService.getAll() as Exercise[];
      console.log('📥 Received from backend:', backendExercises.length, 'exercises');

      // Clear and update IndexedDB cache
      await db.exercises.clear();
      await db.exercises.bulkPut(backendExercises);

      setExercises(backendExercises);
      console.log(`✅ Loaded ${backendExercises.length} exercises from backend`);
    } catch (error) {
      console.error('❌ Failed to refresh exercises:', error);
    }
  };

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
          console.log('📥 Sample exercise with muscle groups:', backendExercises[0]);
          console.log('📥 Exercises with legs:', backendExercises.filter(e => e.muscleGroups?.includes('legs')).length);

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

  // Filter exercises with debug logging
  console.log('🔍 Filter State:', {
    totalExercises: exercises.length,
    selectedCategory,
    selectedMuscleGroup,
    searchTerm,
    sampleExercise: exercises[0],
  });

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || exercise.category === selectedCategory;
    const matchesMuscleGroup = selectedMuscleGroup === 'All' ||
      (exercise.muscleGroups && exercise.muscleGroups.includes(selectedMuscleGroup));

    return matchesSearch && matchesCategory && matchesMuscleGroup;
  });

  console.log('✅ Filtered Result:', {
    filteredCount: filteredExercises.length,
    selectedMuscleGroup,
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

  const handleExerciseAdded = async () => {
    // Reload exercises after adding a new one
    setShowAddExerciseDialog(false);
    await forceRefresh();
  };

  const getEmbedUrl = (url: string | undefined): string | null => {
    if (!url) return null;
    const sanitized = sanitizeYouTubeUrl(url);
    if (!sanitized) return null;

    const videoId = sanitized.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Select Exercise
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setShowAddExerciseDialog(true)}
            size="small"
          >
            Add New
          </Button>
        </DialogTitle>
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
            {filteredExercises.map((exercise) => {
              // Extract YouTube video ID for thumbnail
              const getYouTubeVideoId = (url: string) => {
                if (!url) return null;
                const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?]+)/);
                return match ? match[1] : null;
              };

              const videoId = getYouTubeVideoId(exercise.youtubeUrl || '');
              const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;

              return (
                <ListItem
                  key={exercise.id}
                  disablePadding
                  sx={{
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 'none' }
                  }}
                >
                  <ListItemButton
                    onClick={() => handleSelect(exercise)}
                    sx={{
                      py: 1.5,
                      display: 'flex',
                      gap: 2,
                      alignItems: 'flex-start'
                    }}
                  >
                    {/* Thumbnail */}
                    {thumbnailUrl && (
                      <Box
                        component="img"
                        src={thumbnailUrl}
                        alt={exercise.name}
                        sx={{
                          width: 80,
                          height: 45,
                          objectFit: 'cover',
                          borderRadius: 1,
                          flexShrink: 0,
                          cursor: 'pointer',
                          border: '1px solid',
                          borderColor: 'divider',
                          '&:hover': {
                            opacity: 0.8,
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVideoClick(exercise, e);
                        }}
                        onError={(e) => {
                          // Hide thumbnail if it fails to load
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}

                    {/* Exercise Info */}
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
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>
    </Dialog>

    {/* Add Exercise Dialog */}
    <ExerciseFormDialog
      open={showAddExerciseDialog}
      onClose={() => setShowAddExerciseDialog(false)}
      onSuccess={handleExerciseAdded}
    />
  </>
  );
};
