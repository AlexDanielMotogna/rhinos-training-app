import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Tooltip,
} from '@mui/material';
import { getUser } from '../services/mock';
import { getWorkoutLogsByUser } from '../services/workoutLog';

interface DayData {
  date: string;
  workouts: Array<{
    id: string;
    name?: string;
    completionPercentage: number;
    source: 'player' | 'coach';
  }>;
}

export const MyStats: React.FC = () => {
  const user = getUser();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get all workout logs for the user
  const workoutLogs = useMemo(() => {
    if (!user) return [];
    return getWorkoutLogsByUser(user.id);
  }, [user]);

  // Generate calendar data for current month
  const calendarData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

    // Create map of workouts by date
    const workoutsByDate = new Map<string, DayData['workouts']>();

    workoutLogs.forEach(log => {
      const logDate = log.date;

      // Calculate completion percentage based on sets completed vs target sets
      let totalTargetSets = 0;
      let completedSets = 0;

      log.entries.forEach(entry => {
        const targetSets = entry.sets || 0;
        const loggedSets = entry.setData?.length || 0;

        totalTargetSets += targetSets;
        completedSets += loggedSets;
      });

      const completionPercentage = totalTargetSets > 0
        ? Math.round((completedSets / totalTargetSets) * 100)
        : 0;

      if (!workoutsByDate.has(logDate)) {
        workoutsByDate.set(logDate, []);
      }

      workoutsByDate.get(logDate)!.push({
        id: log.id,
        name: log.planName || (log.source === 'coach' ? 'Team Session' : 'Free Session'),
        completionPercentage,
        source: log.source,
      });
    });

    // Generate calendar grid
    const calendar: (DayData | null)[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      calendar.push(null);
    }

    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const workouts = workoutsByDate.get(dateStr) || [];

      calendar.push({
        date: dateStr,
        workouts,
      });
    }

    return calendar;
  }, [currentMonth, workoutLogs]);

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 90) return '#4caf50'; // Green
    if (percentage >= 70) return '#8bc34a'; // Light green
    if (percentage >= 50) return '#ffc107'; // Yellow
    if (percentage >= 30) return '#ff9800'; // Orange
    return '#f44336'; // Red
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        My Stats
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            Training Calendar
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Chip label="← Previous" onClick={goToPreviousMonth} clickable />
            <Typography variant="h6" sx={{ minWidth: 150, textAlign: 'center' }}>
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Typography>
            <Chip label="Next →" onClick={goToNextMonth} clickable />
          </Box>
        </Box>

        {/* Calendar Grid */}
        <Box sx={{ mb: 3 }}>
          {/* Week day headers */}
          <Grid container spacing={1} sx={{ mb: 1 }}>
            {weekDays.map(day => (
              <Grid item xs={12 / 7} key={day}>
                <Typography variant="caption" fontWeight={600} textAlign="center" display="block">
                  {day}
                </Typography>
              </Grid>
            ))}
          </Grid>

          {/* Calendar days */}
          <Grid container spacing={1}>
            {calendarData.map((dayData, index) => {
              if (!dayData) {
                return (
                  <Grid item xs={12 / 7} key={`empty-${index}`}>
                    <Box sx={{ height: 100 }} />
                  </Grid>
                );
              }

              const dayNumber = new Date(dayData.date).getDate();
              const hasWorkouts = dayData.workouts.length > 0;
              const avgCompletion = hasWorkouts
                ? Math.round(
                    dayData.workouts.reduce((sum, w) => sum + w.completionPercentage, 0) /
                      dayData.workouts.length
                  )
                : 0;

              return (
                <Grid item xs={12 / 7} key={dayData.date}>
                  <Tooltip
                    title={
                      hasWorkouts ? (
                        <Box>
                          {dayData.workouts.map((workout, idx) => (
                            <Box key={idx} sx={{ mb: 0.5 }}>
                              <Typography variant="caption">
                                {workout.name}: {workout.completionPercentage}%
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        'No workouts'
                      )
                    }
                    arrow
                  >
                    <Card
                      sx={{
                        height: 100,
                        cursor: hasWorkouts ? 'pointer' : 'default',
                        border: hasWorkouts ? 2 : 1,
                        borderColor: hasWorkouts ? getCompletionColor(avgCompletion) : 'divider',
                        backgroundColor: hasWorkouts
                          ? `${getCompletionColor(avgCompletion)}15`
                          : 'background.paper',
                        transition: 'all 0.2s',
                        '&:hover': hasWorkouts
                          ? {
                              transform: 'scale(1.05)',
                              boxShadow: 3,
                            }
                          : {},
                      }}
                    >
                      <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                        <Typography variant="body2" fontWeight={600}>
                          {dayNumber}
                        </Typography>
                        {hasWorkouts && (
                          <Box sx={{ mt: 1 }}>
                            <Chip
                              label={`${avgCompletion}%`}
                              size="small"
                              sx={{
                                backgroundColor: getCompletionColor(avgCompletion),
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '0.7rem',
                              }}
                            />
                            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                              {dayData.workouts.length} workout{dayData.workouts.length > 1 ? 's' : ''}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Tooltip>
                </Grid>
              );
            })}
          </Grid>
        </Box>

        {/* Legend */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Chip label="90-100% Complete" sx={{ backgroundColor: '#4caf50', color: 'white' }} />
          <Chip label="70-89% Complete" sx={{ backgroundColor: '#8bc34a', color: 'white' }} />
          <Chip label="50-69% Complete" sx={{ backgroundColor: '#ffc107', color: 'white' }} />
          <Chip label="30-49% Complete" sx={{ backgroundColor: '#ff9800', color: 'white' }} />
          <Chip label="0-29% Complete" sx={{ backgroundColor: '#f44336', color: 'white' }} />
        </Box>
      </Paper>

      {/* Quick Stats */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Workouts
              </Typography>
              <Typography variant="h3" color="primary">
                {workoutLogs.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                This Month
              </Typography>
              <Typography variant="h3" color="primary">
                {
                  workoutLogs.filter(log => {
                    const logDate = new Date(log.date);
                    return (
                      logDate.getMonth() === currentMonth.getMonth() &&
                      logDate.getFullYear() === currentMonth.getFullYear()
                    );
                  }).length
                }
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Avg Completion
              </Typography>
              <Typography variant="h3" color="primary">
                {workoutLogs.length > 0
                  ? Math.round(
                      workoutLogs.reduce((sum, log) => {
                        let totalTargetSets = 0;
                        let completedSets = 0;

                        log.entries.forEach(entry => {
                          totalTargetSets += entry.sets || 0;
                          completedSets += entry.setData?.length || 0;
                        });

                        return sum + (totalTargetSets > 0 ? (completedSets / totalTargetSets) * 100 : 0);
                      }, 0) / workoutLogs.length
                    )
                  : 0}
                %
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
