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
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { useI18n } from '../../i18n/I18nProvider';
import { WorkoutForm } from './WorkoutForm';
import type { TemplateBlock } from '../../types/template';
import type { WorkoutEntry } from '../../types/workout';

interface CoachBlockWorkoutDialogProps {
  open: boolean;
  block: TemplateBlock | null;
  blockTitle: string;
  trainingType: 'strength_conditioning' | 'sprints_speed';
  onClose: () => void;
  onFinish: (entries: WorkoutEntry[], notes: string, duration: number) => void;
}

export const CoachBlockWorkoutDialog: React.FC<CoachBlockWorkoutDialogProps> = ({
  open,
  block,
  blockTitle,
  trainingType,
  onClose,
  onFinish,
}) => {
  const { t } = useI18n();
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<number | null>(null);
  const [completedEntries, setCompletedEntries] = useState<WorkoutEntry[]>([]);
  const [warmupMinutes, setWarmupMinutes] = useState<number | undefined>(undefined);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [startTime, setStartTime] = useState<number>(Date.now());

  // Persistence key for this workout session
  const persistenceKey = block ? `coach_workout_progress_${trainingType}_${blockTitle}` : null;

  // Load persisted data on open
  useEffect(() => {
    if (open && block && persistenceKey) {
      const stored = localStorage.getItem(persistenceKey);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          setCompletedEntries(data.completedEntries || []);
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
  }, [open, block]);

  // Persist data whenever it changes
  useEffect(() => {
    if (open && block && persistenceKey) {
      const data = {
        completedEntries,
        warmupMinutes,
        workoutNotes,
        startTime,
      };
      localStorage.setItem(persistenceKey, JSON.stringify(data));
    }
  }, [completedEntries, warmupMinutes, workoutNotes, open, block, persistenceKey]);

  const resetWorkout = () => {
    setSelectedExerciseIndex(null);
    setCompletedEntries([]);
    setWarmupMinutes(undefined);
    setWorkoutNotes('');
    setStartTime(Date.now());
  };

  if (!block) return null;

  const totalExercises = block.items.length;
  const progress = (completedEntries.length / totalExercises) * 100;
  const selectedExercise = selectedExerciseIndex !== null ? block.items[selectedExerciseIndex] : null;

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
        sets: existing.sets || entry.sets, // Keep target sets (don't sum)
        notes: entry.notes || existing.notes,
        rpe: entry.rpe,
      };

      // Update the existing entry
      const newEntries = [...completedEntries];
      newEntries[existingIndex] = mergedEntry;
      setCompletedEntries(newEntries);
    } else {
      // First time logging this exercise
      setCompletedEntries([...completedEntries, entry]);
    }

    setSelectedExerciseIndex(null);
  };

  const handleFinishClick = () => {
    // Calculate elapsed time and pass to parent (will show FinishWorkoutDialog)
    const elapsedMinutes = Math.round((Date.now() - startTime) / 1000 / 60);

    // Create entries for ALL exercises in the block, not just completed ones
    const allEntries: WorkoutEntry[] = block.items.map((exercise, index) => {
      // Check if this exercise has logged data
      const existing = completedEntries.find(e => e.name === exercise.name);

      if (existing) {
        // Exercise was logged - use the logged data
        return existing;
      } else {
        // Exercise was NOT logged - create empty entry with target sets
        const targetSets = getTargetSets(index);
        return {
          exerciseId: exercise.id,
          name: exercise.name,
          category: exercise.category,
          sets: targetSets || 0, // Target sets
          setData: [], // No sets completed
          source: 'coach' as const,
          specific: false,
          youtubeUrl: exercise.youtubeUrl,
        };
      }
    });

    // Prepend warm-up info to notes so AI can see it
    let finalNotes = workoutNotes;
    if (warmupMinutes && warmupMinutes > 0) {
      finalNotes = `[Warm-up: ${warmupMinutes} min]${workoutNotes ? '\n' + workoutNotes : ''}`;
    } else {
      finalNotes = `[No warm-up performed]${workoutNotes ? '\n' + workoutNotes : ''}`;
    }

    onFinish(allEntries, finalNotes, elapsedMinutes);

    // Clear persisted data after finishing
    if (persistenceKey) {
      localStorage.removeItem(persistenceKey);
    }
    // Don't close dialog yet - let parent handle the full flow
  };

  const handleSelectExercise = (index: number) => {
    setSelectedExerciseIndex(index);
  };

  // Get the logged entry for a specific exercise (if any)
  const getExerciseEntry = (index: number): WorkoutEntry | undefined => {
    if (!block || !block.items[index]) return undefined;
    const exerciseName = block.items[index].name;
    return completedEntries.find(entry => entry.name === exerciseName);
  };

  // Get how many sets have been logged for an exercise
  const getCompletedSetsCount = (index: number): number => {
    const entry = getExerciseEntry(index);
    return entry?.setData?.length || 0;
  };

  // Get target sets for a specific exercise
  const getTargetSets = (index: number): number | undefined => {
    if (!block) return undefined;
    const exercise = block.items[index];
    const exerciseConfig = block.exerciseConfigs?.find(c => c.exerciseId === exercise.id);
    return exerciseConfig?.sets || block.globalSets;
  };

  // Convert Exercise to format for WorkoutForm
  const exerciseForForm = selectedExercise ? {
    id: selectedExercise.id,
    name: selectedExercise.name,
    category: selectedExercise.category,
    youtubeUrl: selectedExercise.youtubeUrl,
    isGlobal: selectedExercise.isGlobal || false,
  } : undefined;

  // Get existing entry to pre-populate form with previous sets
  const existingEntryForForm = selectedExerciseIndex !== null
    ? getExerciseEntry(selectedExerciseIndex)
    : undefined;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          m: { xs: 0, sm: 2 },
          maxHeight: { xs: '100vh', sm: 'calc(100vh - 64px)' },
          width: { xs: '100%', sm: 'auto' },
          borderRadius: { xs: 0, sm: 1 },
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
          {blockTitle}
        </Typography>
        <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
          {completedEntries.length} / {totalExercises} exercises completed
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: '10px' }}>
        {/* Progress Bar */}
        <Box sx={{ mb: { xs: 2, sm: 3 } }}>
          <LinearProgress variant="determinate" value={progress} sx={{ height: { xs: 6, sm: 8 }, borderRadius: 1 }} />
        </Box>

        {/* Show form if exercise selected, otherwise show list */}
        {selectedExerciseIndex === null ? (
          <>
            {/* Exercise List - Always Visible */}
            <Typography variant="subtitle2" gutterBottom sx={{ mb: 2, fontSize: { xs: '0.9rem', sm: '0.875rem' } }}>
              Select an exercise to log:
            </Typography>
            <List>
              {block.items.map((exercise, index) => {
                const completedSets = getCompletedSetsCount(index);
                const targetSets = getTargetSets(index);
                const hasAnySets = completedSets > 0;
                const isComplete = targetSets && completedSets >= targetSets;

                return (
                  <ListItem
                    key={index}
                    disablePadding
                    sx={{ mb: { xs: 0.75, sm: 1 } }}
                  >
                    <ListItemButton
                      onClick={() => handleSelectExercise(index)}
                      sx={{
                        border: 1,
                        borderColor: isComplete ? 'success.main' : hasAnySets ? 'info.main' : 'divider',
                        borderRadius: 1,
                        bgcolor: isComplete ? 'success.lighter' : hasAnySets ? 'info.lighter' : 'transparent',
                        py: { xs: 1, sm: 1.5 },
                        px: { xs: 1.5, sm: 2 },
                        '&:hover': {
                          borderColor: 'primary.main',
                        },
                      }}
                    >
                      <ListItemIcon>
                        {hasAnySets ? (
                          <Typography
                            variant="caption"
                            sx={{
                              width: 24,
                              height: 24,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '50%',
                              bgcolor: isComplete ? 'success.main' : 'info.main',
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
                          targetSets
                            ? `${completedSets}/${targetSets} sets ${isComplete ? '✓' : ''}`
                            : completedSets > 0
                              ? `${completedSets} sets logged`
                              : 'Not started'
                        }
                        primaryTypographyProps={{
                          sx: { fontSize: { xs: '0.9rem', sm: '1rem' } }
                        }}
                        secondaryTypographyProps={{
                          sx: { fontSize: { xs: '0.75rem', sm: '0.875rem' } }
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>

            <Divider sx={{ my: { xs: 2, sm: 3 } }} />

            {/* Warm-up */}
            <TextField
              label="Warm-up (minutes)"
              type="number"
              value={warmupMinutes ?? ''}
              onChange={(e) => setWarmupMinutes(e.target.value ? Number(e.target.value) : undefined)}
              fullWidth
              placeholder="Did you warm up? Enter minutes (e.g., 10)"
              helperText="IMPORTANT: Always warm up before training! If left empty, AI will assume no warm-up."
              inputProps={{ min: 0, max: 60, step: 1 }}
              sx={{ mb: 2 }}
            />

            {/* Workout Notes */}
            <TextField
              label="Workout Notes (optional)"
              value={workoutNotes}
              onChange={(e) => setWorkoutNotes(e.target.value)}
              multiline
              rows={3}
              fullWidth
              size="small"
              placeholder="How did the workout feel? Any observations?"
            />
          </>
        ) : (
          <WorkoutForm
            exercise={exerciseForForm}
            initialData={existingEntryForForm}
            targetSets={selectedExerciseIndex !== null ? getTargetSets(selectedExerciseIndex) : undefined}
            onSave={handleSaveExercise}
            onCancel={() => setSelectedExerciseIndex(null)}
          />
        )}
      </DialogContent>

      <DialogActions sx={{ p: '10px' }}>
        <Button onClick={onClose} sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
          {t('common.cancel')}
        </Button>
        {completedEntries.length > 0 && (
          <Button
            onClick={handleFinishClick}
            variant="contained"
            color="success"
            sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
          >
            {t('workout.finishWorkout')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
