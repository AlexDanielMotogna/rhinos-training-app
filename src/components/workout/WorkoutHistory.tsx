import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useI18n } from '../../i18n/I18nProvider';
import type { WorkoutLog } from '../../services/workoutLog';

interface WorkoutHistoryProps {
  workouts: WorkoutLog[];
  onDelete?: (logId: string) => void;
  onEdit?: (workout: WorkoutLog) => void;
}

type DateFilter = 'all' | '7days' | '30days' | '90days';

export const WorkoutHistory: React.FC<WorkoutHistoryProps> = ({
  workouts,
  onDelete,
  onEdit,
}) => {
  const { t } = useI18n();
  const [dateFilter, setDateFilter] = useState<DateFilter>('30days');

  // Filter workouts by date range
  const filterWorkoutsByDate = (workouts: WorkoutLog[]): WorkoutLog[] => {
    if (dateFilter === 'all') return workouts;

    const now = new Date();
    const daysMap: Record<DateFilter, number> = {
      '7days': 7,
      '30days': 30,
      '90days': 90,
      'all': 0,
    };

    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - daysMap[dateFilter]);

    return workouts.filter(workout => {
      const workoutDate = new Date(workout.date);
      return workoutDate >= cutoffDate;
    });
  };

  const filteredWorkouts = filterWorkoutsByDate(workouts);

  // Group workouts by date
  const groupedByDate = filteredWorkouts.reduce((acc, workout) => {
    const date = workout.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(workout);
    return acc;
  }, {} as Record<string, WorkoutLog[]>);

  // Sort dates descending (newest first)
  const sortedDates = Object.keys(groupedByDate).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  if (workouts.length === 0) {
    return (
      <Alert severity="info">
        {t('workout.noWorkoutsYet')}
      </Alert>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return t('workout.today');
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t('workout.yesterday');
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  return (
    <Box>
      {/* Filter Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <FilterListIcon color="action" />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Time Period</InputLabel>
          <Select
            value={dateFilter}
            label="Time Period"
            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
          >
            <MenuItem value="7days">Last 7 Days</MenuItem>
            <MenuItem value="30days">Last 30 Days</MenuItem>
            <MenuItem value="90days">Last 90 Days</MenuItem>
            <MenuItem value="all">All Time</MenuItem>
          </Select>
        </FormControl>
        <Typography variant="body2" color="text.secondary">
          {filteredWorkouts.length} workout{filteredWorkouts.length !== 1 ? 's' : ''} found
        </Typography>
      </Box>

      {filteredWorkouts.length === 0 ? (
        <Alert severity="info">
          No workouts found in this time period. Try selecting a different filter.
        </Alert>
      ) : (
        sortedDates.map((date) => (
        <Box key={date} sx={{ mb: 4 }}>
          {/* Date Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <FitnessCenterIcon color="primary" />
            <Typography variant="h6" color="primary.main">
              {formatDate(date)}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              {groupedByDate[date].length} {groupedByDate[date].length === 1 ? 'workout' : 'workouts'}
            </Typography>
          </Box>

          {/* Workouts for this date */}
          {groupedByDate[date].map((workout) => (
            <Card key={workout.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                      <Chip
                        label={workout.source === 'coach' ? t('workout.coachPlan') : t('workout.freeSession')}
                        size="small"
                        color={workout.source === 'coach' ? 'primary' : 'secondary'}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(workout.createdAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                    </Box>

                    {/* Exercise entries */}
                    {workout.entries.map((entry, idx) => (
                      <Box key={idx} sx={{ mb: 1.5 }}>
                        <Typography variant="body1" fontWeight={600}>
                          {entry.name}
                        </Typography>

                        {/* Set-by-set data */}
                        {entry.setData && entry.setData.length > 0 ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                            {entry.setData.map((set, setIdx) => (
                              <Chip
                                key={setIdx}
                                label={
                                  `Set ${set.setNumber}: ` +
                                  (set.reps ? `${set.reps} reps` : '') +
                                  (set.reps && set.kg ? ' @ ' : '') +
                                  (set.kg ? `${set.kg}kg` : '') +
                                  (set.durationMin ? `${set.durationMin}min` : '')
                                }
                                size="small"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        ) : (
                          // Fallback for old format
                          <Typography variant="body2" color="text.secondary">
                            {entry.sets && entry.reps && `${entry.sets} × ${entry.reps}`}
                            {entry.kg && ` @ ${entry.kg}kg`}
                            {entry.durationMin && ` ${entry.durationMin}min`}
                          </Typography>
                        )}

                        {/* RPE */}
                        {entry.rpe && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            RPE: {entry.rpe}/10
                          </Typography>
                        )}

                        {/* Exercise notes */}
                        {entry.notes && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                            "{entry.notes}"
                          </Typography>
                        )}

                        {idx < workout.entries.length - 1 && <Divider sx={{ mt: 1.5 }} />}
                      </Box>
                    ))}

                    {/* Workout notes */}
                    {workout.notes && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        {workout.notes}
                      </Alert>
                    )}
                  </Box>

                  {/* Action buttons */}
                  <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                    {onEdit && (
                      <IconButton
                        size="small"
                        onClick={() => onEdit(workout)}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                    {onDelete && (
                      <IconButton
                        size="small"
                        onClick={() => onDelete(workout.id)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ))
      )}
    </Box>
  );
};
