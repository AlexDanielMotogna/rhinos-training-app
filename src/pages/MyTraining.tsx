import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Dialog,
  DialogContent,
  Alert,
  LinearProgress,
  Chip,
  Card,
  CardContent,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useI18n } from '../i18n/I18nProvider';
import { WorkoutBlock } from '../components/workout/WorkoutBlock';
import { WorkoutLogDialog } from '../components/workout/WorkoutLogDialog';
import { FreeSessionDialog } from '../components/workout/FreeSessionDialog';
import { WorkoutHistory } from '../components/workout/WorkoutHistory';
import { EditWorkoutDialog } from '../components/workout/EditWorkoutDialog';
import { getUser, getTemplatesForPosition, getTrainingTypes } from '../services/mock';
import { getActiveAssignmentsForPlayer } from '../services/trainingBuilder';
import { saveWorkoutLog, saveWorkoutEntry, getWorkoutLogsByUser, deleteWorkoutLog, updateWorkoutLog, type WorkoutLog } from '../services/workoutLog';
import type { TrainingTypeKey, PositionTemplate } from '../types/template';
import type { Exercise } from '../types/exercise';
import type { WorkoutPayload, WorkoutEntry } from '../types/workout';
import { sanitizeYouTubeUrl } from '../services/yt';

type SessionView = 'my' | 'team';

