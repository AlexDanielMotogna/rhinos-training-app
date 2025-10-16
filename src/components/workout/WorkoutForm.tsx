import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  IconButton,
  Slider,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Exercise, ExerciseCategory } from '../../types/exercise';
import type { WorkoutEntry, SetData } from '../../types/workout';
import { sanitizeYouTubeUrl } from '../../services/yt';
import { useI18n } from '../../i18n/I18nProvider';

interface WorkoutFormProps {
  exercise?: Exercise;
  onSave: (entry: WorkoutEntry) => void;
  onCancel: () => void;
}

const categories: ExerciseCategory[] = [
  'Strength',
  'Speed',
  'COD',
  'Mobility',
  'Technique',
  'Conditioning',
  'Recovery',
  'Plyometrics',
];

export const WorkoutForm: React.FC<WorkoutFormProps> = ({
  exercise,
  onSave,
  onCancel,
}) => {
  const { t } = useI18n();
  const [name, setName] = useState(exercise?.name || '');
  const [category, setCategory] = useState<ExerciseCategory>(exercise?.category || 'Strength');
  const [setData, setSetData] = useState<SetData[]>([
    { setNumber: 1, reps: undefined, kg: undefined, durationMin: undefined }
  ]);
  const [rpe, setRpe] = useState<number>(5);
  const [youtubeUrl, setYoutubeUrl] = useState(exercise?.youtubeUrl || '');
  const [notes, setNotes] = useState('');

  const handleAddSet = () => {
    const newSetNumber = setData.length + 1;
    setSetData([...setData, { setNumber: newSetNumber, reps: undefined, kg: undefined, durationMin: undefined }]);
  };

  const handleRemoveSet = (index: number) => {
    if (setData.length > 1) {
      const newSets = setData.filter((_, i) => i !== index);
      // Renumber remaining sets
      const renumbered = newSets.map((set, idx) => ({ ...set, setNumber: idx + 1 }));
      setSetData(renumbered);
    }
  };

  const handleSetChange = (index: number, field: keyof SetData, value: number | undefined) => {
    const newSets = [...setData];
    if (field !== 'setNumber') {
      newSets[index] = { ...newSets[index], [field]: value };
      setSetData(newSets);
    }
  };

  const handleSubmit = () => {
    const sanitizedUrl = youtubeUrl ? sanitizeYouTubeUrl(youtubeUrl) : undefined;

    // Filter out empty sets
    const validSets = setData.filter(set =>
      set.reps !== undefined || set.kg !== undefined || set.durationMin !== undefined
    );

    const entry: WorkoutEntry = {
      exerciseId: exercise?.id,
      name,
      category,
      sets: validSets.length,
      setData: validSets,
      rpe: rpe,
      source: 'player',
      specific: false,
      youtubeUrl: sanitizedUrl,
      notes: notes || undefined,
    };

    onSave(entry);
  };

  const isValid = () => {
    // Name must be filled and at least one set should have data
    return name.trim().length > 0 && setData.some(set =>
      set.reps !== undefined || set.kg !== undefined || set.durationMin !== undefined
    );
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        {exercise ? exercise.name : t('workout.createCustom')}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {!exercise && (
          <>
            <TextField
              label={t('workout.exerciseName')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
            />

            <FormControl fullWidth required>
              <InputLabel>{t('workout.category')}</InputLabel>
              <Select
                value={category}
                label={t('workout.category')}
                onChange={(e) => setCategory(e.target.value as ExerciseCategory)}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {t(`category.${cat}` as any)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
        )}

        <Divider sx={{ my: 1 }} />

        {/* Sets with individual tracking */}
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
            {setData.map((set, index) => (
              <Paper key={index} sx={{ p: 2, backgroundColor: 'background.default' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle2" color="primary.main" fontWeight={600}>
                    {t('workout.setNumber', { number: set.setNumber })}
                  </Typography>
                  {setData.length > 1 && (
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
                    label={t('workout.durationMin')}
                    type="number"
                    size="small"
                    value={set.durationMin ?? ''}
                    onChange={(e) => handleSetChange(index, 'durationMin', e.target.value ? Number(e.target.value) : undefined)}
                    inputProps={{ min: 0, max: 60, step: 0.5 }}
                    fullWidth
                  />
                </Box>
              </Paper>
            ))}
          </Box>
        </Box>

        <Divider />

        {/* RPE Slider */}
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

        <TextField
          label={t('workout.video')}
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          helperText="YouTube URL (optional)"
          fullWidth
        />

        <TextField
          label={t('workout.notes')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          multiline
          rows={2}
          fullWidth
        />

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!isValid()}
          >
            {t('common.save')}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};
