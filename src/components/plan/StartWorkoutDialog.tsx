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
  Alert,
  Divider,
  Chip,
  LinearProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
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
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedEntries, setCompletedEntries] = useState<WorkoutEntry[]>([]);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (open && plan) {
      setCurrentExerciseIndex(0);
      setCompletedEntries([]);
      setWorkoutNotes('');
      setStartTime(Date.now());
      setShowForm(false);
    }
  }, [open, plan]);

  if (!plan) return null;

  const currentExercise = plan.exercises[currentExerciseIndex];
  const totalExercises = plan.exercises.length;
  const progress = (completedEntries.length / totalExercises) * 100;

  const handleSaveExercise = (entry: WorkoutEntry) => {
    setCompletedEntries([...completedEntries, entry]);
    setShowForm(false);

    // Move to next exercise or finish
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  };

  const handleFinishWorkout = () => {
    const duration = Math.round((Date.now() - startTime) / 1000 / 60); // minutes
    onFinish(completedEntries, workoutNotes, duration);
    onClose();
  };

  const handleSkipExercise = () => {
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  };

  // Convert PlanExercise to Exercise format for WorkoutForm
  const exerciseForForm = currentExercise ? {
    id: currentExercise.exerciseId || currentExercise.id,
    name: currentExercise.name,
    category: currentExercise.category,
    youtubeUrl: currentExercise.youtubeUrl,
    isGlobal: false,
  } : undefined;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {plan.name}
        <Typography variant="caption" display="block" color="text.secondary">
          Exercise {currentExerciseIndex + 1} of {totalExercises}
        </Typography>
      </DialogTitle>

      <DialogContent>
        {/* Progress Bar */}
        <Box sx={{ mb: 3 }}>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 1 }} />
          <Typography variant="caption" color="text.secondary">
            {completedEntries.length} / {totalExercises} completed
          </Typography>
        </Box>

        {/* Completed Exercises Summary */}
        {completedEntries.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Completed:
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {completedEntries.map((entry, idx) => (
                <Chip
                  key={idx}
                  label={entry.name}
                  size="small"
                  icon={<CheckCircleIcon />}
                  color="success"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Current Exercise */}
        {completedEntries.length < totalExercises ? (
          <>
            {!showForm ? (
              <Box>
                <Typography variant="h6" gutterBottom>
                  {currentExercise.name}
                </Typography>

                {/* Target Info */}
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Target:</strong> {currentExercise.targetSets} sets
                    {currentExercise.targetReps && ` × ${currentExercise.targetReps} reps`}
                    {currentExercise.targetKg && ` @ ${currentExercise.targetKg}kg`}
                    {currentExercise.targetDurationMin && ` for ${currentExercise.targetDurationMin} min`}
                  </Typography>
                  {currentExercise.notes && (
                    <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                      Note: {currentExercise.notes}
                    </Typography>
                  )}
                </Alert>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => setShowForm(true)}
                  >
                    Log Exercise
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleSkipExercise}
                    disabled={currentExerciseIndex === totalExercises - 1}
                  >
                    Skip
                  </Button>
                </Box>
              </Box>
            ) : (
              <WorkoutForm
                exercise={exerciseForForm}
                onSave={handleSaveExercise}
                onCancel={() => setShowForm(false)}
              />
            )}
          </>
        ) : (
          <>
            <Alert severity="success" sx={{ mb: 2 }}>
              All exercises completed! Add notes and finish your workout.
            </Alert>

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
