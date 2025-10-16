import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Chip,
  Tooltip,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { useI18n } from '../../i18n/I18nProvider';
import type { UserPlanTemplate } from '../../types/userPlan';

interface PlanCardProps {
  plan: UserPlanTemplate;
  onStart: (plan: UserPlanTemplate) => void;
  onEdit: (plan: UserPlanTemplate) => void;
  onDelete: (planId: string) => void;
  onDuplicate: (planId: string) => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  onStart,
  onEdit,
  onDelete,
  onDuplicate,
}) => {
  const { } = useI18n();

  const formatLastUsed = (dateStr?: string) => {
    if (!dateStr) return 'Never used';

    const date = new Date(dateStr);
    const today = new Date();
    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              {plan.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <Chip
                icon={<FitnessCenterIcon />}
                label={`${plan.exercises.length} ${plan.exercises.length === 1 ? 'exercise' : 'exercises'}`}
                size="small"
                variant="outlined"
              />
              {plan.timesCompleted > 0 && (
                <Chip
                  label={`Completed ${plan.timesCompleted}x`}
                  size="small"
                  color="success"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        </Box>

        {/* Exercise Preview */}
        <Box sx={{ mb: 2 }}>
          {plan.exercises.slice(0, 3).map((exercise) => (
            <Typography key={exercise.id} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              • {exercise.name}
              {exercise.targetSets && exercise.targetReps && (
                <span style={{ marginLeft: '8px', color: '#999' }}>
                  {exercise.targetSets}×{exercise.targetReps}
                  {exercise.targetKg && ` @ ${exercise.targetKg}kg`}
                </span>
              )}
            </Typography>
          ))}
          {plan.exercises.length > 3 && (
            <Typography variant="caption" color="text.secondary">
              +{plan.exercises.length - 3} more...
            </Typography>
          )}
        </Box>

        {/* Last Used */}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Last: {formatLastUsed(plan.lastUsed)}
        </Typography>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
          <Tooltip title="Start Workout">
            <IconButton
              color="primary"
              onClick={() => onStart(plan)}
              sx={{ bgcolor: 'primary.light', '&:hover': { bgcolor: 'primary.main' } }}
            >
              <PlayArrowIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Plan">
            <IconButton
              size="small"
              onClick={() => onEdit(plan)}
              color="default"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Duplicate Plan">
            <IconButton
              size="small"
              onClick={() => onDuplicate(plan.id)}
              color="default"
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Plan">
            <IconButton
              size="small"
              onClick={() => onDelete(plan.id)}
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
};
