import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  List,
  ListItem,
  IconButton,
  Divider,
  Alert,
} from '@mui/material';import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useI18n } from '../../i18n/I18nProvider';
import { ExerciseSelector } from '../workout/ExerciseSelector';
import type { UserPlanTemplate, PlanExercise } from '../../types/userPlan';
import type { Exercise } from '../../types/exercise';

interface PlanBuilderDialogProps {
  open: boolean;
  editingPlan?: UserPlanTemplate | null;
  onClose: () => void;
  onSave: (planName: string, exercises: PlanExercise[], warmupMinutes?: number) => void;
}

export const PlanBuilderDialog: React.FC<PlanBuilderDialogProps> = ({
  open,
  editingPlan,
  onClose,
  onSave,
}) => {
  const { t } = useI18n();
  const [planName, setPlanName] = useState('');
  const [exercises, setExercises] = useState<PlanExercise[]>([]);
  const [warmupMinutes, setWarmupMinutes] = useState<number | undefined>(undefined);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null);

  useEffect(() => {
    if (editingPlan) {
      setPlanName(editingPlan.name);
      setExercises(editingPlan.exercises);
      setWarmupMinutes(editingPlan.warmupMinutes);
    } else {
      setPlanName('');
      setExercises([]);
      setWarmupMinutes(undefined);
    }
  }, [editingPlan, open]);

  const handleAddExercise = (exercise: Exercise) => {
    const newExercise: PlanExercise = {
      id: crypto.randomUUID(),
      exerciseId: exercise.id,
      name: exercise.name,
      category: exercise.category,
      youtubeUrl: exercise.youtubeUrl,
      targetSets: undefined,
      targetReps: undefined,
      targetDurationSec: undefined,
      notes: '',
      order: exercises.length,
    };

    if (editingExerciseIndex !== null) {
      // Replace existing exercise
      const updated = [...exercises];
      updated[editingExerciseIndex] = { ...newExercise, order: editingExerciseIndex };
      setExercises(updated);
      setEditingExerciseIndex(null);
    } else {
      // Add new exercise
      setExercises([...exercises, newExercise]);
    }

    setShowExerciseSelector(false);
  };

  const handleUpdateExercise = (index: number, updates: Partial<PlanExercise>) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], ...updates };
    setExercises(updated);
  };

  const handleRemoveExercise = (index: number) => {
    const updated = exercises.filter((_, i) => i !== index);
    // Re-order remaining exercises
    updated.forEach((ex, i) => {
      ex.order = i;
    });
    setExercises(updated);
  };

  const handleSave = () => {
    if (!planName.trim()) {
      alert('Please enter a plan name');
      return;
    }
    if (exercises.length === 0 && !warmupMinutes) {
      alert('Please add at least one exercise or specify warm-up time');
      return;
    }
    onSave(planName, exercises, warmupMinutes);
    handleClose();
  };

  const handleClose = () => {
    setPlanName('');
    setExercises([]);
    setWarmupMinutes(undefined);
    setEditingExerciseIndex(null);
    onClose();
  };

  return (
    <>
      <Dialog open={open && !showExerciseSelector} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPlan ? 'Edit Plan' : 'Create New Plan'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {/* Plan Name */}
            <TextField
              label="Plan Name"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              fullWidth
              required
              placeholder="e.g., Upper Body, Leg Day, Full Body"
              autoFocus
            />

            {/* Free Warm-up */}
            <TextField
              label="Free Warm-up (minutes)"
              type="number"
              value={warmupMinutes ?? ''}
              onChange={(e) => setWarmupMinutes(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Optional: e.g., 10 minutes"
              helperText="For players who improvise their warm-up without specific exercises"
              inputProps={{ min: 0, max: 60, step: 1 }}
            />

            {/* Exercises List */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Exercises
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setEditingExerciseIndex(null);
                    setShowExerciseSelector(true);
                  }}
                  size="small"
                >
                  Add Exercise
                </Button>
              </Box>

              {exercises.length === 0 ? (
                <Alert severity="info">No exercises added yet. Click "Add Exercise" to start building your plan.</Alert>
              ) : (
                <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                  {exercises.map((exercise, index) => (
                    <React.Fragment key={exercise.id}>
                      {index > 0 && <Divider />}
                      <ListItem
                        sx={{ flexDirection: 'column', alignItems: 'stretch', py: 2 }}
                      >
                        {/* Exercise Header */}
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                          <DragIndicatorIcon sx={{ mr: 1, color: 'text.disabled' }} />
                          <Typography variant="body1" fontWeight={600} sx={{ flex: 1 }}>
                            {exercise.name}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveExercise(index)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>

                        {/* Exercise Notes */}
                        <Box sx={{ pl: 4, width: '100%', mt: 1 }}>
                          <TextField
                            label="Notes (optional)"
                            value={exercise.notes || ''}
                            onChange={(e) => handleUpdateExercise(index, { notes: e.target.value })}
                            size="small"
                            fullWidth
                            placeholder="e.g., Focus on form, pause at top"
                          />
                        </Box>
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{t('common.cancel')}</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!planName.trim() || exercises.length === 0}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Exercise Selector Dialog */}
      {showExerciseSelector && (
        <ExerciseSelector
          open={showExerciseSelector}
          onClose={() => {
            setShowExerciseSelector(false);
            setEditingExerciseIndex(null);
          }}
          onSelect={handleAddExercise}
        />
      )}
    </>
  );
};
