import React from 'react';
import { Box, Typography, Paper, IconButton, Tooltip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import type { TemplateBlock } from '../../types/template';
import type { Exercise } from '../../types/exercise';
import { ExerciseRow } from './ExerciseRow';
import { useI18n } from '../../i18n/I18nProvider';
import { getBlockInfo } from '../../services/blockInfo';

interface WorkoutBlockProps {
  block: TemplateBlock;
  onVideoClick?: (youtubeUrl: string) => void;
  onLogWorkout?: (exercise: Exercise) => void;
  showLogButtons?: boolean;
  trainingType?: 'strength_conditioning' | 'sprints_speed';
}

export const WorkoutBlock: React.FC<WorkoutBlockProps> = ({
  block,
  onVideoClick,
  onLogWorkout,
  showLogButtons = false,
  trainingType = 'strength_conditioning'
}) => {
  const { t } = useI18n();

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

  const infoMessage = blockInfo?.infoText || getDefaultInfoMessage();

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
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
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {block.items.map((exercise) => (
          <ExerciseRow
            key={exercise.id}
            exercise={exercise}
            showLogButton={showLogButtons}
            onLogWorkout={onLogWorkout ? () => onLogWorkout(exercise) : undefined}
            onVideoClick={
              exercise.youtubeUrl && onVideoClick
                ? () => onVideoClick(exercise.youtubeUrl!)
                : undefined
            }
          />
        ))}
      </Box>
    </Paper>
  );
};
