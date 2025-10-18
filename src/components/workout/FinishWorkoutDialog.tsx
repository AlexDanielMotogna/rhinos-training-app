import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Box,
  Typography,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';

interface FinishWorkoutDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (duration: number) => void;
  elapsedMinutes: number;
  estimatedMinutes: number;
  totalSets: number;
}

export const FinishWorkoutDialog: React.FC<FinishWorkoutDialogProps> = ({
  open,
  onClose,
  onConfirm,
  elapsedMinutes,
  estimatedMinutes,
  totalSets,
}) => {
  // Detect suspicious timing: elapsed < 10 min but > 5 sets
  const isSuspicious = elapsedMinutes < 10 && totalSets > 5;

  // Default duration: use estimated if suspicious, otherwise elapsed
  const defaultDuration = isSuspicious ? estimatedMinutes : elapsedMinutes;

  const [duration, setDuration] = useState(defaultDuration);
  const [error, setError] = useState('');

  // Update default when dialog opens
  useEffect(() => {
    if (open) {
      setDuration(defaultDuration);
      setError('');
    }
  }, [open, defaultDuration]);

  const handleConfirm = () => {
    if (!duration || duration <= 0) {
      setError('Duration must be greater than 0');
      return;
    }

    if (duration > 300) {
      setError('Duration seems too long. Maximum 5 hours (300 minutes)');
      return;
    }

    onConfirm(duration);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isSuspicious ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="warning" />
            <span>Finish Workout</span>
          </Box>
        ) : (
          'Finish Workout'
        )}
      </DialogTitle>

      <DialogContent>
        {isSuspicious && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              <strong>Only {elapsedMinutes} minute{elapsedMinutes !== 1 ? 's' : ''} have passed</strong>, but you logged <strong>{totalSets} sets</strong>.
            </Typography>
            <Typography variant="body2">
              Did you enter the data after your workout? If so, please enter the actual duration below.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Estimated duration:</strong> {estimatedMinutes} minutes
            </Typography>
          </Alert>
        )}

        {!isSuspicious && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Elapsed time: <strong>{elapsedMinutes} minutes</strong>
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              You can adjust this if needed (e.g., if you paused for a break).
            </Typography>
          </Alert>
        )}

        <TextField
          fullWidth
          label="Actual Workout Duration (minutes)"
          type="number"
          value={duration}
          onChange={(e) => {
            setDuration(Number(e.target.value));
            setError('');
          }}
          error={!!error}
          helperText={error || 'How long did your workout actually take?'}
          inputProps={{ min: 1, max: 300 }}
          autoFocus
          sx={{ mt: 1 }}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleConfirm} variant="contained" color="primary">
          Save Workout
        </Button>
      </DialogActions>
    </Dialog>
  );
};
