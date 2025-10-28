import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Divider,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { getUser } from '../services/userProfile';
import { getWorkoutLogsByUser } from '../services/workoutLog';
import { getYouTubeThumbnail } from '../services/yt';
import { useI18n } from '../i18n/I18nProvider';
import type { WorkoutLog } from '../services/workoutLog';
import CardMedia from '@mui/material/CardMedia';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { getUpcomingSessions } from '../services/trainingSessions';
import { workoutTypeColors } from '../theme';

interface DayData {
  date: string;
  workouts: Array<{
    id: string;
    name?: string;
    completionPercentage: number;
    source: 'player' | 'coach';
  }>;
  sessions: Array<{
    id: string;
    title: string;
    time: string;
    location: string;
    sessionCategory: 'team' | 'private';
  }>;
}

export const MyStats: React.FC = () => {
  const { t, locale } = useI18n();
  const user = getUser();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedWorkouts, setSelectedWorkouts] = useState<WorkoutLog[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<DayData['sessions']>([]);

  // Get all workout logs for the user
  const allWorkoutLogs = useMemo(() => {
    if (!user) return [];
    return getWorkoutLogsByUser(user.id, true); // includeDeleted = true
  }, [user]);

  // Get all training sessions (team + private)
  const [allSessions, setAllSessions] = useState<any[]>([]);

  useEffect(() => {
    const loadSessions = async () => {
      const sessions = await getUpcomingSessions();
      setAllSessions(sessions);
    };
    loadSessions();
  }, []);

  // Generate calendar data for current month
  const calendarData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const workoutsByDate = new Map<string, DayData['workouts']>();
    const sessionsByDate = new Map<string, DayData['sessions']>();

    // Process workouts
    allWorkoutLogs.forEach(log => {
      const logDate = log.date;
      let completionPercentage = 0;

      if (log.completionPercentage !== undefined) {
        completionPercentage = log.completionPercentage;
      } else {
        let completedSets = 0;
        log.entries.forEach(entry => {
          completedSets += entry.setData?.length || 0;
        });
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

    // Process training sessions
    allSessions.forEach(session => {
      const sessionDate = session.date;

      if (!sessionsByDate.has(sessionDate)) {
        sessionsByDate.set(sessionDate, []);
      }

      sessionsByDate.get(sessionDate)!.push({
        id: session.id,
        title: session.title,
        time: session.time,
        location: session.location,
        sessionCategory: session.sessionCategory,
      });
    });

    const calendar: (DayData | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      calendar.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const workouts = workoutsByDate.get(dateStr) || [];
      const sessions = sessionsByDate.get(dateStr) || [];
      calendar.push({ date: dateStr, workouts, sessions });
    }

    return calendar;
  }, [currentMonth, allWorkoutLogs, allSessions, t]);

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const getWorkoutTypeColor = (source: 'player' | 'coach') => {
    return source === 'coach' ? workoutTypeColors.coach : workoutTypeColors.player;
  };

  const handleDayClick = (date: string) => {
    const workoutsForDate = allWorkoutLogs.filter(log => log.date === date);
    const sessionsForDate = allSessions.filter(session => session.date === date);

    if (workoutsForDate.length > 0 || sessionsForDate.length > 0) {
      setSelectedDate(date);
      setSelectedWorkouts(workoutsForDate);
      setSelectedSessions(sessionsForDate.map(s => ({
        id: s.id,
        title: s.title,
        time: s.time,
        location: s.location,
        sessionCategory: s.sessionCategory,
      })));
    }
  };

  const handleCloseModal = () => {
    setSelectedDate(null);
    setSelectedWorkouts([]);
    setSelectedSessions([]);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Typography variant="h4" gutterBottom sx={{ px: 1 }}>
        My Calendar
      </Typography>

      <Paper sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        {/* Calendar Header */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 1, px: 1 }}>
            Training Calendar
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

        {/* Calendar Grid */}
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

          {/* Calendar days */}
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
              const hasSessions = dayData.sessions.length > 0;
              const hasActivity = hasWorkouts || hasSessions;

              return (
                <Grid item xs={12 / 7} key={dayData.date}>
                  <Card
                    onClick={() => hasActivity && handleDayClick(dayData.date)}
                    sx={{
                      height: { xs: 60, sm: 80, md: 100 },
                      cursor: hasActivity ? 'pointer' : 'default',
                      border: 1,
                      borderColor: 'divider',
                      backgroundColor: 'background.paper',
                      transition: 'all 0.2s',
                      '&:hover': hasActivity
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
                      {hasActivity && (
                        <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {/* Workouts */}
                          {dayData.workouts.map((workout, idx) => (
                            <Box
                              key={`workout-${idx}`}
                              sx={{
                                height: 4,
                                backgroundColor: getWorkoutTypeColor(workout.source),
                                borderRadius: 0.5,
                              }}
                            />
                          ))}
                          {/* Training Sessions */}
                          {dayData.sessions.map((session, idx) => (
                            <Box
                              key={`session-${idx}`}
                              sx={{
                                height: 4,
                                backgroundColor: session.sessionCategory === 'team' ? workoutTypeColors.team : workoutTypeColors.personal,
                                borderRadius: 0.5,
                              }}
                            />
                          ))}
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: { xs: '0.6rem', sm: '0.7rem' },
                              color: 'text.secondary',
                              mt: 0.25,
                            }}
                          >
                            {hasWorkouts && `${dayData.workouts.length} workout${dayData.workouts.length > 1 ? 's' : ''}`}
                            {hasWorkouts && hasSessions && ', '}
                            {hasSessions && `${dayData.sessions.length} session${dayData.sessions.length > 1 ? 's' : ''}`}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>

        {/* Legend */}
        <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap', justifyContent: 'center', px: 1 }}>
          <Chip
            label="Team Workout"
            size="small"
            sx={{
              backgroundColor: workoutTypeColors.coach,
              color: 'white',
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
              height: { xs: 20, sm: 24 }
            }}
          />
          <Chip
            label="Free Workout"
            size="small"
            sx={{
              backgroundColor: workoutTypeColors.player,
              color: 'white',
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
              height: { xs: 20, sm: 24 }
            }}
          />
          <Chip
            label="Team Session"
            size="small"
            sx={{
              backgroundColor: workoutTypeColors.team,
              color: 'white',
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
              height: { xs: 20, sm: 24 }
            }}
          />
          <Chip
            label="Private Session"
            size="small"
            sx={{
              backgroundColor: workoutTypeColors.personal,
              color: 'white',
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
              height: { xs: 20, sm: 24 }
            }}
          />
        </Box>
      </Paper>

      {/* Workout Details Modal */}
      <Dialog
        open={Boolean(selectedDate)}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </Typography>
            <IconButton onClick={handleCloseModal} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {/* Training Sessions */}
          {selectedSessions.length > 0 && (
            <>
              <Typography variant="h6" sx={{ mb: 2, mt: 1 }}>
                Training Sessions
              </Typography>
              {selectedSessions.map((session) => (
                <Card key={session.id} sx={{ mb: 2, border: 2, borderColor: session.sessionCategory === 'team' ? workoutTypeColors.team : workoutTypeColors.personal }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box>
                        <Typography variant="h6" sx={{ mb: 0.5 }}>
                          {session.title}
                        </Typography>
                        <Chip
                          label={session.sessionCategory === 'team' ? 'Team Session' : 'Private Session'}
                          size="small"
                          sx={{
                            backgroundColor: session.sessionCategory === 'team' ? workoutTypeColors.team : workoutTypeColors.personal,
                            color: 'white',
                          }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {session.time}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationOnIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {session.location}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
              {selectedWorkouts.length > 0 && <Divider sx={{ my: 2 }} />}
            </>
          )}

          {/* Workouts */}
          {selectedWorkouts.length > 0 && (
            <>
              <Typography variant="h6" sx={{ mb: 2, mt: selectedSessions.length > 0 ? 0 : 1 }}>
                Workouts
              </Typography>
            </>
          )}
          {selectedWorkouts.map((workout, idx) => (
            <Card key={workout.id} sx={{ mb: idx < selectedWorkouts.length - 1 ? 2 : 0 }}>
              <CardContent>
                {/* Workout Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    {workout.planName && (
                      <Typography variant="h6" sx={{ mb: 0.5 }}>
                        {workout.planName}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={workout.source === 'coach' ? 'Team Workout' : 'Free Workout'}
                        size="small"
                        color={workout.source === 'coach' ? 'success' : 'secondary'}
                      />
                      {workout.source === 'coach' && workout.completionPercentage !== undefined && (
                        <Chip
                          label={`${workout.completionPercentage}% completed`}
                          size="small"
                          color={
                            workout.completionPercentage >= 70 ? 'success' :
                            workout.completionPercentage >= 40 ? 'warning' : 'error'
                          }
                        />
                      )}
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(workout.createdAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Typography>
                </Box>

                {/* Exercises */}
                {workout.entries.map((entry, entryIdx) => {
                  const thumbnailUrl = entry.youtubeUrl
                    ? getYouTubeThumbnail(entry.youtubeUrl)
                    : undefined;

                  return (
                    <Box key={entryIdx} sx={{ mb: entryIdx < workout.entries.length - 1 ? 2 : 0 }}>
                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>
                            {entry.name}
                          </Typography>

                          {entry.setData && entry.setData.length > 0 ? (
                            <Box sx={{ pl: 1 }}>
                              {entry.setData.map((set, setIdx) => (
                                <Typography
                                  key={setIdx}
                                  variant="body2"
                                  sx={{ fontSize: '0.875rem', color: 'text.primary', mb: 0.25 }}
                                >
                                  Set {set.setNumber}:{' '}
                                  {set.reps && `${set.reps} reps`}
                                  {set.reps && set.kg && ' × '}
                                  {set.kg && `${set.kg}kg`}
                                  {set.durationSec && `${set.durationSec} seconds`}
                                </Typography>
                              ))}
                            </Box>
                          ) : null}

                          {entry.rpe && (
                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, pl: 1, color: 'text.secondary' }}>
                              Effort: {entry.rpe}/10 {entry.rpe >= 8 ? '(Hard)' : entry.rpe >= 6 ? '(Moderate)' : '(Easy)'}
                            </Typography>
                          )}

                          {entry.notes && (
                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, pl: 1, color: 'text.secondary', fontStyle: 'italic' }}>
                              Note: {entry.notes}
                            </Typography>
                          )}
                        </Box>

                        {thumbnailUrl && (
                          <Box
                            sx={{
                              position: 'relative',
                              width: 60,
                              height: 60,
                              flexShrink: 0,
                              borderRadius: 1,
                              overflow: 'hidden',
                              backgroundColor: 'grey.900',
                            }}
                          >
                            <CardMedia
                              component="img"
                              image={thumbnailUrl}
                              alt={entry.name}
                              sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                            <Box
                              sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                color: 'white',
                                opacity: 0.9,
                              }}
                            >
                              <PlayCircleOutlineIcon sx={{ fontSize: 24 }} />
                            </Box>
                          </Box>
                        )}
                      </Box>

                      {entryIdx < workout.entries.length - 1 && <Divider sx={{ mt: 1.5 }} />}
                    </Box>
                  );
                })}

                {workout.notes && (
                  <Alert severity="info" sx={{ mt: 2, py: 0.5, fontSize: '0.875rem' }}>
                    {workout.notes}
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </DialogContent>
      </Dialog>
    </Box>
  );
};
