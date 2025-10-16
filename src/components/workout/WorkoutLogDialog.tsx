import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Slider,
  Chip,
  IconButton,
  Paper,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useI18n } from '../../i18n/I18nProvider';
import type { Exercise } from '../../types/exercise';
import type { WorkoutEntry, SetData } from '../../types/workout';

interface WorkoutLogDialogProps {
  open: boolean;
  exercise: Exercise | null;
  onClose: () => void;
  onSave: (entry: WorkoutEntry) => void;
}

export const WorkoutLogDialog: React.FC<WorkoutLogDialogProps> = ({
  open,
  exercise,
  onClose,
  onSave,
}) => {
  const { t } = useI18n();
  const [sets, setSets] = useState<SetData[]>([
    { setNumber: 1, reps: undefined, kg: undefined, durationSec: undefined }
  ]);
  const [rpe, setRpe] = useState<number>(5);
  const [notes, setNotes] = useState('');

  const handleClose = () => {
    // Reset form
    setSets([{ setNumber: 1, reps: undefined, kg: undefined, durationSec: undefined }]);
    setRpe(5);
    setNotes('');
    onClose();
  };

  const handleAddSet = () => {
    const newSetNumber = sets.length + 1;
    setSets([...sets, { setNumber: newSetNumber, reps: undefined, kg: undefined, durationSec: undefined }]);
  };

  const handleRemoveSet = (index: number) => {
    if (sets.length > 1) {
      const newSets = sets.filter((_, i) => i !== index);
      // Renumber remaining sets
      const renumbered = newSets.map((set, idx) => ({ ...set, setNumber: idx + 1 }));
      setSets(renumbered);
    }
  };

  const handleSetChange = (index: number, field: keyof SetData, value: number | undefined) => {
    const newSets = [...sets];
    if (field !== 'setNumber') {
      newSets[index] = { ...newSets[index], [field]: value };
      setSets(newSets);
    }
  };

  const handleSave = () => {
    if (!exercise) return;

    // Filter out empty sets
    const validSets = sets.filter(set =>
      set.reps !== undefined || set.kg !== undefined || set.durationSec !== undefined
    );

    if (validSets.length === 0) return;

    const entry: WorkoutEntry = {
      exerciseId: exercise.id,
      name: exercise.name,
      category: exercise.category,
      sets: validSets.length,
      setData: validSets,
      rpe: rpe,
      source: 'coach',
      youtubeUrl: exercise.youtubeUrl,
      notes: notes || undefined,
    };

    onSave(entry);
    handleClose();
  };

  const isValid = () => {
    // At least one set should have at least one metric filled
    return sets.some(set =>
      set.reps !== undefined || set.kg !== undefined || set.durationSec !== undefined
    );
  };

  if (!exercise) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6">{t('workout.logWorkout')}</Typography>
        <Typography variant="body2" color="text.secondary">
          {exercise.name}
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Chip
            label={t(`category.${exercise.category}` as any)}
            size="small"
            color="primary"
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {/* Sets */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                {t('workout.sets')}
              </Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddSet}
                variant="outlined"
                color="secondary"
              >
                {t('workout.addSet')}
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {sets.map((set, index) => (
                <Paper key={index} sx={{ p: 2, backgroundColor: 'background.default' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="subtitle2" color="primary.main" fontWeight={600}>
                      {t('workout.setNumber', { number: set.setNumber })}
                    </Typography>
                    {sets.length > 1 && (
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveSet(index)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 1.5 }}>
                    <TextField
                      label={t('workout.reps')}
                      type="number"
                      size="small"
                      value={set.reps ?? ''}
                      onChange={(e) => handleSetChange(index, 'reps', e.target.value ? Number(e.target.value) : undefined)}
                      inputProps={{ min: 0, max: 100 }}
                      fullWidth
                    />
                    <TextField
                      label={t('workout.kg')}
                      type="number"
                      size="small"
                      value={set.kg ?? ''}
                      onChange={(e) => handleSetChange(index, 'kg', e.target.value ? Number(e.target.value) : undefined)}
                      inputProps={{ min: 0, max: 500, step: 0.5 }}
                      fullWidth
                    />
                    <TextField
                      label={t('workout.durationSec')}
                      type="number"
                      size="small"
                      value={set.durationSec ?? ''}
                      onChange={(e) => handleSetChange(index, 'durationSec', e.target.value ? Number(e.target.value) : undefined)}
                      inputProps={{ min: 0, max: 60, step: 0.5 }}
                      fullWidth
                    />
                  </Box>
                </Paper>
              ))}
            </Box>
          </Box>

          <Divider />

          {/* RPE */}
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('workout.rpe')} (Rate of Perceived Exertion): {rpe}
            </Typography>
            <Slider
              value={rpe}
              onChange={(_, value) => setRpe(value as number)}
              min={1}
              max={10}
              step={1}
              marks
              valueLabelDisplay="auto"
              color="secondary"
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                1 (Easy)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                10 (Max Effort)
              </Typography>
            </Box>
          </Box>

          {/* Notes */}
          <TextField
            label={t('workout.notes')}
            multiline
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('workout.notesPlaceholder')}
            fullWidth
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose}>{t('common.cancel')}</Button>
        <Button variant="contained" onClick={handleSave} disabled={!isValid()}>
          {t('workout.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
