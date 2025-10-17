import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Grid,
  Avatar,
  AvatarGroup,
  IconButton,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useI18n } from '../i18n/I18nProvider';
import { getUser } from '../services/mock';
import {
  getAllSessions,
  getUpcomingSessions,
  createSession,
  updateRSVP,
  deleteSession,
} from '../services/trainingSessions';
import type { TrainingSession, SessionType, RSVPStatus } from '../types/trainingSession';

export const TrainingSessions: React.FC = () => {
  const { t } = useI18n();
  const currentUser = getUser();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'gym' as SessionType,
    title: '',
    location: '',
    address: '',
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    description: '',
  });

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = () => {
    setSessions(getUpcomingSessions());
  };

  const handleCreateSession = () => {
    if (!currentUser || !formData.title || !formData.location) return;

    createSession({
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      type: formData.type,
      title: formData.title,
      location: formData.location,
      address: formData.address,
      date: formData.date,
      time: formData.time,
      description: formData.description,
      attendees: [
        {
          userId: currentUser.id,
          userName: currentUser.name,
          status: 'going',
        },
      ],
    });

    setCreateDialogOpen(false);
    setFormData({
      type: 'gym',
      title: '',
      location: '',
      address: '',
      date: new Date().toISOString().split('T')[0],
      time: '19:00',
      description: '',
    });
    loadSessions();
  };

  const handleRSVP = (sessionId: string, status: RSVPStatus) => {
    if (!currentUser) return;
    updateRSVP(sessionId, currentUser.id, currentUser.name, status);
    loadSessions();
  };

  const handleDeleteSession = (sessionId: string) => {
    deleteSession(sessionId);
    loadSessions();
  };

  const getUserRSVP = (session: TrainingSession): RSVPStatus => {
    if (!currentUser) return 'pending';
    const attendee = session.attendees.find(a => a.userId === currentUser.id);
    return attendee?.status || 'pending';
  };

  const getGoingCount = (session: TrainingSession): number => {
    return session.attendees.filter(a => a.status === 'going').length;
  };

  const getSessionTypeColor = (type: SessionType): string => {
    switch (type) {
      case 'gym':
        return '#2196f3';
      case 'outdoor':
        return '#4caf50';
      case 'coach-plan':
        return '#ff9800';
      case 'free-training':
        return '#9c27b0';
      default:
        return '#757575';
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return t('trainingSessions.today');
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return t('trainingSessions.tomorrow');
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };

  if (!currentUser) return null;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">{t('trainingSessions.title')}</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          {t('trainingSessions.createSession')}
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t('trainingSessions.subtitle')}
      </Typography>

      {sessions.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <FitnessCenterIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {t('trainingSessions.noSessions')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t('trainingSessions.createFirst')}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {sessions.map((session) => {
            const userStatus = getUserRSVP(session);
            const goingCount = getGoingCount(session);
            const isCreator = session.creatorId === currentUser.id;

            return (
              <Grid item xs={12} md={6} key={session.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Chip
                            label={t(`trainingSessions.type.${session.type}`)}
                            size="small"
                            sx={{
                              backgroundColor: getSessionTypeColor(session.type),
                              color: 'white',
                            }}
                          />
                          {isCreator && (
                            <Chip label={t('trainingSessions.yourSession')} size="small" color="primary" />
                          )}
                        </Box>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                          {session.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {t('trainingSessions.createdBy')}: {session.creatorName}
                        </Typography>
                      </Box>
                      {isCreator && (
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteSession(session.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTimeIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {formatDate(session.date)} • {session.time}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOnIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {session.location}
                          {session.address && ` • ${session.address}`}
                        </Typography>
                      </Box>
                    </Box>

                    {session.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {session.description}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AvatarGroup max={4}>
                          {session.attendees
                            .filter(a => a.status === 'going')
                            .map((attendee) => (
                              <Tooltip key={attendee.userId} title={attendee.userName}>
                                <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                                  {attendee.userName.charAt(0)}
                                </Avatar>
                              </Tooltip>
                            ))}
                        </AvatarGroup>
                        <Typography variant="body2" color="text.secondary">
                          {goingCount} {t('trainingSessions.going')}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant={userStatus === 'going' ? 'contained' : 'outlined'}
                          color="success"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleRSVP(session.id, 'going')}
                        >
                          {t('trainingSessions.going')}
                        </Button>
                        <Button
                          size="small"
                          variant={userStatus === 'not-going' ? 'contained' : 'outlined'}
                          color="error"
                          startIcon={<CancelIcon />}
                          onClick={() => handleRSVP(session.id, 'not-going')}
                        >
                          {t('trainingSessions.notGoing')}
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Create Session Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('trainingSessions.createSession')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              select
              label={t('trainingSessions.sessionType')}
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as SessionType })}
              fullWidth
            >
              <MenuItem value="gym">{t('trainingSessions.type.gym')}</MenuItem>
              <MenuItem value="outdoor">{t('trainingSessions.type.outdoor')}</MenuItem>
              <MenuItem value="coach-plan">{t('trainingSessions.type.coach-plan')}</MenuItem>
              <MenuItem value="free-training">{t('trainingSessions.type.free-training')}</MenuItem>
            </TextField>

            <TextField
              label={t('trainingSessions.sessionTitle')}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={t('trainingSessions.titlePlaceholder')}
              fullWidth
              required
            />

            <TextField
              label={t('trainingSessions.location')}
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Clever Fit Bruck"
              fullWidth
              required
            />

            <TextField
              label={t('trainingSessions.address')}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder={t('trainingSessions.addressPlaceholder')}
              fullWidth
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                type="date"
                label={t('trainingSessions.date')}
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                type="time"
                label={t('trainingSessions.time')}
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            <TextField
              label={t('trainingSessions.description')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('trainingSessions.descriptionPlaceholder')}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button
            onClick={handleCreateSession}
            variant="contained"
            disabled={!formData.title || !formData.location}
          >
            {t('trainingSessions.create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
