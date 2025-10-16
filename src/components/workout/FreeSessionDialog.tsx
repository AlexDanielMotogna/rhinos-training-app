import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  Typography,
  IconButton,
  List,
  ListItem,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import type { WorkoutEntry, WorkoutPayload } from '../../types/workout';
import type { Exercise } from '../../types/exercise';
import { CatalogSearch } from './CatalogSearch';
import { WorkoutForm } from './WorkoutForm';
import { useI18n } from '../../i18n/I18nProvider';

interface FreeSessionDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (payload: WorkoutPayload) => void;
}

export const FreeSessionDialog: React.FC<FreeSessionDialogProps> = ({
  open,
  onClose,
  onSave,
}) => {
  const { t } = useI18n();
  const [entries, setEntries] = useState<WorkoutEntry[]>([]);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCatalog, setShowCatalog] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | undefined>();

  const handleAddFromCatalog = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowCatalog(false);
    setShowCustomForm(true);
  };

  const handleAddEntry = (entry: WorkoutEntry) => {
    setEntries([...entries, entry]);
    setShowCustomForm(false);
    setSelectedExercise(undefined);
  };

  const handleRemoveEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const payload: WorkoutPayload = {
      dateISO: date,
      entries,
      notes: notes || undefined,
      source: 'player',
    };
    onSave(payload);
    handleReset();
  };

  const handleReset = () => {
    setEntries([]);
    setNotes('');
    setDate(new Date().toISOString().split('T')[0]);
    setShowCatalog(false);
    setShowCustomForm(false);
    setSelectedExercise(undefined);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <>
      <Dialog open={open && !showCatalog && !showCustomForm} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{t('workout.addFreeSession')}</DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label={t('workout.date')}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1">{t('coach.exercises')}</Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => setShowCatalog(true)}
                  size="small"
                >
                  {t('workout.addFreeExercise')}
                </Button>
              </Box>

              {entries.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  {t('workout.noExercisesFound')}
                </Typography>
              ) : (
                <List>
                  {entries.map((entry, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                      }}
                      secondaryAction={
                        <IconButton edge="end" onClick={() => handleRemoveEntry(index)}>
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <Box>
                        <Typography variant="body1" fontWeight={500}>
                          {entry.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {entry.sets && entry.reps && `${entry.sets} × ${entry.reps}`}
                          {entry.kg && ` @ ${entry.kg}kg`}
                          {entry.durationSec && ` ${entry.durationSec}sec`}
                        </Typography>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>

            <TextField
              label={t('workout.notes')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={entries.length === 0}
          >
            {t('workout.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <CatalogSearch
        open={showCatalog}
        onClose={() => setShowCatalog(false)}
        onSelect={handleAddFromCatalog}
        onCreateCustom={() => {
          setShowCatalog(false);
          setShowCustomForm(true);
        }}
      />

      <Dialog open={showCustomForm} onClose={() => setShowCustomForm(false)} maxWidth="sm" fullWidth>
        <DialogContent>
          <WorkoutForm
            exercise={selectedExercise}
            onSave={handleAddEntry}
            onCancel={() => {
              setShowCustomForm(false);
              setSelectedExercise(undefined);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
