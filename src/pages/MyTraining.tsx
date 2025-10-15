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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useI18n } from '../i18n/I18nProvider';
import { WorkoutBlock } from '../components/workout/WorkoutBlock';
import { WorkoutLogDialog } from '../components/workout/WorkoutLogDialog';
import { FreeSessionDialog } from '../components/workout/FreeSessionDialog';
import { getUser, getTemplatesForPosition, getTrainingTypes } from '../services/mock';
import type { TrainingTypeKey, PositionTemplate } from '../types/template';
import type { Exercise } from '../types/exercise';
import type { WorkoutPayload, WorkoutEntry } from '../types/workout';
import { sanitizeYouTubeUrl } from '../services/yt';

export const MyTraining: React.FC = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TrainingTypeKey>('strength_conditioning');
  const [template, setTemplate] = useState<PositionTemplate | null>(null);
  const [showFreeSession, setShowFreeSession] = useState(false);
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const user = getUser();
  const trainingTypes = getTrainingTypes();

  useEffect(() => {
    if (user) {
      const templates = getTemplatesForPosition(user.position);
      const currentTemplate = templates[activeTab]?.[user.position];
      setTemplate(currentTemplate || null);
    }
  }, [user, activeTab]);

  const handleSaveFreeSession = (payload: WorkoutPayload) => {
    console.log('Saving free session:', payload);
    setShowFreeSession(false);
    setSuccessMessage(t('workout.sessionSaved'));
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleLogWorkout = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowLogDialog(true);
  };

  const handleSaveWorkoutLog = (entry: WorkoutEntry) => {
    console.log('Logging workout entry:', entry);
    // In a real app, this would save to backend
    // For now, just show success message
    setShowLogDialog(false);
    setSelectedExercise(null);
    setSuccessMessage(t('workout.workoutLogged'));
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
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowFreeSession(true)}
        >
          {t('workout.addFreeSession')}
        </Button>
      </Box>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

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

      {template ? (
        <Box>
          <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
            {t('training.myPlan')}
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
              />
            ))}
        </Box>
      ) : (
        <Alert severity="info">
          No training plan available for your position
        </Alert>
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
