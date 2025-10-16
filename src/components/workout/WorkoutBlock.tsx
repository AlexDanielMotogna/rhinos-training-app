import React from 'react';
import { Box, Typography, Paper, IconButton, Tooltip, Button } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import type { TemplateBlock } from '../../types/template';
import type { Exercise } from '../../types/exercise';
import { ExerciseRow } from './ExerciseRow';
import { useI18n } from '../../i18n/I18nProvider';
import { getBlockInfo } from '../../services/blockInfo';

interface WorkoutBlockProps {
  block: TemplateBlock;
  onVideoClick?: (youtubeUrl: string) => void;
  onLogWorkout?: (exercise: Exercise) => void;
  onStartBlock?: (block: TemplateBlock) => void;
  showLogButtons?: boolean;
  trainingType?: 'strength_conditioning' | 'sprints_speed';
}

export const WorkoutBlock: React.FC<WorkoutBlockProps> = ({
  block,
  onVideoClick,
  onLogWorkout,
  onStartBlock,
  showLogButtons = false,
  trainingType = 'strength_conditioning'
}) => {
  const { t, locale } = useI18n();

  // Check if there's progress for this block
  const hasBlockProgress = () => {
    const persistenceKey = `coach_workout_progress_${trainingType}_${block.title}`;
    const stored = localStorage.getItem(persistenceKey);
    if (!stored) return false;

    try {
      const data = JSON.parse(stored);
      return data.completedEntries && data.completedEntries.length > 0;
    } catch {
      return false;
    }
  };

  // Get custom block info from coach configuration
  const blockInfo = getBlockInfo(block.title, trainingType);

  // Fallback to default i18n messages if no custom info
  const getDefaultInfoMessage = () => {
    const title = block.title.toLowerCase();
    if (title.includes('compound') || title.includes('lift')) {
      return t('training.compoundLiftsInfo');
    } else if (title.includes('accessory') || title.includes('work')) {
      return t('training.accessoryWorkInfo');
    }
    return '';
  };

  // Use locale-specific text from blockInfo, or fallback to i18n
  const infoMessage = blockInfo
    ? (locale === 'de' ? blockInfo.infoText_de : blockInfo.infoText_en)
    : getDefaultInfoMessage();

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Typography variant="h6" sx={{ color: 'primary.main', flex: 1 }}>
          {block.title}
        </Typography>
        {infoMessage && (
          <Tooltip
            title={
              <Typography variant="body2" sx={{ p: 0.5 }}>
                {infoMessage}
              </Typography>
            }
            arrow
            placement="top"
          >
            <IconButton size="small" color="primary">
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {onStartBlock && (
          <Button
            variant="contained"
            size="small"
            startIcon={<PlayArrowIcon />}
            onClick={() => onStartBlock(block)}
            sx={{ whiteSpace: 'nowrap' }}
          >
            {hasBlockProgress() ? t('workout.continue') : t('workout.start')}
          </Button>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {block.items.map((exercise) => {
          // Get target sets for this exercise
          const exerciseConfig = block.exerciseConfigs?.find(c => c.exerciseId === exercise.id);
          const targetSets = exerciseConfig?.sets || block.globalSets;

          return (
            <ExerciseRow
              key={exercise.id}
              exercise={exercise}
              showLogButton={showLogButtons}
              targetSets={targetSets}
              onLogWorkout={onLogWorkout ? () => onLogWorkout(exercise) : undefined}
              onVideoClick={
                exercise.youtubeUrl && onVideoClick
                  ? () => onVideoClick(exercise.youtubeUrl!)
                  : undefined
              }
            />
          );
        })}
      </Box>
    </Paper>
  );
};
