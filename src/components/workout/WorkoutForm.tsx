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
} from '@mui/material';
import type { Exercise, ExerciseCategory } from '../../types/exercise';
import type { WorkoutEntry } from '../../types/workout';
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
  const [sets, setSets] = useState<number | ''>('');
  const [reps, setReps] = useState<number | ''>('');
  const [kg, setKg] = useState<number | ''>('');
  const [durationMin, setDurationMin] = useState<number | ''>('');
  const [rpe, setRpe] = useState<number | ''>('');
  const [youtubeUrl, setYoutubeUrl] = useState(exercise?.youtubeUrl || '');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    const sanitizedUrl = youtubeUrl ? sanitizeYouTubeUrl(youtubeUrl) : undefined;

    const entry: WorkoutEntry = {
      exerciseId: exercise?.id,
      name,
      category,
      sets: sets || undefined,
      reps: reps || undefined,
      kg: kg || undefined,
      durationMin: durationMin || undefined,
      rpe: rpe || undefined,
      source: 'player',
      specific: false,
      youtubeUrl: sanitizedUrl,
      notes: notes || undefined,
    };

    onSave(entry);
  };

  const isValid = name.trim().length > 0;

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

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <TextField
            label={t('workout.sets')}
            type="number"
            value={sets}
            onChange={(e) => setSets(e.target.value ? Number(e.target.value) : '')}
            inputProps={{ min: 0 }}
          />

          <TextField
            label={t('workout.reps')}
            type="number"
            value={reps}
            onChange={(e) => setReps(e.target.value ? Number(e.target.value) : '')}
            inputProps={{ min: 0 }}
          />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <TextField
            label={t('workout.kg')}
            type="number"
            value={kg}
            onChange={(e) => setKg(e.target.value ? Number(e.target.value) : '')}
            inputProps={{ min: 0, step: 0.5 }}
          />

          <TextField
            label={t('workout.durationMin')}
            type="number"
            value={durationMin}
            onChange={(e) => setDurationMin(e.target.value ? Number(e.target.value) : '')}
            inputProps={{ min: 0 }}
          />
        </Box>

        <TextField
          label={t('workout.rpe')}
          type="number"
          value={rpe}
          onChange={(e) => setRpe(e.target.value ? Number(e.target.value) : '')}
          inputProps={{ min: 1, max: 10 }}
          helperText="Rate of Perceived Exertion (1-10)"
        />

        <TextField
          label={t('workout.video')}
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          helperText="YouTube URL (optional)"
        />

        <TextField
          label={t('workout.notes')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          multiline
          rows={3}
        />

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!isValid}
          >
            {t('common.save')}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};
