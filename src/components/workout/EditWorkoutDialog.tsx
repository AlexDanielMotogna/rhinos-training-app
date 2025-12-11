import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
} from '@mui/material';
import { useI18n } from '../../i18n/I18nProvider';
import { WorkoutForm } from './WorkoutForm';
import type { WorkoutLog } from '../../services/workoutLog';
import type { WorkoutEntry } from '../../types/workout';

interface EditWorkoutDialogProps {
  open: boolean;
  workout: WorkoutLog | null;
  onClose: () => void;
  onSave: (workoutId: string, entries: WorkoutEntry[], notes?: string, date?: string) => void;
}

export const EditWorkoutDialog: React.FC<EditWorkoutDialogProps> = ({
  open,
  workout,
  onClose,
  onSave,
}) => {
  const { t } = useI18n();
  const [editedEntries, setEditedEntries] = useState<WorkoutEntry[]>([]);
  const [editedNotes, setEditedNotes] = useState('');
  const [editedDate, setEditedDate] = useState('');
  const [currentEditIndex, setCurrentEditIndex] = useState<number | null>(null);

  React.useEffect(() => {
    if (workout) {
      setEditedEntries(workout.entries);
      setEditedNotes(workout.notes || '');
      setEditedDate(workout.date);
      setCurrentEditIndex(null);
    }
  }, [workout]);

  if (!workout) return null;

  const handleSaveEntry = (updatedEntry: WorkoutEntry) => {
    if (currentEditIndex !== null) {
      const newEntries = [...editedEntries];
      newEntries[currentEditIndex] = updatedEntry;
      setEditedEntries(newEntries);
      setCurrentEditIndex(null);
    }
  };

  const handleSave = () => {
    onSave(workout.id, editedEntries, editedNotes || undefined, editedDate);
    onClose();
  };

  return (
    <>
      <Dialog open={open && currentEditIndex === null} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {t('workout.editWorkout')}
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {/* Workout date selector */}
            <TextField
              label={t('workout.workoutDate')}
              type="date"
              value={editedDate}
              onChange={(e) => setEditedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            {/* List of exercises */}
            <Box>
              {editedEntries.map((entry, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box>
                    <strong>{entry.name}</strong>
                    <br />
                    <small>
                      {entry.setData?.length || 0} sets •  RPE: {entry.rpe}/10
                    </small>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setCurrentEditIndex(index)}
                  >
                    {t('common.edit')}
                  </Button>
                </Box>
              ))}
            </Box>

            {/* Workout notes */}
            <TextField
              label={t('workout.notes')}
              value={editedNotes}
              onChange={(e) => setEditedNotes(e.target.value)}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSave}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit individual exercise dialog */}
      {currentEditIndex !== null && (
        <Dialog open onClose={() => setCurrentEditIndex(null)} maxWidth="sm" fullWidth>
          <DialogContent>
            <WorkoutForm
              exercise={
                editedEntries[currentEditIndex].exerciseId
                  ? {
                      id: editedEntries[currentEditIndex].exerciseId!,
                      name: editedEntries[currentEditIndex].name,
                      category: editedEntries[currentEditIndex].category,
                      youtubeUrl: editedEntries[currentEditIndex].youtubeUrl,
                      isGlobal: false,
                    }
                  : undefined
              }
              onSave={handleSaveEntry}
              onCancel={() => setCurrentEditIndex(null)}
              initialData={editedEntries[currentEditIndex]}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
