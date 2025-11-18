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
  Chip,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useI18n } from '../../i18n/I18nProvider';
import { WorkoutForm } from './WorkoutForm';
import type { TemplateBlock } from '../../types/template';
import type { WorkoutEntry } from '../../types/workout';

interface DayWorkoutDialogProps {
  open: boolean;
  blocks: TemplateBlock[];
  dayName: string;
  trainingTypeName: string;
  trainingType: 'strength_conditioning' | 'sprints_speed';
  onClose: () => void;
  onFinish: (entries: WorkoutEntry[], notes: string, duration: number, dayName: string) => void;
}

export const DayWorkoutDialog: React.FC<DayWorkoutDialogProps> = ({
  open,
  blocks,
  dayName,
  trainingTypeName,
  trainingType,
  onClose,
  onFinish,
}) => {
  const { t } = useI18n();
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<number | null>(null);
  const [allCompletedEntries, setAllCompletedEntries] = useState<WorkoutEntry[]>([]);
  const [warmupMinutes, setWarmupMinutes] = useState<number | undefined>(undefined);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [startTime, setStartTime] = useState<number>(Date.now());

  // Persistence key for this day workout session
  const persistenceKey = `day_workout_progress_${trainingType}_${dayName}`;

  // Load persisted data on open
  useEffect(() => {
    if (open && blocks.length > 0) {
      const stored = localStorage.getItem(persistenceKey);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          setAllCompletedEntries(data.allCompletedEntries || []);
          setCurrentBlockIndex(data.currentBlockIndex || 0);
          setWarmupMinutes(data.warmupMinutes);
          setWorkoutNotes(data.workoutNotes || '');
          setStartTime(data.startTime || Date.now());
          setSelectedExerciseIndex(null);
        } catch (e) {
          resetWorkout();
        }
      } else {
        resetWorkout();
      }
    }
  }, [open, blocks]);

  // Persist data whenever it changes
  useEffect(() => {
    if (open && blocks.length > 0) {
      const data = {
        allCompletedEntries,
        currentBlockIndex,
        warmupMinutes,
        workoutNotes,
        startTime,
      };
      localStorage.setItem(persistenceKey, JSON.stringify(data));
    }
  }, [allCompletedEntries, currentBlockIndex, warmupMinutes, workoutNotes, open, blocks]);

  const resetWorkout = () => {
    setCurrentBlockIndex(0);
    setSelectedExerciseIndex(null);
    setAllCompletedEntries([]);
    setWarmupMinutes(undefined);
    setWorkoutNotes('');
    setStartTime(Date.now());
  };

  if (!blocks || blocks.length === 0) return null;

  const currentBlock = blocks[currentBlockIndex];
  const exercises = (currentBlock as any).items || (currentBlock as any).exercises || [];

  // Get completed exercises for current block
  const blockStartIndex = blocks.slice(0, currentBlockIndex).reduce((sum, b) => {
    const blockExercises = (b as any).items || (b as any).exercises || [];
    return sum + blockExercises.length;
  }, 0);

  const currentBlockEntries = allCompletedEntries.slice(
    blockStartIndex,
    blockStartIndex + exercises.length
  );

  const handleSaveExercise = (exerciseEntry: WorkoutEntry) => {
    const absoluteIndex = blockStartIndex + (selectedExerciseIndex || 0);

    const updatedEntries = [...allCompletedEntries];
    updatedEntries[absoluteIndex] = exerciseEntry;

    setAllCompletedEntries(updatedEntries);
    setSelectedExerciseIndex(null);
  };

  const handleNextBlock = () => {
    if (currentBlockIndex < blocks.length - 1) {
      setCurrentBlockIndex(currentBlockIndex + 1);
      setSelectedExerciseIndex(null);
    }
  };

  const handlePreviousBlock = () => {
    if (currentBlockIndex > 0) {
      setCurrentBlockIndex(currentBlockIndex - 1);
      setSelectedExerciseIndex(null);
    }
  };

  const handleFinish = () => {
    const elapsedMinutes = Math.round((Date.now() - startTime) / 60000);
    const totalMinutes = (warmupMinutes || 0) + elapsedMinutes;

    // Clear persistence
    localStorage.removeItem(persistenceKey);

    onFinish(allCompletedEntries, workoutNotes, totalMinutes, dayName);
    resetWorkout();
  };

  const totalExercises = blocks.reduce((sum, b) => {
    const blockExercises = (b as any).items || (b as any).exercises || [];
    return sum + blockExercises.length;
  }, 0);

  const completedCount = allCompletedEntries.filter(e => e && e.setData && e.setData.length > 0).length;
  const progressPercent = totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0;

  // If an exercise is selected, show the workout form
  if (selectedExerciseIndex !== null) {
    const exercise = exercises[selectedExerciseIndex];
    const absoluteIndex = blockStartIndex + selectedExerciseIndex;
    const existingEntry = allCompletedEntries[absoluteIndex];

    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <WorkoutForm
            exercise={exercise}
            onSave={handleSaveExercise}
            onBack={() => setSelectedExerciseIndex(null)}
            existingEntry={existingEntry}
            trainingType={trainingType}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      <DialogTitle>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {dayName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {trainingTypeName}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Progress */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {t('workout.exercisesCompleted', { completed: completedCount, total: totalExercises })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(progressPercent)}%
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={progressPercent} sx={{ height: 8, borderRadius: 1 }} />
        </Box>

        {/* Block Stepper */}
        {blocks.length > 1 && (
          <Stepper activeStep={currentBlockIndex} sx={{ mb: 3 }}>
            {blocks.map((block, index) => (
              <Step key={index}>
                <StepLabel>{block.title}</StepLabel>
              </Step>
            ))}
          </Stepper>
        )}

        {/* Current Block */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
            {currentBlock.title}
          </Typography>

          {/* Warmup */}
          {currentBlockIndex === 0 && (
            <Box sx={{ mb: 3 }}>
              <TextField
                label="Warm-up Duration (minutes)"
                type="number"
                value={warmupMinutes || ''}
                onChange={(e) => setWarmupMinutes(e.target.value ? parseInt(e.target.value) : undefined)}
                size="small"
                fullWidth
                inputProps={{ min: 0, max: 60 }}
              />
            </Box>
          )}

          {/* Exercise List */}
          <List>
            {exercises.map((exercise: any, index: number) => {
              const absoluteIndex = blockStartIndex + index;
              const entry = allCompletedEntries[absoluteIndex];
              const isCompleted = entry && entry.setData && entry.setData.length > 0;

              return (
                <ListItem key={index} disablePadding>
                  <ListItemButton
                    onClick={() => setSelectedExerciseIndex(index)}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <ListItemIcon>
                      {isCompleted ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <RadioButtonUncheckedIcon color="action" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={exercise.name}
                      secondary={
                        entry && entry.setData ? (
                          <Typography variant="caption" color="success.main">
                            {entry.setData.length} sets completed
                          </Typography>
                        ) : null
                      }
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Notes */}
        <TextField
          label={t('workout.notes')}
          multiline
          rows={3}
          fullWidth
          value={workoutNotes}
          onChange={(e) => setWorkoutNotes(e.target.value)}
          placeholder={t('workout.notesPlaceholder')}
        />
      </DialogContent>

      <DialogActions sx={{ p: 2, flexWrap: 'wrap', gap: 1 }}>
        <Button onClick={onClose} color="inherit">
          {t('common.cancel')}
        </Button>

        <Box sx={{ flex: 1 }} />

        {currentBlockIndex > 0 && (
          <Button onClick={handlePreviousBlock} variant="outlined">
            Previous Block
          </Button>
        )}

        {currentBlockIndex < blocks.length - 1 ? (
          <Button onClick={handleNextBlock} variant="contained">
            Next Block
          </Button>
        ) : (
          <Button
            onClick={handleFinish}
            variant="contained"
            color="success"
            disabled={completedCount === 0}
          >
            {t('workout.finishWorkout')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
