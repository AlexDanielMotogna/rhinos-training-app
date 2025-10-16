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
  onSave: (planName: string, exercises: PlanExercise[]) => void;
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
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null);

  useEffect(() => {
    if (editingPlan) {
      setPlanName(editingPlan.name);
      setExercises(editingPlan.exercises);
    } else {
      setPlanName('');
      setExercises([]);
    }
  }, [editingPlan, open]);

  const handleAddExercise = (exercise: Exercise) => {
    const newExercise: PlanExercise = {
      id: crypto.randomUUID(),
      exerciseId: exercise.id,
      name: exercise.name,
      category: exercise.category,
      youtubeUrl: exercise.youtubeUrl,
      targetSets: 3,
      targetReps: 10,
      targetKg: undefined,
      targetDurationMin: undefined,
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
    if (exercises.length === 0) {
      alert('Please add at least one exercise');
      return;
    }
    onSave(planName, exercises);
    handleClose();
  };

  const handleClose = () => {
    setPlanName('');
    setExercises([]);
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

                        {/* Target Values */}
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', pl: 4 }}>
                          <TextField
                            label="Sets"
                            type="number"
                            value={exercise.targetSets}
                            onChange={(e) => handleUpdateExercise(index, { targetSets: Number(e.target.value) })}
                            size="small"
                            sx={{ width: 80 }}
                            inputProps={{ min: 1, max: 10 }}
                          />
                          {exercise.category !== 'Mobility' && exercise.category !== 'Conditioning' && (
                            <>
                              <TextField
                                label="Reps"
                                type="number"
                                value={exercise.targetReps || ''}
                                onChange={(e) => handleUpdateExercise(index, { targetReps: Number(e.target.value) || undefined })}
                                size="small"
                                sx={{ width: 80 }}
                                inputProps={{ min: 1, max: 100 }}
                              />
                              <TextField
                                label="Weight (kg)"
                                type="number"
                                value={exercise.targetKg || ''}
                                onChange={(e) => handleUpdateExercise(index, { targetKg: Number(e.target.value) || undefined })}
                                size="small"
                                sx={{ width: 100 }}
                                inputProps={{ min: 0, step: 2.5 }}
                              />
                            </>
                          )}
                          {(exercise.category === 'Conditioning' || exercise.category === 'Mobility') && (
                            <TextField
                              label="Duration (min)"
                              type="number"
                              value={exercise.targetDurationMin || ''}
                              onChange={(e) => handleUpdateExercise(index, { targetDurationMin: Number(e.target.value) || undefined })}
                              size="small"
                              sx={{ width: 120 }}
                              inputProps={{ min: 1, max: 120 }}
                            />
                          )}
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
