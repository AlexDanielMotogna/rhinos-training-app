import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  Chip,
  OutlinedInput,
  SelectChangeEvent,
} from '@mui/material';
import { useI18n } from '../../i18n/I18nProvider';
import type { Exercise, ExerciseCategory, MuscleGroup } from '../../types/exercise';
import { exerciseService } from '../../services/api';
import { toastService } from '../../services/toast';

interface ExerciseFormDialogProps {
  open: boolean;
  editingExercise?: Exercise | null;
  onClose: () => void;
  onSuccess: () => void;
}

const categories: ExerciseCategory[] = [
  'Strength',
  'Speed',
  'COD',
  'Mobility',
  'Technique',
  'Conditioning',
  'Plyometrics',
];

const muscleGroups: MuscleGroup[] = [
  'legs',
  'chest',
  'back',
  'shoulders',
  'arms',
  'core',
  'full-body',
];

export const ExerciseFormDialog: React.FC<ExerciseFormDialogProps> = ({
  open,
  editingExercise,
  onClose,
  onSuccess,
}) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    name: '',
    category: 'Strength' as ExerciseCategory,
    youtubeUrl: '',
    muscleGroups: [] as MuscleGroup[],
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editingExercise) {
      setFormData({
        name: editingExercise.name,
        category: editingExercise.category,
        youtubeUrl: editingExercise.youtubeUrl || '',
        muscleGroups: editingExercise.muscleGroups || [],
      });
    } else {
      setFormData({
        name: '',
        category: 'Strength',
        youtubeUrl: '',
        muscleGroups: [],
      });
    }
  }, [editingExercise, open]);

  const handleMuscleGroupChange = (event: SelectChangeEvent<MuscleGroup[]>) => {
    const value = event.target.value;
    setFormData({
      ...formData,
      muscleGroups: typeof value === 'string' ? [value as MuscleGroup] : value,
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toastService.validationError('Exercise name is required');
      return;
    }

    setIsSaving(true);
    try {
      if (editingExercise) {
        await exerciseService.update(editingExercise.id, formData);
        toastService.updated('Exercise');
      } else {
        await exerciseService.create(formData);
        toastService.created('Exercise');
      }
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Failed to save exercise:', error);
      if (editingExercise) {
        toastService.updateError('exercise', error.message);
      } else {
        toastService.createError('exercise', error.message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      category: 'Strength',
      youtubeUrl: '',
      muscleGroups: [],
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editingExercise ? t('admin.editExercise') : t('admin.addExercise')}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            label="Exercise Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            required
            autoFocus
          />

          <TextField
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as ExerciseCategory })}
            select
            fullWidth
            required
          >
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </TextField>

          <FormControl fullWidth>
            <InputLabel>Muscle Groups</InputLabel>
            <Select
              multiple
              value={formData.muscleGroups}
              onChange={handleMuscleGroupChange}
              input={<OutlinedInput label="Muscle Groups" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={t(`muscleGroup.${value}` as any)} size="small" />
                  ))}
                </Box>
              )}
            >
              {muscleGroups.map((group) => (
                <MenuItem key={group} value={group}>
                  {t(`muscleGroup.${group}` as any)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="YouTube URL"
            value={formData.youtubeUrl}
            onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
            fullWidth
            placeholder="https://www.youtube.com/watch?v=..."
            helperText="Optional: Add a video demonstration"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isSaving}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={isSaving || !formData.name.trim()}
          startIcon={isSaving ? <CircularProgress size={20} /> : null}
        >
          {isSaving ? t('common.saving') : t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
