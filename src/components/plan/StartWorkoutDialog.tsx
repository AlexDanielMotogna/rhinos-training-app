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
    const exerciseName = selectedExercise?.name;
    if (!exerciseName) return;

    // Find existing entry for this exercise
    const existingIndex = completedEntries.findIndex(e => e.name === exerciseName);

    if (existingIndex >= 0) {
      // Merge sets with existing entry
      const existing = completedEntries[existingIndex];

      // Renumber new sets to continue from where we left off
      const lastSetNumber = Math.max(...(existing.setData?.map(s => s.setNumber) || [0]));
      const renumberedNewSets = entry.setData?.map((set, idx) => ({
        ...set,
        setNumber: lastSetNumber + idx + 1
      })) || [];

      const mergedEntry: WorkoutEntry = {
        ...existing,
        setData: [...(existing.setData || []), ...renumberedNewSets],
        sets: existing.sets || entry.sets, // Keep the target sets (not sum)
        notes: entry.notes || existing.notes, // Use new notes if provided
        rpe: entry.rpe, // Always use the latest RPE
      };

      // Update the existing entry
      const newEntries = [...completedEntries];
      newEntries[existingIndex] = mergedEntry;
      setCompletedEntries(newEntries);
    } else {
      // First time logging this exercise
      setCompletedEntries([...completedEntries, entry]);
    }

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

  // Get the logged entry for a specific exercise (if any)
  const getExerciseEntry = (index: number): WorkoutEntry | undefined => {
    if (!plan || !plan.exercises[index]) return undefined;
    const exerciseName = plan.exercises[index].name;
    return completedEntries.find(entry => entry.name === exerciseName);
  };

  // Get how many sets have been logged for an exercise
  const getCompletedSetsCount = (index: number): number => {
    const entry = getExerciseEntry(index);
    return entry?.setData?.length || 0;
  };

  // Convert PlanExercise to Exercise format for WorkoutForm
  const exerciseForForm = selectedExercise ? {
    id: selectedExercise.exerciseId || selectedExercise.id,
    name: selectedExercise.name,
    category: selectedExercise.category,
    youtubeUrl: selectedExercise.youtubeUrl,
    isGlobal: false,
  } : undefined;

  // Get existing entry to pre-populate form with previous sets
  const existingEntryForForm = selectedExerciseIndex !== null
    ? getExerciseEntry(selectedExerciseIndex)
    : undefined;

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
              {plan.exercises.map((exercise, index) => {
                const completedSets = getCompletedSetsCount(index);
                const targetSets = exercise.targetSets;
                const isCompleted = completedSets >= targetSets;

                return (
                  <ListItem
                    key={index}
                    disablePadding
                    sx={{ mb: 1 }}
                  >
                    <ListItemButton
                      onClick={() => handleSelectExercise(index)}
                      sx={{
                        border: 1,
                        borderColor: isCompleted ? 'success.main' : 'divider',
                        borderRadius: 1,
                        bgcolor: isCompleted ? 'success.lighter' : 'transparent',
                        '&:hover': {
                          borderColor: 'primary.main',
                        },
                      }}
                    >
                      <ListItemIcon>
                        {isCompleted ? (
                          <CheckCircleIcon color="success" />
                        ) : completedSets > 0 ? (
                          <Typography
                            variant="caption"
                            sx={{
                              width: 24,
                              height: 24,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                              color: 'white',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                            }}
                          >
                            {completedSets}
                          </Typography>
                        ) : (
                          <RadioButtonUncheckedIcon color="action" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={exercise.name}
                        secondary={
                          <>
                            {completedSets > 0 && `${completedSets}/${targetSets} sets • `}
                            Target: {targetSets} × {exercise.targetReps || '-'} reps
                            {exercise.targetDurationSec && ` • ${exercise.targetDurationSec}s`}
                          </>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
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
            initialData={existingEntryForForm}
            targetSets={selectedExercise?.targetSets}
            onSave={handleSaveExercise}
            onCancel={() => setSelectedExerciseIndex(null)}
          />
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        {completedEntries.length > 0 && (
          <Button
            onClick={handleFinishWorkout}
            variant="contained"
            color="success"
          >
            {t('workout.finishWorkout')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
