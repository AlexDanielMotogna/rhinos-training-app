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
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Exercise, ExerciseCategory } from '../../types/exercise';
import type { WorkoutEntry, SetData } from '../../types/workout';
import { sanitizeYouTubeUrl } from '../../services/yt';
import { useI18n } from '../../i18n/I18nProvider';

interface WorkoutFormProps {
  exercise?: Exercise;
  initialData?: WorkoutEntry;
  targetSets?: number; // Target sets for this exercise
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
  initialData,
  targetSets,
  onSave,
  onCancel,
}) => {
  const { t } = useI18n();
  const [name, setName] = useState(initialData?.name || exercise?.name || '');
  const [category, setCategory] = useState<ExerciseCategory>(initialData?.category || exercise?.category || 'Strength');

  // Separate previous sets (read-only) from new sets (editable)
  const previousSets = initialData?.setData || [];
  const nextSetNumber = previousSets.length > 0
    ? Math.max(...previousSets.map(s => s.setNumber)) + 1
    : 1;

  const [setData, setSetData] = useState<SetData[]>([
    { setNumber: nextSetNumber, reps: undefined, kg: undefined, durationSec: undefined, distance: undefined }
  ]);
  const [rpe, setRpe] = useState<number>(initialData?.rpe || 5);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [durationUnit, setDurationUnit] = useState<'sec' | 'min'>('sec');
  const [distanceUnit, setDistanceUnit] = useState<'km' | 'm' | 'mi' | 'yd'>('km');

  // Distance conversion helpers (all stored in km)
  const convertDistanceToDisplay = (km: number | undefined): number | undefined => {
    if (km === undefined) return undefined;
    switch (distanceUnit) {
      case 'km': return km;
      case 'm': return km * 1000;
      case 'mi': return km * 0.621371; // km to miles
      case 'yd': return km * 1093.61; // km to yards
      default: return km;
    }
  };

  const convertDistanceToKm = (value: number | undefined): number | undefined => {
    if (value === undefined) return undefined;
    switch (distanceUnit) {
      case 'km': return value;
      case 'm': return value / 1000;
      case 'mi': return value / 0.621371; // miles to km
      case 'yd': return value / 1093.61; // yards to km
      default: return value;
    }
  };

  const handleAddSet = () => {
    const currentMaxSetNumber = setData.length > 0
      ? Math.max(...setData.map(s => s.setNumber))
      : nextSetNumber - 1;
    const newSetNumber = currentMaxSetNumber + 1;
    setSetData([...setData, { setNumber: newSetNumber, reps: undefined, kg: undefined, durationSec: undefined, distance: undefined }]);
  };

  const handleRemoveSet = (index: number) => {
    if (setData.length > 1) {
      const newSets = setData.filter((_, i) => i !== index);
      setSetData(newSets);
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
    // Filter out empty sets
    const validSets = setData.filter(set =>
      set.reps !== undefined || set.kg !== undefined || set.durationSec !== undefined || set.distance !== undefined
    );

    const entry: WorkoutEntry = {
      exerciseId: exercise?.id,
      name,
      category,
      sets: targetSets || validSets.length, // Use targetSets if provided, otherwise use what was logged
      setData: validSets,
      rpe: rpe,
      source: 'player',
      specific: false,
      youtubeUrl: exercise?.youtubeUrl, // Always use video from exercise catalog
      notes: notes || undefined,
    };

    onSave(entry);
  };

  const isValid = () => {
    // Name must be filled and at least one set should have data
    return name.trim().length > 0 && setData.some(set =>
      set.reps !== undefined || set.kg !== undefined || set.durationSec !== undefined || set.distance !== undefined
    );
  };

  // Get embedded YouTube URL if available
  const getEmbedUrl = (url: string | undefined): string | null => {
    if (!url) return null;
    const sanitized = sanitizeYouTubeUrl(url);
    if (!sanitized) return null;

    // Convert watch URL to embed URL
    const videoId = sanitized.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const embedUrl = getEmbedUrl(exercise?.youtubeUrl);

  return (
    <Paper sx={{ p: '10px', maxHeight: '90vh', overflow: 'auto' }}>
      <Typography variant="h6" sx={{ mb: { xs: 2, sm: 3 }, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
        {exercise ? exercise.name : t('workout.createCustom')}
      </Typography>

      {/* Sets completion info */}
      {targetSets && (
        <Box sx={{ mb: 2, p: 1.5, bgcolor: 'info.lighter', borderRadius: 1 }}>
          <Typography variant="body2" color="text.primary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            {previousSets.length} / {targetSets} sets completed
          </Typography>
        </Box>
      )}

      {/* YouTube Video Embed */}
      {embedUrl && (
        <Box sx={{ mb: { xs: 2, sm: 3 }, borderRadius: 1, overflow: 'hidden' }}>
          <Box
            component="iframe"
            src={embedUrl}
            sx={{
              width: '100%',
              height: { xs: 180, sm: 300 },
              border: 'none',
              borderRadius: 1,
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
            {t('workout.videoInstruction')}
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
        {!exercise && (
          <>
            <TextField
              label={t('workout.exerciseName')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              size="small"
            />

            <FormControl fullWidth required size="small">
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

        <Divider sx={{ my: { xs: 0.5, sm: 1 } }} />

        {/* Sets with individual tracking */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                {t('workout.sets')}
              </Typography>
              {targetSets && (
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, display: 'block' }}>
                  Target: {targetSets} sets • Completed: {previousSets.length} • New: {setData.length}
                </Typography>
              )}
            </Box>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddSet}
              variant="outlined"
              color="secondary"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, px: { xs: 1, sm: 2 } }}
            >
              Add Set
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
            {/* Previous sets (read-only) */}
            {previousSets.map((set, index) => (
              <Paper key={`prev-${index}`} sx={{ p: { xs: 1.5, sm: 2 }, backgroundColor: 'success.lighter', opacity: 0.7 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 1, sm: 1.5 } }}>
                  <Typography variant="subtitle2" color="success.dark" fontWeight={600} sx={{ fontSize: { xs: '0.85rem', sm: '0.875rem' } }}>
                    {t('workout.setNumber', { number: set.setNumber })} ✓
                  </Typography>
                  <Typography variant="caption" color="success.dark" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                    {t('workout.alreadyLogged')}
                  </Typography>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                  {/* Strength/Plyometrics: Reps + Weight */}
                  {(category === 'Strength' || category === 'Plyometrics') && (
                    <>
                      <TextField
                        label={t('workout.reps')}
                        size="small"
                        value={set.reps ?? ''}
                        disabled
                        fullWidth
                      />
                      <TextField
                        label={t('workout.kg')}
                        size="small"
                        value={set.kg ?? ''}
                        disabled
                        fullWidth
                      />
                    </>
                  )}

                  {/* Speed/COD/Conditioning/Technique: Reps + Duration + Distance */}
                  {(category === 'Speed' || category === 'COD' || category === 'Conditioning' || category === 'Technique') && (
                    <>
                      <TextField
                        label={t('workout.reps')}
                        size="small"
                        value={set.reps ?? ''}
                        disabled
                        fullWidth
                      />
                      <TextField
                        label="Duration (sec)"
                        size="small"
                        value={set.durationSec ?? ''}
                        disabled
                        fullWidth
                      />
                      <TextField
                        label={`Distance (${distanceUnit})`}
                        size="small"
                        value={set.distance !== undefined ? convertDistanceToDisplay(set.distance) : ''}
                        disabled
                        fullWidth
                      />
                    </>
                  )}

                  {/* Mobility/Recovery: Only Duration */}
                  {(category === 'Mobility' || category === 'Recovery') && (
                    <TextField
                      label="Duration (sec)"
                      size="small"
                      value={set.durationSec ?? ''}
                      disabled
                      fullWidth
                    />
                  )}
                </Box>
              </Paper>
            ))}

            {/* New sets (editable) */}
            {setData.map((set, index) => (
              <Paper key={`new-${index}`} sx={{ p: { xs: 1.5, sm: 2 }, backgroundColor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 1, sm: 1.5 } }}>
                  <Typography variant="subtitle2" color="primary.main" fontWeight={600} sx={{ fontSize: { xs: '0.85rem', sm: '0.875rem' } }}>
                    Set ({set.setNumber})
                  </Typography>
                  {setData.length > 1 && (
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveSet(index)}
                      color="error"
                      sx={{ p: { xs: 0.5, sm: 1 } }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                  {/* Strength/Plyometrics: Reps + Weight */}
                  {(category === 'Strength' || category === 'Plyometrics') && (
                    <>
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
                    </>
                  )}

                  {/* Speed/COD/Conditioning/Technique: Reps + Duration + Distance */}
                  {(category === 'Speed' || category === 'COD' || category === 'Conditioning' || category === 'Technique') && (
                    <>
                      <TextField
                        label={t('workout.reps')}
                        type="number"
                        size="small"
                        value={set.reps ?? ''}
                        onChange={(e) => handleSetChange(index, 'reps', e.target.value ? Number(e.target.value) : undefined)}
                        inputProps={{ min: 0, max: 100 }}
                        fullWidth
                      />
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                        <TextField
                          label={`Duration (${durationUnit})`}
                          type="number"
                          size="small"
                          value={
                            set.durationSec !== undefined
                              ? durationUnit === 'min'
                                ? set.durationSec / 60
                                : set.durationSec
                              : ''
                          }
                          onChange={(e) => {
                            const inputValue = e.target.value ? Number(e.target.value) : undefined;
                            const valueInSec = inputValue !== undefined
                              ? durationUnit === 'min'
                                ? inputValue * 60
                                : inputValue
                              : undefined;
                            handleSetChange(index, 'durationSec', valueInSec);
                          }}
                          inputProps={{ min: 0, max: durationUnit === 'min' ? 60 : 3600, step: 0.1 }}
                          sx={{ flex: 1 }}
                        />
                        <ToggleButtonGroup
                          value={durationUnit}
                          exclusive
                          onChange={(_, newUnit) => newUnit && setDurationUnit(newUnit)}
                          size="small"
                          sx={{ height: 40 }}
                        >
                          <ToggleButton value="sec" sx={{ px: 1.5 }}>
                            sec
                          </ToggleButton>
                          <ToggleButton value="min" sx={{ px: 1.5 }}>
                            min
                          </ToggleButton>
                        </ToggleButtonGroup>
                      </Box>
                      <Box sx={{ gridColumn: { xs: '1', sm: 'span 2' } }}>
                        <TextField
                          label={`Distance (${distanceUnit})`}
                          type="number"
                          size="small"
                          value={
                            set.distance !== undefined
                              ? convertDistanceToDisplay(set.distance)
                              : ''
                          }
                          onChange={(e) => {
                            const inputValue = e.target.value ? Number(e.target.value) : undefined;
                            const valueInKm = convertDistanceToKm(inputValue);
                            handleSetChange(index, 'distance', valueInKm);
                          }}
                          inputProps={{ min: 0, step: 0.01 }}
                          fullWidth
                        />
                        <ToggleButtonGroup
                          value={distanceUnit}
                          exclusive
                          onChange={(_, newUnit) => newUnit && setDistanceUnit(newUnit)}
                          size="small"
                          fullWidth
                          sx={{ mt: 1, height: 32 }}
                        >
                          <ToggleButton value="km" sx={{ px: 0.5, fontSize: '0.75rem' }}>
                            km
                          </ToggleButton>
                          <ToggleButton value="m" sx={{ px: 0.5, fontSize: '0.75rem' }}>
                            m
                          </ToggleButton>
                          <ToggleButton value="mi" sx={{ px: 0.5, fontSize: '0.75rem' }}>
                            mi
                          </ToggleButton>
                          <ToggleButton value="yd" sx={{ px: 0.5, fontSize: '0.75rem' }}>
                            yd
                          </ToggleButton>
                        </ToggleButtonGroup>
                      </Box>
                    </>
                  )}

                  {/* Mobility/Recovery: Only Duration */}
                  {(category === 'Mobility' || category === 'Recovery') && (
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                      <TextField
                        label={`Duration (${durationUnit})`}
                        type="number"
                        size="small"
                        value={
                          set.durationSec !== undefined
                            ? durationUnit === 'min'
                              ? set.durationSec / 60
                              : set.durationSec
                            : ''
                        }
                        onChange={(e) => {
                          const inputValue = e.target.value ? Number(e.target.value) : undefined;
                          const valueInSec = inputValue !== undefined
                            ? durationUnit === 'min'
                              ? inputValue * 60
                              : inputValue
                            : undefined;
                          handleSetChange(index, 'durationSec', valueInSec);
                        }}
                        inputProps={{ min: 0, max: durationUnit === 'min' ? 60 : 3600, step: 0.1 }}
                        sx={{ flex: 1 }}
                      />
                      <ToggleButtonGroup
                        value={durationUnit}
                        exclusive
                        onChange={(_, newUnit) => newUnit && setDurationUnit(newUnit)}
                        size="small"
                        sx={{ height: 40 }}
                      >
                        <ToggleButton value="sec" sx={{ px: 1.5 }}>
                          sec
                        </ToggleButton>
                        <ToggleButton value="min" sx={{ px: 1.5 }}>
                          min
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Box>
                  )}
                </Box>
              </Paper>
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: { xs: 1, sm: 2 } }} />

        {/* RPE Slider */}
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
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
            sx={{ mt: 1 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
              1 ({t('workout.rpeEasy')})
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
              10 ({t('workout.rpeMaxEffort')})
            </Typography>
          </Box>
        </Box>

        <TextField
          label={t('workout.notes')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          multiline
          rows={2}
          fullWidth
          size="small"
        />

        <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 2 }, justifyContent: 'flex-end', mt: 1 }}>
          <Button onClick={onCancel} sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!isValid()}
            sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
          >
            {t('common.save')}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};
