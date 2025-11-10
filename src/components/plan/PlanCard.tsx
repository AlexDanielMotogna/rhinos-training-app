import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Chip,
  Button,
  Avatar,
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
  const { t } = useI18n();

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

  // Check if there's progress saved for this workout
  const hasProgress = () => {
    const persistenceKey = `workout_progress_${plan.id}`;
    const stored = localStorage.getItem(persistenceKey);
    if (!stored) return false;

    try {
      const data = JSON.parse(stored);
      return data.completedEntries && data.completedEntries.length > 0;
    } catch {
      return false;
    }
  };

  return (
    <Card sx={{ width: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* Header Background */}
      <Box
        sx={{
          height: 80,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          px: 2,
        }}
      >
        <Avatar
          sx={{
            width: 56,
            height: 56,
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            color: 'primary.main',
            mr: 2,
          }}
        >
          <FitnessCenterIcon />
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, fontSize: '1.1rem', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
            {plan.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
            <Chip
              icon={<FitnessCenterIcon sx={{ fontSize: '0.8rem' }} />}
              label={`${plan.exercises.length} ${plan.exercises.length === 1 ? 'exercise' : 'exercises'}`}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.7rem',
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                color: 'text.primary',
              }}
            />
            {plan.timesCompleted > 0 && (
              <Chip
                label={`${plan.timesCompleted}x completed`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  bgcolor: 'rgba(76, 175, 80, 0.9)',
                  color: 'white',
                }}
              />
            )}
          </Box>
        </Box>
      </Box>

      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>

        {/* Exercise Preview - Compact */}
        <Box sx={{ mb: 1.5 }}>
          {plan.exercises.slice(0, 2).map((exercise) => (
            <Typography key={exercise.id} variant="body2" color="text.secondary" sx={{ mb: 0.3, fontSize: '0.85rem' }}>
              • {exercise.name}
              {exercise.targetSets && exercise.targetReps && (
                <Typography component="span" variant="caption" sx={{ ml: 0.5, color: 'text.disabled' }}>
                  {exercise.targetSets}×{exercise.targetReps}
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

        {/* Action Buttons - Responsive Layout */}
        <Box sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          {/* Start/Continue Button - Compact on Desktop */}
          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={() => onStart(plan)}
            sx={{
              py: 1,
              fontWeight: 600,
              flex: { xs: 1, sm: '0 0 auto' },
              minWidth: { sm: '140px' },
            }}
          >
            {hasProgress() ? t('workout.continue') : t('workout.start')}
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
              title="Edit"
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
              title="Duplicate"
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
              title="Delete"
            >
              <DeleteIcon sx={{ fontSize: '1.1rem' }} />
            </IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
