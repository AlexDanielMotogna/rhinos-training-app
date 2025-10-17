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
  ToggleButtonGroup,
  ToggleButton,
  Badge,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import FilterListIcon from '@mui/icons-material/FilterList';
import ViewListIcon from '@mui/icons-material/ViewList';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useI18n } from '../../i18n/I18nProvider';
import type { WorkoutLog } from '../../services/workoutLog';

interface WorkoutHistoryProps {
  workouts: WorkoutLog[];
  onDelete?: (logId: string) => void;
  onEdit?: (workout: WorkoutLog) => void;
}

type DateFilter = 'today' | '7days' | '30days' | '90days' | 'all';
type ViewMode = 'list' | 'calendar';

export const WorkoutHistory: React.FC<WorkoutHistoryProps> = ({
  workouts,
  onDelete,
  onEdit,
}) => {
  const { t } = useI18n();
  const [dateFilter, setDateFilter] = useState<DateFilter>('30days');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

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

  // Generate calendar view
  const generateCalendarView = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Get first day of month and total days
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

    // Create workout map by date
    const workoutsByDate: Record<string, WorkoutLog[]> = {};
    filteredWorkouts.forEach(workout => {
      const dateKey = workout.date;
      if (!workoutsByDate[dateKey]) {
        workoutsByDate[dateKey] = [];
      }
      workoutsByDate[dateKey].push(workout);
    });

    // Generate calendar grid
    const weeks: JSX.Element[] = [];
    let days: JSX.Element[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <Box key={`empty-${i}`} sx={{ aspectRatio: '1', border: '1px solid', borderColor: 'divider' }} />
      );
    }

    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = date.toISOString().split('T')[0];
      const dayWorkouts = workoutsByDate[dateStr] || [];
      const isToday = date.toDateString() === today.toDateString();

      days.push(
        <Box
          key={day}
          sx={{
            aspectRatio: '1',
            border: '1px solid',
            borderColor: isToday ? 'primary.main' : 'divider',
            borderWidth: isToday ? 2 : 1,
            p: 0.5,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: isToday ? 'primary.50' : 'background.paper',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.7rem',
              fontWeight: isToday ? 700 : 400,
              color: isToday ? 'primary.main' : 'text.primary',
            }}
          >
            {day}
          </Typography>

          {dayWorkouts.length > 0 && (
            <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              {dayWorkouts.slice(0, 2).map((workout, idx) => (
                <Box
                  key={idx}
                  sx={{
                    width: '100%',
                    height: 4,
                    backgroundColor: workout.source === 'coach' ? 'primary.main' : 'secondary.main',
                    borderRadius: 0.5,
                  }}
                />
              ))}
              {dayWorkouts.length > 2 && (
                <Typography variant="caption" sx={{ fontSize: '0.6rem', textAlign: 'center' }}>
                  +{dayWorkouts.length - 2}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      );

      // Start new week
      if ((startingDayOfWeek + day) % 7 === 0) {
        weeks.push(
          <Box key={`week-${weeks.length}`} sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0 }}>
            {days}
          </Box>
        );
        days = [];
      }
    }

    // Add remaining days
    if (days.length > 0) {
      while (days.length < 7) {
        days.push(
          <Box key={`empty-end-${days.length}`} sx={{ aspectRatio: '1', border: '1px solid', borderColor: 'divider' }} />
        );
      }
      weeks.push(
        <Box key={`week-${weeks.length}`} sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0 }}>
          {days}
        </Box>
      );
    }

    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
          {today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Typography>

        {/* Day headers */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0, mb: 1 }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <Typography
              key={day}
              variant="caption"
              sx={{
                textAlign: 'center',
                fontWeight: 600,
                fontSize: '0.7rem',
                color: 'text.secondary',
              }}
            >
              {day}
            </Typography>
          ))}
        </Box>

        {/* Calendar grid */}
        <Box sx={{ mb: 2 }}>
          {weeks}
        </Box>

        {/* Legend */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 16, height: 4, backgroundColor: 'primary.main', borderRadius: 0.5 }} />
            <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>Coach Plan</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 16, height: 4, backgroundColor: 'secondary.main', borderRadius: 0.5 }} />
            <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>Free Session</Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Box>
      {/* Filter Controls - Mobile Optimized */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        {/* View Mode Toggle */}
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, newMode) => newMode && setViewMode(newMode)}
          size="small"
          sx={{ height: 40 }}
        >
          <ToggleButton value="list" aria-label="list view">
            <ViewListIcon sx={{ fontSize: '1.1rem' }} />
          </ToggleButton>
          <ToggleButton value="calendar" aria-label="calendar view">
            <CalendarMonthIcon sx={{ fontSize: '1.1rem' }} />
          </ToggleButton>
        </ToggleButtonGroup>

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
      ) : viewMode === 'calendar' ? (
        generateCalendarView()
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
                {/* Header with date, chip and time */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1 }}>
                    {/* Date and time */}
                    <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'text.primary' }}>
                      {new Date(workout.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })} at {new Date(workout.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography>

                    {/* Chips */}
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
                    </Box>
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

                {/* Exercise entries - User-friendly layout */}
                <Box>
                  {workout.entries.map((entry, idx) => (
                    <Box key={idx} sx={{ mb: 1.5 }}>
                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.9rem', mb: 0.5 }}>
                        {entry.name}
                      </Typography>

                      {/* Set-by-set data - User-friendly format */}
                      {entry.setData && entry.setData.length > 0 ? (
                        <Box sx={{ pl: 1 }}>
                          {/* Summary line */}
                          <Typography variant="body2" sx={{ fontSize: '0.85rem', mb: 0.5, color: 'text.primary' }}>
                            {entry.setData.length} {entry.setData.length === 1 ? 'set' : 'sets'}
                            {entry.setData[0]?.reps && ` × ${entry.setData[0].reps} reps`}
                            {entry.setData[0]?.kg && ` with ${entry.setData[0].kg}kg`}
                          </Typography>

                          {/* Individual sets in readable format */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                            {entry.setData.map((set, setIdx) => (
                              <Typography
                                key={setIdx}
                                variant="caption"
                                sx={{
                                  fontSize: '0.75rem',
                                  color: 'text.secondary',
                                  fontFamily: 'monospace'
                                }}
                              >
                                Set {set.setNumber}:{' '}
                                {set.reps && `${set.reps} reps`}
                                {set.reps && set.kg && ' × '}
                                {set.kg && `${set.kg}kg`}
                                {set.durationSec && `${set.durationSec} seconds`}
                              </Typography>
                            ))}
                          </Box>
                        </Box>
                      ) : (
                        // Fallback for old format
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', pl: 1 }}>
                          {entry.sets && entry.reps && `${entry.sets} sets × ${entry.reps} reps`}
                          {entry.kg && ` with ${entry.kg}kg`}
                          {entry.durationSec && ` for ${entry.durationSec} seconds`}
                        </Typography>
                      )}

                      {/* RPE - User-friendly */}
                      {entry.rpe && (
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontSize: '0.75rem', pl: 1, color: 'text.secondary' }}>
                          Effort: {entry.rpe}/10 {entry.rpe >= 8 ? '(Hard)' : entry.rpe >= 6 ? '(Moderate)' : '(Easy)'}
                        </Typography>
                      )}

                      {/* Exercise notes */}
                      {entry.notes && (
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontSize: '0.75rem', pl: 1, color: 'text.secondary', fontStyle: 'italic' }}>
                          Note: {entry.notes}
                        </Typography>
                      )}

                      {idx < workout.entries.length - 1 && <Divider sx={{ mt: 1, mb: 0.5 }} />}
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
