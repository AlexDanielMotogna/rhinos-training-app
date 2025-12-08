import React, { useState, useEffect, useCallback } from 'react';
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
import CircleIcon from '@mui/icons-material/Circle';
import CloseIcon from '@mui/icons-material/Close';
import SportsFootballIcon from '@mui/icons-material/SportsFootball';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import { useI18n } from '../i18n/I18nProvider';
import { getUser, getAllUsers } from '../services/userProfile';
import { AttendancePollModal } from '../components/AttendancePollModal';
import {
  getTeamSessions,
  getPrivateSessions,
  createSession,
  updateRSVP,
  deleteSession,
} from '../services/trainingSessions';
import { getAllPolls, getPollResults } from '../services/attendancePollService';
import type { TrainingSession, SessionType, RSVPStatus } from '../types/trainingSession';
import type { Position } from '../types/exercise';
import type { AttendancePollVote } from '../types/attendancePoll';
import { toastService } from '../services/toast';
import { usePollSSE } from '../hooks/usePollSSE';

// Position groupings for unit counts
const OFFENSE_POSITIONS: Position[] = ['QB', 'RB', 'WR', 'TE', 'OL'];
const DEFENSE_POSITIONS: Position[] = ['DL', 'LB', 'DB'];
const SPECIAL_TEAMS_POSITIONS: Position[] = ['K/P'];

