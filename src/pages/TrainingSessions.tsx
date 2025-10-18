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
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import { useI18n } from '../i18n/I18nProvider';
import { getUser } from '../services/mock';
import {
  getTeamSessions,
  getPrivateSessions,
  createSession,
  updateRSVP,
  deleteSession,
  canCheckIn,
  checkInToSession,
  getCheckInStatus,
} from '../services/trainingSessions';
import type { TrainingSession, SessionType, RSVPStatus } from '../types/trainingSession';

export const TrainingSessions: React.FC = () => {
  const { t } = useI18n();
  const currentUser = getUser();
  const [activeTab, setActiveTab] = useState(0);
  const [teamSessions, setTeamSessions] = useState<TrainingSession[]>([]);
  const [privateSessions, setPrivateSessions] = useState<TrainingSession[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
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
    setTeamSessions(getTeamSessions());
    setPrivateSessions(getPrivateSessions());
  };

  const handleCreatePrivateSession = () => {
    if (!currentUser || !formData.title || !formData.location) return;

    createSession({
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      sessionCategory: 'private',
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

  const handleCheckIn = (session: TrainingSession) => {
    if (!currentUser || !canCheckIn(session)) return;

    checkInToSession(session.id, currentUser.id, currentUser.name);
    setSuccessMessage(t('trainingSessions.checkedIn'));
    setTimeout(() => setSuccessMessage(''), 3000);
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

  const getCheckInStatusColor = (status: string) => {
    switch (status) {
      case 'on_time':
        return 'success';
      case 'late':
        return 'warning';
      case 'absent':
        return 'error';
      default:
        return 'default';
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

  const renderTeamSessions = () => {
    if (teamSessions.length === 0) {
      return (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <GroupsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {t('trainingSessions.noTeamSessions')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t('trainingSessions.coachWillCreate')}
            </Typography>
          </CardContent>
        </Card>
      );
    }

    return (
      <Grid container spacing={2}>
        {teamSessions.map((session) => {
          const isCreator = session.creatorId === currentUser?.id;
          const checkInStatus = currentUser ? getCheckInStatus(session, currentUser.id) : null;
          const canCheck = canCheckIn(session);
          const checkedIn = checkInStatus === 'on_time' || checkInStatus === 'late';

          return (
            <Grid item xs={12} md={6} key={session.id}>
              <Card sx={{ border: '2px solid #ff9800' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip
                          icon={<GroupsIcon />}
                          label={t('trainingSessions.teamSession')}
                          size="small"
                          sx={{ backgroundColor: '#ff9800', color: 'white' }}
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
                    {isCreator && currentUser?.role === 'coach' && (
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

                  {/* Check-in Status */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Box>
                      {checkInStatus && (
                        <Chip
                          label={t(`trainingSessions.checkInStatus.${checkInStatus}`)}
                          color={getCheckInStatusColor(checkInStatus) as any}
                          size="small"
                          icon={checkedIn ? <CheckCircleIcon /> : undefined}
                        />
                      )}
                      {!checkInStatus && (
                        <Chip
                          label={t('trainingSessions.notCheckedIn')}
                          color="default"
                          size="small"
                        />
                      )}
                    </Box>

                    {!checkedIn && currentUser?.role === 'player' && (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleCheckIn(session)}
                        disabled={!canCheck}
                      >
                        {t('trainingSessions.checkIn')}
                      </Button>
                    )}
                  </Box>

                  {/* Show who checked in (for coaches) */}
                  {currentUser?.role === 'coach' && session.checkIns && session.checkIns.length > 0 && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(0,0,0,0.12)' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        {t('trainingSessions.checkedInCount', { count: session.checkIns.length })}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {session.checkIns.map((checkIn) => (
                          <Chip
                            key={checkIn.userId}
                            label={checkIn.userName}
                            size="small"
                            color={getCheckInStatusColor(checkIn.status) as any}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  const renderPrivateSessions = () => {
    if (privateSessions.length === 0) {
      return (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <FitnessCenterIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {t('trainingSessions.noPrivateSessions')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t('trainingSessions.createFirst')}
            </Typography>
          </CardContent>
        </Card>
      );
    }

    return (
      <Grid container spacing={2}>
        {privateSessions.map((session) => {
          const userStatus = getUserRSVP(session);
          const goingCount = getGoingCount(session);
          const isCreator = session.creatorId === currentUser?.id;

          return (
            <Grid item xs={12} md={6} key={session.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip
                          icon={<PersonIcon />}
                          label={t('trainingSessions.privateSession')}
                          size="small"
                          color="default"
                        />
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
    );
  };

  if (!currentUser) return null;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">{t('trainingSessions.title')}</Typography>
        {activeTab === 1 && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            {t('trainingSessions.createPrivateSession')}
          </Button>
        )}
      </Box>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab
          icon={<GroupsIcon />}
          label={t('trainingSessions.teamSessions')}
          iconPosition="start"
        />
        <Tab
          icon={<PersonIcon />}
          label={t('trainingSessions.privateSessions')}
          iconPosition="start"
        />
      </Tabs>

      {activeTab === 0 && (
        <>
          <Alert severity="info" sx={{ mb: 3 }}>
            {t('trainingSessions.teamSessionsInfo')}
          </Alert>
          {renderTeamSessions()}
        </>
      )}

      {activeTab === 1 && (
        <>
          <Alert severity="info" sx={{ mb: 3 }}>
            {t('trainingSessions.privateSessionsInfo')}
          </Alert>
          {renderPrivateSessions()}
        </>
      )}

      {/* Create Private Session Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('trainingSessions.createPrivateSession')}</DialogTitle>
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
            onClick={handleCreatePrivateSession}
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
