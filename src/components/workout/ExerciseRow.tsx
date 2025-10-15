import React from 'react';
import { Box, Typography, Chip, IconButton, Button } from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import type { Exercise } from '../../types/exercise';
import { useI18n } from '../../i18n/I18nProvider';

interface ExerciseRowProps {
  exercise: Exercise;
  onVideoClick?: () => void;
  onLogWorkout?: () => void;
  showLogButton?: boolean;
}

export const ExerciseRow: React.FC<ExerciseRowProps> = ({
  exercise,
  onVideoClick,
  onLogWorkout,
  showLogButton = false
}) => {
  const { t } = useI18n();

  const intensityColors = {
    low: 'success',
    mod: 'warning',
    high: 'error',
  } as const;

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
          {exercise.intensity && (
            <Chip
              label={exercise.intensity.toUpperCase()}
              size="small"
              color={intensityColors[exercise.intensity]}
              sx={{ height: 24 }}
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

        {exercise.youtubeUrl && onVideoClick && (
          <IconButton
            onClick={onVideoClick}
            color="secondary"
            aria-label="Watch video"
          >
            <PlayCircleOutlineIcon />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};
