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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { getUser } from '../services/mock';
import { getWorkoutLogsByUser } from '../services/workoutLog';
import { useI18n } from '../i18n/I18nProvider';

interface DayData {
  date: string;
  workouts: Array<{
    id: string;
    name?: string;
    completionPercentage: number;
    source: 'player' | 'coach';
  }>;
}

type StatsFilter = 'all' | 'currentMonth' | 'last30days' | 'last90days' | 'last6months' | 'lastYear';

export const MyStats: React.FC = () => {
  const { t, locale } = useI18n();
  const user = getUser();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [statsFilter, setStatsFilter] = useState<StatsFilter>('currentMonth');

  // Get all workout logs for the user (including deleted ones for stats accuracy)
  const allWorkoutLogs = useMemo(() => {
    if (!user) return [];
    return getWorkoutLogsByUser(user.id, true); // includeDeleted = true for stats
  }, [user]);

  // Filter workout logs based on selected time period for stats
  const workoutLogs = useMemo(() => {
    if (statsFilter === 'all') {
      return allWorkoutLogs;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let cutoffDate: Date;

    switch (statsFilter) {
      case 'currentMonth':
        // Filter for current calendar month shown in calendar
        return allWorkoutLogs.filter(log => {
          const logDate = new Date(log.date);
          return (
            logDate.getMonth() === currentMonth.getMonth() &&
            logDate.getFullYear() === currentMonth.getFullYear()
          );
        });

      case 'last30days':
        cutoffDate = new Date(today);
        cutoffDate.setDate(cutoffDate.getDate() - 30);
        break;

      case 'last90days':
        cutoffDate = new Date(today);
        cutoffDate.setDate(cutoffDate.getDate() - 90);
        break;

      case 'last6months':
        cutoffDate = new Date(today);
        cutoffDate.setMonth(cutoffDate.getMonth() - 6);
        break;

      case 'lastYear':
        cutoffDate = new Date(today);
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
        break;

      default:
        return allWorkoutLogs;
    }

    return allWorkoutLogs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= cutoffDate;
    });
  }, [allWorkoutLogs, statsFilter, currentMonth]);

  // Generate calendar data for current month (always use all logs for calendar display)
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

    allWorkoutLogs.forEach(log => {
      const logDate = log.date;

      // Use saved completion percentage if available (new workouts), otherwise calculate (old workouts)
      let completionPercentage = 0;

      if (log.completionPercentage !== undefined) {
        completionPercentage = log.completionPercentage;
      } else {
        // Fallback calculation for old workouts without saved completion percentage
        let completedSets = 0;

        // Count total completed sets across all entries
        log.entries.forEach(entry => {
          completedSets += entry.setData?.length || 0;
        });

        // Use planMetadata if available, otherwise calculate from entries
        const totalTargetSets = log.planMetadata?.totalTargetSets ||
                                log.entries.reduce((sum, entry) => sum + (entry.sets || 0), 0);

        completionPercentage = totalTargetSets > 0
          ? Math.round((completedSets / totalTargetSets) * 100)
          : 0;
      }

      if (!workoutsByDate.has(logDate)) {
        workoutsByDate.set(logDate, []);
      }

      workoutsByDate.get(logDate)!.push({
        id: log.id,
        name: log.planName || (log.source === 'coach' ? t('training.teamSessions') : t('training.freeSessions')),
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
  }, [currentMonth, allWorkoutLogs, t]);

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
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Typography variant="h4" gutterBottom sx={{ px: 1 }}>
        {t('stats.title')}
      </Typography>

      <Paper sx={{ p: { xs: 1, sm: 2, md: 3 }, mb: 3 }}>
        {/* Calendar Header - Mobile Optimized */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 1, px: 1 }}>
            {t('stats.calendar')}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1 }}>
            <Chip
              label="←"
              onClick={goToPreviousMonth}
              clickable
              size="small"
              sx={{ minWidth: 40 }}
            />
            <Typography variant="body1" fontWeight={600} sx={{ textAlign: 'center' }}>
              {currentMonth.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', { month: 'long', year: 'numeric' })}
            </Typography>
            <Chip
              label="→"
              onClick={goToNextMonth}
              clickable
              size="small"
              sx={{ minWidth: 40 }}
            />
          </Box>
        </Box>

        {/* Calendar Grid - Mobile Optimized */}
        <Box sx={{ mb: 2 }}>
          {/* Week day headers */}
          <Grid container spacing={{ xs: 0.5, sm: 1 }} sx={{ mb: 0.5 }}>
            {weekDays.map(day => (
              <Grid item xs={12 / 7} key={day}>
                <Typography
                  variant="caption"
                  fontWeight={600}
                  textAlign="center"
                  display="block"
                  sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                >
                  {day}
                </Typography>
              </Grid>
            ))}
          </Grid>

          {/* Calendar days - Mobile Optimized */}
          <Grid container spacing={{ xs: 0.5, sm: 1 }}>
            {calendarData.map((dayData, index) => {
              if (!dayData) {
                return (
                  <Grid item xs={12 / 7} key={`empty-${index}`}>
                    <Box sx={{ height: { xs: 60, sm: 80, md: 100 } }} />
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
                        t('stats.noWorkouts')
                      )
                    }
                    arrow
                  >
                    <Card
                      sx={{
                        height: { xs: 60, sm: 80, md: 100 },
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
                      <CardContent
                        sx={{
                          p: { xs: 0.5, sm: 1 },
                          '&:last-child': { pb: { xs: 0.5, sm: 1 } },
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
                        >
                          {dayNumber}
                        </Typography>
                        {hasWorkouts && (
                          <Box sx={{ mt: 'auto' }}>
                            <Chip
                              label={`${avgCompletion}%`}
                              size="small"
                              sx={{
                                backgroundColor: getCompletionColor(avgCompletion),
                                color: 'white',
                                fontWeight: 600,
                                fontSize: { xs: '0.6rem', sm: '0.7rem' },
                                height: { xs: 16, sm: 20 },
                                '& .MuiChip-label': { px: { xs: 0.5, sm: 1 } },
                              }}
                            />
                            <Typography
                              variant="caption"
                              display="block"
                              sx={{
                                mt: 0.5,
                                fontSize: { xs: '0.55rem', sm: '0.65rem' },
                                display: { xs: 'none', sm: 'block' },
                              }}
                            >
                              {dayData.workouts.length} {dayData.workouts.length === 1 ? t('stats.workout') : t('stats.workouts')}
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

        {/* Legend - Mobile Optimized */}
        <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap', justifyContent: 'center', px: 1 }}>
          <Chip
            label={t('stats.legend.complete90')}
            size="small"
            sx={{
              backgroundColor: '#4caf50',
              color: 'white',
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
              height: { xs: 20, sm: 24 }
            }}
          />
          <Chip
            label={t('stats.legend.complete70')}
            size="small"
            sx={{
              backgroundColor: '#8bc34a',
              color: 'white',
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
              height: { xs: 20, sm: 24 }
            }}
          />
          <Chip
            label={t('stats.legend.complete50')}
            size="small"
            sx={{
              backgroundColor: '#ffc107',
              color: 'white',
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
              height: { xs: 20, sm: 24 }
            }}
          />
          <Chip
            label={t('stats.legend.complete30')}
            size="small"
            sx={{
              backgroundColor: '#ff9800',
              color: 'white',
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
              height: { xs: 20, sm: 24 }
            }}
          />
          <Chip
            label={t('stats.legend.complete0')}
            size="small"
            sx={{
              backgroundColor: '#f44336',
              color: 'white',
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
              height: { xs: 20, sm: 24 }
            }}
          />
        </Box>
      </Paper>

      {/* Stats Filter */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
          {t('stats.statistics')}
        </Typography>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>{t('stats.filterPeriod')}</InputLabel>
          <Select
            value={statsFilter}
            label={t('stats.filterPeriod')}
            onChange={(e) => setStatsFilter(e.target.value as StatsFilter)}
          >
            <MenuItem value="currentMonth">{t('stats.filter.currentMonth')}</MenuItem>
            <MenuItem value="last30days">{t('stats.filter.last30days')}</MenuItem>
            <MenuItem value="last90days">{t('stats.filter.last90days')}</MenuItem>
            <MenuItem value="last6months">{t('stats.filter.last6months')}</MenuItem>
            <MenuItem value="lastYear">{t('stats.filter.lastYear')}</MenuItem>
            <MenuItem value="all">{t('stats.filter.all')}</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Quick Stats - Mobile Optimized */}
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Total Workouts */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 }, '&:last-child': { pb: { xs: 2, sm: 3 } } }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                {t('stats.totalWorkouts')}
              </Typography>
              <Typography variant="h3" color="primary" sx={{ fontSize: { xs: '2rem', sm: '3rem' } }}>
                {workoutLogs.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Team Workouts */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 }, '&:last-child': { pb: { xs: 2, sm: 3 } } }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                {t('stats.teamWorkouts')}
              </Typography>
              <Typography variant="h3" color="primary" sx={{ fontSize: { xs: '2rem', sm: '3rem' } }}>
                {workoutLogs.filter(log => log.source === 'coach').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Free Workouts */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 }, '&:last-child': { pb: { xs: 2, sm: 3 } } }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                {t('stats.freeWorkouts')}
              </Typography>
              <Typography variant="h3" color="secondary" sx={{ fontSize: { xs: '2rem', sm: '3rem' } }}>
                {workoutLogs.filter(log => log.source === 'player').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Average Completion */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 }, '&:last-child': { pb: { xs: 2, sm: 3 } } }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                {t('stats.avgCompletion')}
              </Typography>
              <Typography variant="h3" color="primary" sx={{ fontSize: { xs: '2rem', sm: '3rem' } }}>
                {workoutLogs.length > 0
                  ? Math.round(
                      workoutLogs.reduce((sum, log) => {
                        // Use saved completion percentage if available
                        if (log.completionPercentage !== undefined) {
                          return sum + log.completionPercentage;
                        }

                        // Fallback calculation for old workouts
                        let completedSets = 0;
                        log.entries.forEach(entry => {
                          completedSets += entry.setData?.length || 0;
                        });

                        const totalTargetSets = log.planMetadata?.totalTargetSets ||
                                                log.entries.reduce((s, entry) => s + (entry.sets || 0), 0);

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