export const TrainingSessions: React.FC = () => {
  const { t } = useI18n();
  const currentUser = getUser();
  const [activeTab, setActiveTab] = useState(0);
  const [teamSessions, setTeamSessions] = useState<TrainingSession[]>([]);
  const [privateSessions, setPrivateSessions] = useState<TrainingSession[]>([]);
  const [sessionPolls, setSessionPolls] = useState<Map<string, any>>(new Map());
  const [pollResults, setPollResults] = useState<Map<string, any>>(new Map());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedPoll, setSelectedPoll] = useState<any>(null);
  const [pollModalOpen, setPollModalOpen] = useState(false);
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
    loadPolls();
  }, []);

  // Handle vote updates from SSE
  const handleVoteUpdate = useCallback(async (data: any) => {
    console.log('[TrainingSessions] Received vote update via SSE:', data);
    // Find the poll by pollId
    let targetPoll: any = null;
    sessionPolls.forEach((poll, sessionId) => {
      if (poll.id === data.pollId) {
        targetPoll = poll;
      }
    });

    if (targetPoll) {
      const results = await getPollResults(targetPoll.id);
      if (results) {
        setPollResults(prev => {
          const newMap = new Map(prev);
          newMap.set(targetPoll.id, results);
          return newMap;
        });
      }
    }
  }, [sessionPolls]);

  // Handle RSVP updates from SSE
  const handleRSVPUpdate = useCallback((data: any) => {
    console.log('[TrainingSessions] Received RSVP update via SSE:', data);

    // Update the appropriate session list based on category
    if (data.sessionCategory === 'private') {
      setPrivateSessions(prev =>
        prev.map(session =>
          session.id === data.sessionId
            ? { ...session, attendees: data.attendees }
            : session
        )
      );
    } else if (data.sessionCategory === 'team') {
      setTeamSessions(prev =>
        prev.map(session =>
          session.id === data.sessionId
            ? { ...session, attendees: data.attendees }
            : session
        )
      );
    }
  }, []);

  // Handle new session created from SSE
  const handleSessionCreated = useCallback((data: any) => {
    console.log('[TrainingSessions] Received session created via SSE:', data);

    // Don't add if it's our own session (we already added it locally)
    if (data.creatorId === currentUser?.id) {
      return;
    }

    const newSession = data.session;
    if (newSession.sessionCategory === 'private') {
      setPrivateSessions(prev => {
        // Check if session already exists
        if (prev.some(s => s.id === newSession.id)) {
          return prev;
        }
        return [...prev, newSession];
      });
    } else if (newSession.sessionCategory === 'team') {
      setTeamSessions(prev => {
        // Check if session already exists
        if (prev.some(s => s.id === newSession.id)) {
          return prev;
        }
        return [...prev, newSession];
      });
    }
  }, [currentUser?.id]);

  // Handle session deleted from SSE
  const handleSessionDeleted = useCallback((data: any) => {
    console.log('[TrainingSessions] Received session deleted via SSE:', data);

    if (data.sessionCategory === 'private') {
      setPrivateSessions(prev => prev.filter(s => s.id !== data.sessionId));
    } else if (data.sessionCategory === 'team') {
      setTeamSessions(prev => prev.filter(s => s.id !== data.sessionId));
    }
  }, []);

  // Subscribe to live updates via SSE (polls for team, RSVP for private, session create/delete)
  // Only enable SSE when user is authenticated
  usePollSSE({
    enabled: !!currentUser, // Only enable when user is authenticated
    onVoteUpdate: handleVoteUpdate,
    onRSVPUpdate: handleRSVPUpdate,
    onSessionCreated: handleSessionCreated,
    onSessionDeleted: handleSessionDeleted,
    onConnected: () => {
      console.log('[TrainingSessions] Connected to SSE');
    },
    onError: (error) => {
      console.error('[TrainingSessions] SSE error:', error);
    },
  });

  const loadPolls = async () => {
    const polls = await getAllPolls();
    const pollMap = new Map();
    const resultsMap = new Map();

    for (const poll of polls) {
      if (poll.isActive) {
        pollMap.set(poll.sessionId, poll);
        const results = await getPollResults(poll.id);
        if (results) {
          resultsMap.set(poll.id, results);
        }
      }
    }

    setSessionPolls(pollMap);
    setPollResults(resultsMap);
  };

  const loadSessions = async () => {
    const [team, private_] = await Promise.all([
      getTeamSessions(),
      getPrivateSessions(),
    ]);
    setTeamSessions(team);
    setPrivateSessions(private_);
  };

  const handleCreatePrivateSession = async () => {
    if (!currentUser || !formData.title || !formData.location) return;

    try {
      await createSession({
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
      await loadSessions();
      toastService.created('Session');
    } catch (error) {
      toastService.createError('session', error instanceof Error ? error.message : undefined);
    }
  };

  const handleRSVP = async (sessionId: string, status: RSVPStatus) => {
    if (!currentUser) return;
    try {
      await updateRSVP(sessionId, currentUser.id, currentUser.name, status);
      await loadSessions();
      if (status === 'going') {
        toastService.checkInSuccess();
      } else {
        toastService.success('RSVP updated successfully');
      }
    } catch (error) {
      toastService.checkInError();
    }
  };


  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      await loadSessions();
      toastService.deleted('Session');
    } catch (error) {
      toastService.deleteError('session', error instanceof Error ? error.message : undefined);
    }
  };

  const handleOpenPoll = (session: TrainingSession) => {
    const poll = getSessionPoll(session.id);
    if (poll) {
      setSelectedPoll(poll);
      setPollModalOpen(true);
    }
  };

  const handleClosePollModal = () => {
    setPollModalOpen(false);
    setSelectedPoll(null);
    loadPolls(); // Refresh poll data
  };

  const getSessionPoll = (sessionId: string) => {
    return sessionPolls.get(sessionId);
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

                  {/* Poll Access Button - Available to ALL users */}
                  {(() => {
                    const poll = getSessionPoll(session.id);
                    if (!poll) return null;

                    return (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 2 }}>
                        <Button
                          variant="contained"
                          startIcon={<HowToVoteIcon />}
                          onClick={() => handleOpenPoll(session)}
                          sx={{ minWidth: 200 }}
                        >
                          {t('attendancePoll.viewPoll')}
                        </Button>
                      </Box>
                    );
                  })()}

                  {/* Show poll results (for coaches) */}
                  {currentUser?.role === 'coach' && (() => {
                    const poll = getSessionPoll(session.id);
                    if (!poll) return null;

                    const results = pollResults.get(poll.id);
                    if (!results || results.totalVotes === 0) return null;

                    // Calculate position counts for training voters
                    const allUsers = getAllUsers();
                    const offensePositions: Record<string, number> = {};
                    const defensePositions: Record<string, number> = {};
                    const specialTeamsPositions: Record<string, number> = {};
                    let offenseCount = 0;
                    let defenseCount = 0;
                    let specialTeamsCount = 0;

                    console.log('[TRAINING DEBUG] Processing training voters:', results.voters.training);

                    results.voters.training.forEach((vote: any) => {
                      // Try to get position from vote first, then fallback to user lookup
                      let userPosition = vote.userPosition;
                      if (!userPosition) {
                        // Fallback to looking up in all users (for backwards compatibility)
                        const user = allUsers.find(u => u.id === vote.userId);
                        userPosition = user?.position;
                      }

                      console.log(`[TRAINING DEBUG] User ${vote.userName} position: ${userPosition} (from vote: ${vote.userPosition})`);

                      if (userPosition) {
                        // Count by unit and organize by position
                        if (OFFENSE_POSITIONS.includes(userPosition as Position)) {
                          offenseCount++;
                          offensePositions[userPosition] = (offensePositions[userPosition] || 0) + 1;
                        } else if (DEFENSE_POSITIONS.includes(userPosition as Position)) {
                          defenseCount++;
                          defensePositions[userPosition] = (defensePositions[userPosition] || 0) + 1;
                        } else if (SPECIAL_TEAMS_POSITIONS.includes(userPosition as Position)) {
                          specialTeamsCount++;
                          specialTeamsPositions[userPosition] = (specialTeamsPositions[userPosition] || 0) + 1;
                        }
                      }
                    });

                    console.log('[TRAINING DEBUG] Offense positions:', offensePositions);
                    console.log('[TRAINING DEBUG] Defense positions:', defensePositions);
                    console.log('[TRAINING DEBUG] Special Teams positions:', specialTeamsPositions);

                    return (
                      <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(0,0,0,0.12)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <HowToVoteIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary" fontWeight="bold">
                            {t('attendancePoll.pollResults')} ({results.totalVotes} {t('attendancePoll.responses')})
                          </Typography>
                        </Box>

                        {/* Training Attendance by Teams and Positions */}
                        {(offenseCount > 0 || defenseCount > 0 || specialTeamsCount > 0) && (
                          <Box sx={{ mb: 2 }}>
                            {/* Offense */}
                            {offenseCount > 0 && (
                              <Box sx={{ mb: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                  <Chip
                                    icon={<CircleIcon sx={{ fontSize: 16, color: 'white !important' }} />}
                                    label={`Offense (${offenseCount})`}
                                    size="small"
                                    sx={{
                                      backgroundColor: '#FF9800',
                                      color: 'white',
                                      fontWeight: 'bold',
                                      fontSize: '0.75rem'
                                    }}
                                  />
                                </Box>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, ml: 1 }}>
                                  {Object.entries(offensePositions)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([position, count]) => (
                                      <Chip
                                        key={`offense-${position}`}
                                        label={`${count}x ${position}`}
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                          borderColor: '#FF9800',
                                          color: '#FF9800',
                                          fontWeight: 'bold',
                                          fontSize: '0.7rem'
                                        }}
                                      />
                                    ))}
                                </Box>
                              </Box>
                            )}

                            {/* Defense */}
                            {defenseCount > 0 && (
                              <Box sx={{ mb: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                  <Chip
                                    icon={<CloseIcon sx={{ fontSize: 16, color: 'white !important' }} />}
                                    label={`Defense (${defenseCount})`}
                                    size="small"
                                    sx={{
                                      backgroundColor: '#2196F3',
                                      color: 'white',
                                      fontWeight: 'bold',
                                      fontSize: '0.75rem'
                                    }}
                                  />
                                </Box>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, ml: 1 }}>
                                  {Object.entries(defensePositions)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([position, count]) => (
                                      <Chip
                                        key={`defense-${position}`}
                                        label={`${count}x ${position}`}
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                          borderColor: '#2196F3',
                                          color: '#2196F3',
                                          fontWeight: 'bold',
                                          fontSize: '0.7rem'
                                        }}
                                      />
                                    ))}
                                </Box>
                              </Box>
                            )}

                            {/* Special Teams */}
                            {specialTeamsCount > 0 && (
                              <Box sx={{ mb: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                  <Chip
                                    icon={<SportsFootballIcon sx={{ fontSize: 16, color: 'white !important' }} />}
                                    label={`Special Teams (${specialTeamsCount})`}
                                    size="small"
                                    sx={{
                                      backgroundColor: '#9C27B0',
                                      color: 'white',
                                      fontWeight: 'bold',
                                      fontSize: '0.75rem'
                                    }}
                                  />
                                </Box>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, ml: 1 }}>
                                  {Object.entries(specialTeamsPositions)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([position, count]) => (
                                      <Chip
                                        key={`st-${position}`}
                                        label={`${count}x ${position}`}
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                          borderColor: '#9C27B0',
                                          color: '#9C27B0',
                                          fontWeight: 'bold',
                                          fontSize: '0.7rem'
                                        }}
                                      />
                                    ))}
                                </Box>
                              </Box>
                            )}
                          </Box>
                        )}

                        {/* Training with team */}
                        {results.training > 0 && (
                          <Box sx={{ mb: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Chip
                                label={`${results.training} ${t('attendancePoll.players')}`}
                                size="small"
                                sx={{ backgroundColor: '#4caf50', color: 'white', minWidth: 60, fontWeight: 'bold' }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {t('attendancePoll.training')}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, ml: 0.5 }}>
                              {results.voters.training.map((vote: any) => (
                                <Chip
                                  key={vote.userId}
                                  label={vote.userName}
                                  size="small"
                                  variant="outlined"
                                  sx={{ borderColor: '#4caf50', color: '#4caf50' }}
                                />
                              ))}
                            </Box>
                          </Box>
                        )}

                        {/* Present (bin dabei) */}
                        {results.present > 0 && (
                          <Box sx={{ mb: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Chip
                                label={`${results.present} ${t('attendancePoll.players')}`}
                                size="small"
                                sx={{ backgroundColor: '#2196f3', color: 'white', minWidth: 60, fontWeight: 'bold' }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {t('attendancePoll.present')}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, ml: 0.5 }}>
                              {results.voters.present.map((vote: any) => (
                                <Chip
                                  key={vote.userId}
                                  label={vote.userName}
                                  size="small"
                                  variant="outlined"
                                  sx={{ borderColor: '#2196f3', color: '#2196f3' }}
                                />
                              ))}
                            </Box>
                          </Box>
                        )}

                        {/* Absent */}
                        {results.absent > 0 && (
                          <Box sx={{ mb: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Chip
                                label={`${results.absent} ${t('attendancePoll.players')}`}
                                size="small"
                                sx={{ backgroundColor: '#f44336', color: 'white', minWidth: 60, fontWeight: 'bold' }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {t('attendancePoll.absent')}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, ml: 0.5 }}>
                              {results.voters.absent.map((vote: any) => (
                                <Chip
                                  key={vote.userId}
                                  label={vote.userName}
                                  size="small"
                                  variant="outlined"
                                  sx={{ borderColor: '#f44336', color: '#f44336' }}
                                />
                              ))}
                            </Box>
                          </Box>
                        )}
                      </Box>
                    );
                  })()}
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

                  {/* Attendees list - show names in mobile */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                      {goingCount} {t('trainingSessions.going')}:
                    </Typography>
                    {goingCount > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {session.attendees
                          .filter(a => a.status === 'going')
                          .map((attendee) => (
                            <Chip
                              key={attendee.userId}
                              label={attendee.userName}
                              size="small"
                              avatar={<Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>{attendee.userName.charAt(0)}</Avatar>}
                              sx={{ fontSize: '0.75rem' }}
                            />
                          ))}
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.disabled">
                        {t('trainingSessions.noAttendees')}
                      </Typography>
                    )}
                  </Box>

                  {/* RSVP Buttons - compact in mobile */}
                  <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 }, justifyContent: 'flex-end' }}>
                    <Button
                      size="small"
                      variant={userStatus === 'going' ? 'contained' : 'outlined'}
                      color="success"
                      onClick={() => handleRSVP(session.id, 'going')}
                      sx={{
                        minWidth: { xs: 'auto', sm: '100px' },
                        px: { xs: 1.5, sm: 2 },
                      }}
                    >
                      <CheckCircleIcon sx={{ fontSize: { xs: 18, sm: 20 }, mr: { xs: 0, sm: 0.5 } }} />
                      <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                        {t('trainingSessions.going')}
                      </Box>
                    </Button>
                    <Button
                      size="small"
                      variant={userStatus === 'not-going' ? 'contained' : 'outlined'}
                      color="error"
                      onClick={() => handleRSVP(session.id, 'not-going')}
                      sx={{
                        minWidth: { xs: 'auto', sm: '120px' },
                        px: { xs: 1.5, sm: 2 },
                      }}
                    >
                      <CancelIcon sx={{ fontSize: { xs: 18, sm: 20 }, mr: { xs: 0, sm: 0.5 } }} />
                      <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                        {t('trainingSessions.notGoing')}
                      </Box>
                    </Button>
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

      {/* Attendance Poll Modal */}
      {selectedPoll && currentUser && (
        <AttendancePollModal
          open={pollModalOpen}
          poll={selectedPoll}
          currentUser={currentUser}
          onClose={handleClosePollModal}
        />
      )}
    </Box>
  );
};
