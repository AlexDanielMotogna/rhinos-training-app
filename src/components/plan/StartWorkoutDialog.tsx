import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { useI18n } from '../../i18n/I18nProvider';
import { WorkoutForm } from '../workout/WorkoutForm';
import type { UserPlanTemplate } from '../../types/userPlan';
import type { WorkoutEntry } from '../../types/workout';

interface StartWorkoutDialogProps {
  open: boolean;
  plan: UserPlanTemplate | null;
  onClose: () => void;
  onFinish: (entries: WorkoutEntry[], notes: string, duration: number) => void;
}

export const StartWorkoutDialog: React.FC<StartWorkoutDialogProps> = ({
  open,
  plan,
  onClose,
  onFinish,
}) => {
  const { t } = useI18n();
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<number | null>(null);
  const [completedEntries, setCompletedEntries] = useState<WorkoutEntry[]>([]);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [startTime, setStartTime] = useState<number>(Date.now());

  // Persistence key for this workout session
  const persistenceKey = plan ? `workout_progress_${plan.id}` : null;

  // Load persisted data on open
  useEffect(() => {
    if (open && plan && persistenceKey) {
      const stored = localStorage.getItem(persistenceKey);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          setCompletedEntries(data.completedEntries || []);
          setWorkoutNotes(data.workoutNotes || '');
          setStartTime(data.startTime || Date.now());
          setSelectedExerciseIndex(null);
        } catch (e) {
          // If parsing fails, start fresh
          resetWorkout();
        }
      } else {
        resetWorkout();
      }
    }
  }, [open, plan]);

  // Persist data whenever it changes
  useEffect(() => {
    if (open && plan && persistenceKey) {
      const data = {
        completedEntries,
        workoutNotes,
        startTime,
      };
      localStorage.setItem(persistenceKey, JSON.stringify(data));
    }
  }, [completedEntries, workoutNotes, open, plan, persistenceKey]);

  const resetWorkout = () => {
    setSelectedExerciseIndex(null);
    setCompletedEntries([]);
    setWorkoutNotes('');
    setStartTime(Date.now());
  };

  if (!plan) return null;

  const totalExercises = plan.exercises.length;
  const progress = (completedEntries.length / totalExercises) * 100;
  const selectedExercise = selectedExerciseIndex !== null ? plan.exercises[selectedExerciseIndex] : null;

  const handleSaveExercise = (entry: WorkoutEntry) => {
    setCompletedEntries([...completedEntries, entry]);
    setSelectedExerciseIndex(null); // Close form after saving
  };

  const handleFinishWorkout = () => {
    const duration = Math.round((Date.now() - startTime) / 1000 / 60); // minutes
    onFinish(completedEntries, workoutNotes, duration);

    // Clear persisted data after finishing
    if (persistenceKey) {
      localStorage.removeItem(persistenceKey);
    }
    onClose();
  };

  const handleSelectExercise = (index: number) => {
    setSelectedExerciseIndex(index);
  };

  const isExerciseCompleted = (index: number): boolean => {
    return completedEntries.some(entry =>
      entry.name === plan.exercises[index].name
    );
  };

  // Convert PlanExercise to Exercise format for WorkoutForm
  const exerciseForForm = selectedExercise ? {
    id: selectedExercise.exerciseId || selectedExercise.id,
    name: selectedExercise.name,
    category: selectedExercise.category,
    youtubeUrl: selectedExercise.youtubeUrl,
    isGlobal: false,
  } : undefined;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {plan.name}
        <Typography variant="caption" display="block" color="text.secondary">
          {completedEntries.length} / {totalExercises} exercises completed
        </Typography>
      </DialogTitle>

      <DialogContent>
        {/* Progress Bar */}
        <Box sx={{ mb: 3 }}>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 1 }} />
        </Box>

        {/* Show form if exercise selected, otherwise show list */}
        {selectedExerciseIndex === null ? (
          <>
            {/* Exercise List - Always Visible */}
            <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
              Select an exercise to log:
            </Typography>
            <List>
              {plan.exercises.map((exercise, index) => (
                <ListItem
                  key={index}
                  disablePadding
                  sx={{ mb: 1 }}
                >
                  <ListItemButton
                    onClick={() => handleSelectExercise(index)}
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      '&:hover': {
                        borderColor: 'primary.main',
                      },
                    }}
                  >
                    <ListItemIcon>
                      {isExerciseCompleted(index) ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <RadioButtonUncheckedIcon color="action" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={exercise.name}
                      secondary={
                        <>
                          {exercise.targetSets} sets × {exercise.targetReps || '-'} reps
                          {exercise.targetDurationMin && ` • ${exercise.targetDurationMin} min`}
                        </>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>

            <Divider sx={{ my: 3 }} />

            {/* Workout Notes */}
            <TextField
              label="Workout Notes (optional)"
              value={workoutNotes}
              onChange={(e) => setWorkoutNotes(e.target.value)}
              multiline
              rows={3}
              fullWidth
              placeholder="How did the workout feel? Any observations?"
            />
          </>
        ) : (
          <WorkoutForm
            exercise={exerciseForForm}
            onSave={handleSaveExercise}
            onCancel={() => setSelectedExerciseIndex(null)}
          />
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        {completedEntries.length === totalExercises && (
          <Button
            onClick={handleFinishWorkout}
            variant="contained"
            color="success"
          >
            Finish Workout
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
