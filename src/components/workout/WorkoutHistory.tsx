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

type DateFilter = 'today' | '7days' | '30days' | '90days' | 'all';

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
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (dateFilter === 'today') {
      return workouts.filter(workout => {
        const workoutDate = new Date(workout.date);
        const workoutDay = new Date(workoutDate.getFullYear(), workoutDate.getMonth(), workoutDate.getDate());
        return workoutDay.getTime() === today.getTime();
      });
    }

    const daysMap: Record<Exclude<DateFilter, 'today' | 'all'>, number> = {
      '7days': 7,
      '30days': 30,
      '90days': 90,
    };

    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - daysMap[dateFilter as keyof typeof daysMap]);

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
      {/* Filter Controls - Mobile Optimized */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <FilterListIcon color="action" sx={{ fontSize: '1.2rem' }} />
        <FormControl size="small" sx={{ minWidth: 150, flex: 1, maxWidth: 200 }}>
          <InputLabel sx={{ fontSize: '0.85rem' }}>Time Period</InputLabel>
          <Select
            value={dateFilter}
            label="Time Period"
            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
            sx={{ fontSize: '0.85rem' }}
          >
            <MenuItem value="today" sx={{ fontSize: '0.85rem' }}>Today</MenuItem>
            <MenuItem value="7days" sx={{ fontSize: '0.85rem' }}>Last 7 Days</MenuItem>
            <MenuItem value="30days" sx={{ fontSize: '0.85rem' }}>Last 30 Days</MenuItem>
            <MenuItem value="90days" sx={{ fontSize: '0.85rem' }}>Last 90 Days</MenuItem>
            <MenuItem value="all" sx={{ fontSize: '0.85rem' }}>All Time</MenuItem>
          </Select>
        </FormControl>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
          {filteredWorkouts.length} workout{filteredWorkouts.length !== 1 ? 's' : ''} found
        </Typography>
      </Box>

      {filteredWorkouts.length === 0 ? (
        <Alert severity="info">
          No workouts found in this time period. Try selecting a different filter.
        </Alert>
      ) : (
        sortedDates.map((date) => (
        <Box key={date} sx={{ mb: 3 }}>
          {/* Date Header - Mobile Optimized */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
            <FitnessCenterIcon color="primary" sx={{ fontSize: '1.2rem' }} />
            <Typography variant="h6" color="primary.main" sx={{ fontSize: '1rem', fontWeight: 600 }}>
              {formatDate(date)}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5, fontSize: '0.75rem' }}>
              {groupedByDate[date].length} {groupedByDate[date].length === 1 ? 'workout' : 'workouts'}
            </Typography>
          </Box>

          {/* Workouts for this date - Mobile Optimized */}
          {groupedByDate[date].map((workout) => (
            <Card key={workout.id} sx={{ mb: 1.5 }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                {/* Header with chip and time */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Chip
                      label={workout.source === 'coach' ? t('workout.coachPlan') : t('workout.freeSession')}
                      size="small"
                      color={workout.source === 'coach' ? 'primary' : 'secondary'}
                      sx={{ height: 22, fontSize: '0.7rem' }}
                    />
                    {workout.completionPercentage !== undefined && (
                      <Chip
                        label={`${workout.completionPercentage}% completed`}
                        size="small"
                        color={
                          workout.completionPercentage >= 70 ? 'success' :
                          workout.completionPercentage >= 40 ? 'warning' : 'error'
                        }
                        sx={{ height: 22, fontSize: '0.7rem' }}
                      />
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      {new Date(workout.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography>
                  </Box>

                  {/* Action buttons - Compact */}
                  <Box sx={{ display: 'flex', gap: 0.25 }}>
                    {onEdit && (
                      <IconButton
                        size="small"
                        onClick={() => onEdit(workout)}
                        color="primary"
                        sx={{ padding: 0.5 }}
                      >
                        <EditIcon sx={{ fontSize: '1rem' }} />
                      </IconButton>
                    )}
                    {onDelete && (
                      <IconButton
                        size="small"
                        onClick={() => onDelete(workout.id)}
                        color="error"
                        sx={{ padding: 0.5 }}
                      >
                        <DeleteIcon sx={{ fontSize: '1rem' }} />
                      </IconButton>
                    )}
                  </Box>
                </Box>

                {/* Exercise entries - Compact layout */}
                <Box>
                  {workout.entries.map((entry, idx) => (
                    <Box key={idx} sx={{ mb: 1 }}>
                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.85rem', mb: 0.25 }}>
                        {entry.name}
                      </Typography>

                      {/* Set-by-set data - Compact chips */}
                      {entry.setData && entry.setData.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.25 }}>
                          {entry.setData.map((set, setIdx) => (
                            <Chip
                              key={setIdx}
                              label={
                                `S${set.setNumber}: ` +
                                (set.reps ? `${set.reps}r` : '') +
                                (set.reps && set.kg ? ' @ ' : '') +
                                (set.kg ? `${set.kg}kg` : '') +
                                (set.durationSec ? `${set.durationSec}s` : '')
                              }
                              size="small"
                              variant="outlined"
                              sx={{
                                height: 20,
                                fontSize: '0.7rem',
                                '& .MuiChip-label': { px: 0.75, py: 0 }
                              }}
                            />
                          ))}
                        </Box>
                      ) : (
                        // Fallback for old format
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          {entry.sets && entry.reps && `${entry.sets} × ${entry.reps}`}
                          {entry.kg && ` @ ${entry.kg}kg`}
                          {entry.durationSec && ` ${entry.durationSec}sec`}
                        </Typography>
                      )}

                      {/* RPE - Compact */}
                      {entry.rpe && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, fontSize: '0.7rem' }}>
                          RPE: {entry.rpe}/10
                        </Typography>
                      )}

                      {/* Exercise notes - Compact */}
                      {entry.notes && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, fontSize: '0.7rem', fontStyle: 'italic' }}>
                          "{entry.notes}"
                        </Typography>
                      )}

                      {idx < workout.entries.length - 1 && <Divider sx={{ mt: 0.75, mb: 0.5 }} />}
                    </Box>
                  ))}
                </Box>

                {/* Workout notes - Compact */}
                {workout.notes && (
                  <Alert severity="info" sx={{ mt: 1, py: 0.5, fontSize: '0.75rem' }}>
                    {workout.notes}
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      ))
      )}
    </Box>
  );
};
