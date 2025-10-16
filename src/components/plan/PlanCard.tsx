import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Chip,
  Button,
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
    <Card sx={{ width: '100%' }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {/* Header */}
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="h6" sx={{ mb: 0.5, fontSize: '1.1rem' }}>
            {plan.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <Chip
              icon={<FitnessCenterIcon sx={{ fontSize: '0.9rem' }} />}
              label={`${plan.exercises.length} ${plan.exercises.length === 1 ? 'exercise' : 'exercises'}`}
              size="small"
              variant="outlined"
              sx={{ height: 24, fontSize: '0.75rem' }}
            />
            {plan.timesCompleted > 0 && (
              <Chip
                label={`${plan.timesCompleted}x`}
                size="small"
                color="success"
                variant="outlined"
                sx={{ height: 24, fontSize: '0.75rem' }}
              />
            )}
          </Box>
        </Box>

        {/* Exercise Preview - Compact */}
        <Box sx={{ mb: 1.5 }}>
          {plan.exercises.slice(0, 2).map((exercise) => (
            <Typography key={exercise.id} variant="body2" color="text.secondary" sx={{ mb: 0.3, fontSize: '0.85rem' }}>
              • {exercise.name}
              {exercise.targetSets && exercise.targetReps && (
                <Typography component="span" variant="caption" sx={{ ml: 0.5, color: 'text.disabled' }}>
                  {exercise.targetSets}×{exercise.targetReps}
                  {exercise.targetKg && ` @ ${exercise.targetKg}kg`}
                </Typography>
              )}
            </Typography>
          ))}
          {plan.exercises.length > 2 && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              +{plan.exercises.length - 2} more
            </Typography>
          )}
        </Box>

        {/* Last Used - Compact */}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontSize: '0.75rem' }}>
          Last: {formatLastUsed(plan.lastUsed)}
        </Typography>

        {/* Action Buttons - Mobile Optimized */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {/* Start Button - Primary, Full Width */}
          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={() => onStart(plan)}
            fullWidth
            sx={{
              py: 1,
              fontWeight: 600,
            }}
          >
            Start
          </Button>

          {/* Compact Action Icons */}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={() => onEdit(plan)}
              sx={{
                border: 1,
                borderColor: 'divider',
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <EditIcon sx={{ fontSize: '1.1rem' }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onDuplicate(plan.id)}
              sx={{
                border: 1,
                borderColor: 'divider',
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <ContentCopyIcon sx={{ fontSize: '1.1rem' }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onDelete(plan.id)}
              color="error"
              sx={{
                border: 1,
                borderColor: 'divider',
                '&:hover': { bgcolor: 'error.lighter' }
              }}
            >
              <DeleteIcon sx={{ fontSize: '1.1rem' }} />
            </IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
