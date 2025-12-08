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
  Button,
  CardMedia,
  Dialog,
  DialogContent,
  DialogTitle,
  CardActionArea,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import FilterListIcon from '@mui/icons-material/FilterList';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CloseIcon from '@mui/icons-material/Close';
import { useI18n } from '../../i18n/I18nProvider';
import { useNavigate } from 'react-router-dom';
import { getYouTubeThumbnail, sanitizeYouTubeUrl } from '../../services/yt';
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
  const navigate = useNavigate();
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutLog | null>(null);

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

  const handleVideoClick = (url: string) => {
    const sanitized = sanitizeYouTubeUrl(url);
    if (sanitized) {
      setVideoUrl(sanitized);
    }
  };

  // Calculate workout summary stats
  const getWorkoutSummary = (workout: WorkoutLog) => {
    const totalExercises = workout.entries.length;
    const totalSets = workout.entries.reduce((sum, entry) => {
      if (entry.setData) return sum + entry.setData.length;
      return sum + (entry.sets || 0);
    }, 0);
    return { totalExercises, totalSets };
  };

  // Render compact card for list view
  const renderCompactCard = (workout: WorkoutLog) => {
    const { totalExercises, totalSets } = getWorkoutSummary(workout);
    const time = new Date(workout.createdAt).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <Card key={workout.id} sx={{ mb: 1.5 }}>
        <CardActionArea onClick={() => setSelectedWorkout(workout)}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {/* Left side - Info */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {/* Plan name or title */}
                <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.95rem', mb: 0.5 }}>
                  {workout.planName || (workout.source === 'coach' ? t('workout.coachPlan') : t('workout.freeSession'))}
                </Typography>

                {/* Time and stats */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AccessTimeIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                      {time}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    •
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    {totalExercises} {totalExercises === 1 ? 'exercise' : 'exercises'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    •
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    {totalSets} sets
                  </Typography>
                </Box>
              </Box>

              {/* Right side - Chips */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                <Chip
                  label={workout.source === 'coach' ? 'Coach' : 'Free'}
                  size="small"
                  color={workout.source === 'coach' ? 'primary' : 'secondary'}
                  sx={{ height: 20, fontSize: '0.65rem' }}
                />
                {workout.completionPercentage !== undefined && (
                  <Chip
                    label={`${workout.completionPercentage}%`}
                    size="small"
                    color={
                      workout.completionPercentage >= 70 ? 'success' :
                      workout.completionPercentage >= 40 ? 'warning' : 'error'
                    }
                    sx={{ height: 20, fontSize: '0.65rem' }}
                  />
                )}
              </Box>
            </Box>
          </CardContent>
        </CardActionArea>
      </Card>
    );
  };

  // Render full workout details in dialog
  const renderWorkoutDetails = (workout: WorkoutLog) => {
    return (
      <Box>
        {/* Exercise entries */}
        {workout.entries.map((entry, idx) => {
          const thumbnailUrl = entry.youtubeUrl
            ? getYouTubeThumbnail(entry.youtubeUrl)
            : undefined;

          return (
            <Box key={idx} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                {/* Exercise Name and Data */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body1" fontWeight={600} sx={{ fontSize: '1rem', mb: 0.5 }}>
                    {entry.name}
                  </Typography>

                  {/* Set-by-set data */}
                  {entry.setData && entry.setData.length > 0 ? (
                    <Box sx={{ pl: 1 }}>
                      {entry.setData.length === 1 ? (
                        <Typography variant="body2" sx={{ fontSize: '0.9rem', color: 'text.primary' }}>
                          {entry.setData[0].reps && `${entry.setData[0].reps} reps`}
                          {entry.setData[0].reps && entry.setData[0].kg && ' × '}
                          {entry.setData[0].kg && `${entry.setData[0].kg}kg`}
                          {entry.setData[0].durationSec && `${entry.setData[0].durationSec} seconds`}
                        </Typography>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                          {entry.setData.map((set, setIdx) => (
                            <Typography
                              key={setIdx}
                              variant="body2"
                              sx={{ fontSize: '0.85rem', color: 'text.primary' }}
                            >
                              Set {set.setNumber}:{' '}
                              {set.reps && `${set.reps} reps`}
                              {set.reps && set.kg && ' × '}
                              {set.kg && `${set.kg}kg`}
                              {set.durationSec && `${set.durationSec} seconds`}
                            </Typography>
                          ))}
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', pl: 1 }}>
                      {entry.sets && entry.reps && `${entry.sets} sets × ${entry.reps} reps`}
                      {entry.kg && ` with ${entry.kg}kg`}
                      {entry.durationSec && ` for ${entry.durationSec} seconds`}
                    </Typography>
                  )}

                  {/* RPE */}
                  {entry.rpe && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontSize: '0.8rem', pl: 1, color: 'text.secondary' }}>
                      Effort: {entry.rpe}/10 {entry.rpe >= 8 ? '(Hard)' : entry.rpe >= 6 ? '(Moderate)' : '(Easy)'}
                    </Typography>
                  )}

                  {/* Exercise notes */}
                  {entry.notes && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontSize: '0.8rem', pl: 1, color: 'text.secondary', fontStyle: 'italic' }}>
                      Note: {entry.notes}
                    </Typography>
                  )}
                </Box>

                {/* YouTube Thumbnail */}
                {thumbnailUrl && entry.youtubeUrl && (
                  <Box
                    data-thumbnail-container
                    onClick={() => handleVideoClick(entry.youtubeUrl!)}
                    sx={{
                      position: 'relative',
                      width: 70,
                      height: 70,
                      flexShrink: 0,
                      borderRadius: 1,
                      overflow: 'hidden',
                      backgroundColor: 'grey.900',
                      cursor: 'pointer',
                      '&:hover': { opacity: 0.8 },
                    }}
                  >
                    <CardMedia
                      component="img"
                      image={thumbnailUrl}
                      alt={entry.name}
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                        const parent = e.currentTarget.closest('[data-thumbnail-container]') as HTMLElement;
                        if (parent) parent.style.display = 'none';
                      }}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
                      <PlayCircleOutlineIcon sx={{ fontSize: 28 }} />
                    </Box>
                  </Box>
                )}
              </Box>

              {idx < workout.entries.length - 1 && <Divider sx={{ mt: 1.5, mb: 1 }} />}
            </Box>
          );
        })}

        {/* Workout notes */}
        {workout.notes && (
          <Alert severity="info" sx={{ mt: 2, fontSize: '0.85rem' }}>
            {workout.notes}
          </Alert>
        )}
      </Box>
    );
  };

  return (
    <Box>
      {/* Filter Controls */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
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

        <Button
          variant="outlined"
          size="small"
          startIcon={<CalendarMonthIcon />}
          onClick={() => navigate('/stats')}
          fullWidth
          sx={{ fontSize: '0.8rem' }}
        >
          See Calendar
        </Button>
      </Box>

      {filteredWorkouts.length === 0 ? (
        <Alert severity="info">
          No workouts found in this time period. Try selecting a different filter.
        </Alert>
      ) : (
        sortedDates.map((date) => (
          <Box key={date} sx={{ mb: 3 }}>
            {/* Date Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
              <FitnessCenterIcon color="primary" sx={{ fontSize: '1.2rem' }} />
              <Typography variant="h6" color="primary.main" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                {formatDate(date)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5, fontSize: '0.75rem' }}>
                {groupedByDate[date].length} {groupedByDate[date].length === 1 ? 'workout' : 'workouts'}
              </Typography>
            </Box>

            {/* Compact workout cards */}
            {groupedByDate[date].map((workout) => renderCompactCard(workout))}
          </Box>
        ))
      )}

      {/* Workout Details Dialog */}
      <Dialog
        open={Boolean(selectedWorkout)}
        onClose={() => setSelectedWorkout(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { maxHeight: '90vh' }
        }}
      >
        {selectedWorkout && (
          <>
            <DialogTitle sx={{ pb: 1, pr: 6 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {selectedWorkout.planName || (selectedWorkout.source === 'coach' ? t('workout.coachPlan') : t('workout.freeSession'))}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date(selectedWorkout.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })} at {new Date(selectedWorkout.createdAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                  <Chip
                    label={selectedWorkout.source === 'coach' ? t('workout.coachPlan') : t('workout.freeSession')}
                    size="small"
                    color={selectedWorkout.source === 'coach' ? 'primary' : 'secondary'}
                    sx={{ height: 24 }}
                  />
                  {selectedWorkout.completionPercentage !== undefined && (
                    <Chip
                      label={`${selectedWorkout.completionPercentage}% completed`}
                      size="small"
                      color={
                        selectedWorkout.completionPercentage >= 70 ? 'success' :
                        selectedWorkout.completionPercentage >= 40 ? 'warning' : 'error'
                      }
                      sx={{ height: 24 }}
                    />
                  )}
                </Box>
              </Box>

              {/* Action buttons in header */}
              <Box sx={{ position: 'absolute', right: 8, top: 8, display: 'flex', gap: 0.5 }}>
                {onEdit && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(selectedWorkout);
                      setSelectedWorkout(null);
                    }}
                    color="primary"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                )}
                {onDelete && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(selectedWorkout.id);
                      setSelectedWorkout(null);
                    }}
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
                <IconButton
                  size="small"
                  onClick={() => setSelectedWorkout(null)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              {renderWorkoutDetails(selectedWorkout)}
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Video Dialog */}
      <Dialog
        open={Boolean(videoUrl)}
        onClose={() => setVideoUrl(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent sx={{ p: 0 }}>
          {videoUrl && (
            <Box
              component="iframe"
              src={videoUrl}
              sx={{
                width: '100%',
                height: { xs: 300, sm: 400, md: 500 },
                border: 'none',
              }}
              title="Exercise Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};