export const MyTraining: React.FC = () => {
  const { t } = useI18n();
  const [sessionView, setSessionView] = useState<SessionView>('my');
  const [activeTab, setActiveTab] = useState<TrainingTypeKey>('strength_conditioning');
  const [template, setTemplate] = useState<PositionTemplate | null>(null);
  const [showFreeSession, setShowFreeSession] = useState(false);
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [editWorkout, setEditWorkout] = useState<WorkoutLog | null>(null);

  const user = getUser();
  const trainingTypes = getTrainingTypes();
  const activeAssignments = user ? getActiveAssignmentsForPlayer(user.id) : [];
  const [workoutHistory, setWorkoutHistory] = useState(() =>
    user ? getWorkoutLogsByUser(user.id) : []
  );

  // Calculate program progress
  const calculateProgress = (startDate: string, endDate: string) => {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    const totalWeeks = Math.ceil(totalDays / 7);
    const currentWeek = Math.min(Math.ceil(elapsedDays / 7), totalWeeks);
    const progressPercent = Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100);

    return { currentWeek, totalWeeks, progressPercent };
  };

  useEffect(() => {
    if (user) {
      const templates = getTemplatesForPosition(user.position);
      const currentTemplate = templates[activeTab]?.[user.position];
      setTemplate(currentTemplate || null);
    }
  }, [user, activeTab]);

  const refreshWorkoutHistory = () => {
    if (user) {
      setWorkoutHistory(getWorkoutLogsByUser(user.id));
    }
  };

  const handleSaveFreeSession = (payload: WorkoutPayload) => {
    if (user) {
      saveWorkoutLog(user.id, payload);
      refreshWorkoutHistory();
      setShowFreeSession(false);
      setSuccessMessage(t('workout.sessionSaved'));
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleLogWorkout = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowLogDialog(true);
  };

  const handleSaveWorkoutLog = (entry: WorkoutEntry) => {
    if (user) {
      saveWorkoutEntry(user.id, entry);
      refreshWorkoutHistory();
      setShowLogDialog(false);
      setSelectedExercise(null);
      setSuccessMessage(t('workout.workoutLogged'));
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleDeleteWorkout = (logId: string) => {
    if (window.confirm(t('workout.confirmDelete'))) {
      deleteWorkoutLog(logId);
      refreshWorkoutHistory();
      setSuccessMessage(t('workout.workoutDeleted'));
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleEditWorkout = (workout: WorkoutLog) => {
    setEditWorkout(workout);
  };

  const handleSaveEditedWorkout = (workoutId: string, entries: WorkoutEntry[], notes?: string) => {
    updateWorkoutLog(workoutId, { entries, notes });
    refreshWorkoutHistory();
    setEditWorkout(null);
    setSuccessMessage(t('workout.workoutUpdated'));
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleVideoClick = (url: string) => {
    const sanitized = sanitizeYouTubeUrl(url);
    if (sanitized) {
      setVideoUrl(sanitized);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">{t('nav.myTraining')}</Typography>
        {sessionView === 'my' && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowFreeSession(true)}
          >
            {t('workout.addFreeSession')}
          </Button>
        )}
      </Box>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {/* Main Session Tabs: My Sessions vs Team Sessions */}
      <Tabs
        value={sessionView}
        onChange={(_, value) => setSessionView(value as SessionView)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab value="my" label={t('training.mySessions')} />
        <Tab value="team" label={t('training.teamSessions')} />
      </Tabs>

      {/* MY SESSIONS VIEW */}
      {sessionView === 'my' && (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            {t('training.mySessionsInfo')}
          </Alert>

          <WorkoutHistory
            workouts={workoutHistory.filter(w => w.source === 'player')}
            onDelete={handleDeleteWorkout}
            onEdit={handleEditWorkout}
          />
        </Box>
      )}

      {/* TEAM SESSIONS VIEW */}
      {sessionView === 'team' && (
        <Box>
          {/* Assigned Programs Section */}
          {activeAssignments.length > 0 ? (
            <>
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                  {t('training.yourAssignedPrograms')}
                </Typography>

                {activeAssignments.map((assignment) => {
                  const { currentWeek, totalWeeks, progressPercent } = calculateProgress(
                    assignment.startDate,
                    assignment.endDate
                  );

                  return (
                    <Card key={assignment.id} sx={{ mb: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box>
                            <Typography variant="h6" sx={{ mb: 0.5 }}>
                              {assignment.template.trainingTypeName}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                              <Chip
                                label={`Week ${currentWeek} of ${totalWeeks}`}
                                size="small"
                                color="primary"
                              />
                              <Chip
                                label={`${assignment.template.frequencyPerWeek}x per week`}
                                size="small"
                                variant="outlined"
                              />
                              <Typography variant="caption" color="text.secondary">
                                {assignment.startDate} → {assignment.endDate}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        <Box sx={{ mb: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              {t('training.programProgress')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {Math.round(progressPercent)}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={progressPercent}
                            sx={{ height: 8, borderRadius: 1 }}
                          />
                        </Box>

                        <Alert severity="info" sx={{ mt: 2 }}>
                          {t('training.completeTraining', { frequency: assignment.template.frequencyPerWeek })}
                        </Alert>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>

              {/* Training Type Tabs */}
              <Tabs
                value={activeTab}
                onChange={(_, value) => setActiveTab(value)}
                sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
                variant="scrollable"
                scrollButtons="auto"
              >
                {trainingTypes
                  .filter((tt) => tt.active)
                  .map((tt) => (
                    <Tab
                      key={tt.key}
                      value={tt.key}
                      label={t(`training.${tt.key === 'strength_conditioning' ? 'strength' : 'sprints'}` as any)}
                    />
                  ))}
              </Tabs>

              {/* Coach Plan Exercises */}
              {template ? (
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
                    {t('training.coachPlan')}
                  </Typography>

                  {template.blocks
                    .sort((a, b) => a.order - b.order)
                    .map((block) => (
                      <WorkoutBlock
                        key={block.order}
                        block={block}
                        showLogButtons={true}
                        onLogWorkout={handleLogWorkout}
                        onVideoClick={handleVideoClick}
                        trainingType={activeTab}
                      />
                    ))}
                </Box>
              ) : (
                <Alert severity="info">
                  No training plan available for this type
                </Alert>
              )}

              {/* Workout History for Team Sessions */}
              <Box sx={{ mt: 6 }}>
                <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
                  Training History
                </Typography>
                <WorkoutHistory
                  workouts={workoutHistory.filter(w => w.source === 'coach')}
                  onDelete={handleDeleteWorkout}
                  onEdit={handleEditWorkout}
                />
              </Box>
            </>
          ) : (
            <Alert severity="warning">
              {t('training.noProgramAssigned')}
            </Alert>
          )}
        </Box>
      )}

      <WorkoutLogDialog
        open={showLogDialog}
        exercise={selectedExercise}
        onClose={() => {
          setShowLogDialog(false);
          setSelectedExercise(null);
        }}
        onSave={handleSaveWorkoutLog}
      />

      <FreeSessionDialog
        open={showFreeSession}
        onClose={() => setShowFreeSession(false)}
        onSave={handleSaveFreeSession}
      />

      <EditWorkoutDialog
        open={Boolean(editWorkout)}
        workout={editWorkout}
        onClose={() => setEditWorkout(null)}
        onSave={handleSaveEditedWorkout}
      />

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
