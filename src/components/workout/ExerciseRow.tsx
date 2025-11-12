import React from 'react';
import { Box, Typography, Chip, Button } from '@mui/material';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import type { Exercise } from '../../types/exercise';
import { useI18n } from '../../i18n/I18nProvider';

interface ExerciseRowProps {
  exercise: Exercise;
  onVideoClick?: () => void;
  onLogWorkout?: () => void;
  showLogButton?: boolean;
  targetSets?: number; // Target sets for this exercise
  targetReps?: number; // Target reps, duration, or distance
  unit?: 'reps' | 'seconds' | 'meters'; // Unit for targetReps
}

export const ExerciseRow: React.FC<ExerciseRowProps> = ({
  exercise,
  onVideoClick,
  onLogWorkout,
  showLogButton = false,
  targetSets,
  targetReps,
  unit = 'reps'
}) => {
  const { t } = useI18n();

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&?/]+)/);
    return match ? match[1] : null;
  };

  const videoId = exercise.youtubeUrl ? getYouTubeVideoId(exercise.youtubeUrl) : null;
  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        borderRadius: 1,
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        gap: 2,
        flexWrap: { xs: 'wrap', sm: 'nowrap' },
      }}
    >
      <Box sx={{ flex: 1, minWidth: { xs: '100%', sm: 'auto' } }}>
        <Typography variant="body1" fontWeight={500}>
          {exercise.name}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
          <Chip
            label={t(`category.${exercise.category}` as any)}
            size="small"
            sx={{ height: 24 }}
          />
          {targetSets && (
            <Chip
              label={`${targetSets} sets`}
              size="small"
              color="info"
              sx={{ height: 24, fontWeight: 600 }}
            />
          )}
          {targetReps && (
            <Chip
              label={
                unit === 'seconds' ? `${targetReps}s` :
                unit === 'meters' ? `${targetReps}m` :
                `${targetReps} reps`
              }
              size="small"
              color="success"
              sx={{ height: 24, fontWeight: 600 }}
            />
          )}
          {exercise.isGlobal && (
            <Chip
              label="Global"
              size="small"
              color="primary"
              variant="outlined"
              sx={{ height: 24 }}
            />
          )}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        {showLogButton && onLogWorkout && (
          <Button
            variant="contained"
            color="secondary"
            size="small"
            startIcon={<FitnessCenterIcon />}
            onClick={onLogWorkout}
            sx={{ whiteSpace: 'nowrap' }}
          >
            {t('workout.logWorkout')}
          </Button>
        )}

        {exercise.youtubeUrl && onVideoClick && thumbnailUrl && (
          <Box
            onClick={onVideoClick}
            sx={{
              position: 'relative',
              cursor: 'pointer',
              width: 120,
              height: 68,
              borderRadius: 1,
              overflow: 'hidden',
              flexShrink: 0,
              '&:hover': {
                opacity: 0.9,
              },
            }}
          >
            <img
              src={thumbnailUrl}
              alt={`${exercise.name} video`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'white',
                opacity: 0.9,
              }}
            >
              <PlayCircleFilledIcon sx={{ fontSize: 48 }} />
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};
