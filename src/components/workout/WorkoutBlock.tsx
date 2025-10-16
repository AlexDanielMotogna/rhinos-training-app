import React from 'react';
import { Box, Typography, Paper, IconButton, Tooltip, Button, CircularProgress } from '@mui/material';
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

  // Get active session progress from temporary storage
  const getActiveSessionProgress = (): { hasProgress: boolean; completionPercentage: number | null } => {
    const persistenceKey = `coach_workout_progress_${trainingType}_${block.title}`;
    const stored = localStorage.getItem(persistenceKey);

    if (!stored) return { hasProgress: false, completionPercentage: null };

    try {
      const data = JSON.parse(stored);
      const completedEntries = data.completedEntries || [];

      if (completedEntries.length === 0) {
        return { hasProgress: false, completionPercentage: null };
      }

      // Calculate completion percentage from active session
      let totalTargetSets = 0;
      let completedSets = 0;

      // Calculate total target sets for ALL exercises in the block
      block.items.forEach((exercise) => {
        const exerciseConfig = block.exerciseConfigs?.find(c => c.exerciseId === exercise.id);
        const targetSets = exerciseConfig?.sets || block.globalSets || 0;
        totalTargetSets += targetSets;
      });

      // Count completed sets from the active session
      completedEntries.forEach((entry: any) => {
        completedSets += entry.setData?.length || 0;
      });

      const percentage = totalTargetSets > 0
        ? Math.round((completedSets / totalTargetSets) * 100)
        : null;

      return {
        hasProgress: true,
        completionPercentage: percentage
      };
    } catch {
      return { hasProgress: false, completionPercentage: null };
    }
  };

  const { hasProgress, completionPercentage } = getActiveSessionProgress();

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

        {/* Completion Chart - Only show if there's a last workout */}
        {completionPercentage !== null && (
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
              variant="determinate"
              value={completionPercentage}
              size={50}
              thickness={5}
              sx={{
                color: completionPercentage >= 70 ? 'success.main' : completionPercentage >= 40 ? 'warning.main' : 'error.main',
              }}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="caption" component="div" color="text.secondary" fontWeight={600}>
                {completionPercentage}%
              </Typography>
            </Box>
          </Box>
        )}

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
            {hasProgress ? t('workout.continue') : t('workout.start')}
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
