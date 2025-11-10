import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  Button,
  Divider,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Avatar,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import PeopleIcon from '@mui/icons-material/People';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import { useI18n } from '../i18n/I18nProvider';
import { submitVote, getPollResults, getUserVote } from '../services/attendancePollService';
import { getUser } from '../services/userProfile';
import type { AttendancePoll } from '../types/attendancePoll';
import { apiCall } from '../services/api';

interface AttendancePollModalProps {
  poll: AttendancePoll;
  onClose: () => void;
  canDismiss?: boolean; // If false, user must vote before closing
}

interface Attendee {
  userId: string;
  userName: string;
  userPosition?: string;
  option: 'training' | 'present';
  timestamp: string;
}

export const AttendancePollModal: React.FC<AttendancePollModalProps> = ({
  poll,
  onClose,
  canDismiss = false,
}) => {
  const { t } = useI18n();
  const currentUser = getUser();
  const [selectedOption, setSelectedOption] = useState<'training' | 'present' | 'absent' | null>(null);
  const [results, setResults] = useState<any>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChangingVote, setIsChangingVote] = useState(false);
  const [attendees, setAttendees] = useState<Attendee[]>([]);

  useEffect(() => {
    loadPollData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poll.id]);

  const loadPollData = async () => {
    if (!currentUser || isLoading) return;

    setIsLoading(true);
    try {
      console.log('[POLL DEBUG] Loading poll data for user:', currentUser.id, 'poll:', poll.id);

      // Load vote status
      const existingVote = await getUserVote(poll.id, currentUser.id);
      console.log('[POLL DEBUG] Existing vote found:', existingVote);

      // Load results
      const pollResults = await getPollResults(poll.id);
      console.log('[POLL DEBUG] Poll results:', pollResults);
      setResults(pollResults);

      // Load attendees list (for all users)
      try {
        const attendeesData = await apiCall(`/attendance-polls/${poll.id}/attendees`);
        setAttendees(attendeesData.attendees || []);
      } catch (err) {
        console.error('[POLL] Failed to load attendees:', err);
        setAttendees([]);
      }

      if (existingVote) {
        console.log('[POLL DEBUG] User has voted:', existingVote.option);
        setSelectedOption(existingVote.option);
        setHasVoted(true);
      } else {
        console.log('[POLL DEBUG] User has not voted yet');
        setHasVoted(false);
        setSelectedOption(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentUser || !selectedOption) return;

    console.log('[POLL DEBUG] Submitting vote:', selectedOption);
    const success = await submitVote(poll.id, currentUser.id, currentUser.name, selectedOption);
    console.log('[POLL DEBUG] Vote submission result:', success);

    if (success) {
      // Reload all poll data
      await loadPollData();

      setIsChangingVote(false);

      // Auto-close after voting (unless changing vote)
      if (!hasVoted) {
        setTimeout(() => onClose(), canDismiss ? 1500 : 2000);
      }
    }
  };

  const handleChangeVote = () => {
    setIsChangingVote(true);
  };

  const handleCancelChange = () => {
    // Restore original vote
    setIsChangingVote(false);
    // selectedOption already has the original vote
  };

  const handleClose = () => {
    // Only allow closing if canDismiss is true or user has voted
    if (canDismiss || hasVoted) {
      onClose();
    }
  };

  const getOptionIcon = (option: 'training' | 'present' | 'absent') => {
    switch (option) {
      case 'training':
        return <HowToRegIcon sx={{ fontSize: 40 }} />;
      case 'present':
        return <PeopleIcon sx={{ fontSize: 40 }} />;
      case 'absent':
        return <PersonOffIcon sx={{ fontSize: 40 }} />;
    }
  };

  const getOptionColor = (option: 'training' | 'present' | 'absent') => {
    switch (option) {
      case 'training':
        return 'success.main';
      case 'present':
        return 'info.main';
      case 'absent':
        return 'error.main';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const showVotingInterface = !hasVoted || isChangingVote;

  return (
    <Dialog
      open={true}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={!canDismiss && !hasVoted}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {t('attendancePoll.title')}
          </Typography>
          {(canDismiss || hasVoted) && (
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          )}
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {poll.sessionName}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formatDate(poll.sessionDate)}
        </Typography>
      </DialogTitle>

      <Divider />

      <DialogContent>
        {showVotingInterface ? (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {isChangingVote ? t('attendancePoll.changeQuestion') : t('attendancePoll.question')}
            </Typography>

            <RadioGroup
              value={selectedOption || ''}
              onChange={(e) => setSelectedOption(e.target.value as 'training' | 'present' | 'absent')}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Training */}
                <Box
                  sx={{
                    p: 2,
                    border: '2px solid',
                    borderColor: selectedOption === 'training' ? 'success.main' : 'grey.300',
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'success.main',
                      backgroundColor: 'success.light',
                    },
                  }}
                  onClick={() => setSelectedOption('training')}
                >
                  <FormControlLabel
                    value="training"
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Box sx={{ color: getOptionColor('training') }}>
                          {getOptionIcon('training')}
                        </Box>
                        <Box>
                          <Typography variant="body1" fontWeight="bold">
                            {t('attendancePoll.training')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t('attendancePoll.trainingDesc')}
                          </Typography>
                        </Box>
                      </Box>
                    }
                    sx={{ width: '100%', m: 0 }}
                  />
                </Box>

                {/* Present */}
                <Box
                  sx={{
                    p: 2,
                    border: '2px solid',
                    borderColor: selectedOption === 'present' ? 'info.main' : 'grey.300',
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'info.main',
                      backgroundColor: 'info.light',
                    },
                  }}
                  onClick={() => setSelectedOption('present')}
                >
                  <FormControlLabel
                    value="present"
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Box sx={{ color: getOptionColor('present') }}>
                          {getOptionIcon('present')}
                        </Box>
                        <Box>
                          <Typography variant="body1" fontWeight="bold">
                            {t('attendancePoll.present')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t('attendancePoll.presentDesc')}
                          </Typography>
                        </Box>
                      </Box>
                    }
                    sx={{ width: '100%', m: 0 }}
                  />
                </Box>

                {/* Absent */}
                <Box
                  sx={{
                    p: 2,
                    border: '2px solid',
                    borderColor: selectedOption === 'absent' ? 'error.main' : 'grey.300',
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'error.main',
                      backgroundColor: 'error.light',
                    },
                  }}
                  onClick={() => setSelectedOption('absent')}
                >
                  <FormControlLabel
                    value="absent"
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Box sx={{ color: getOptionColor('absent') }}>
                          {getOptionIcon('absent')}
                        </Box>
                        <Box>
                          <Typography variant="body1" fontWeight="bold">
                            {t('attendancePoll.absent')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t('attendancePoll.absentDesc')}
                          </Typography>
                        </Box>
                      </Box>
                    }
                    sx={{ width: '100%', m: 0 }}
                  />
                </Box>
              </Box>
            </RadioGroup>

            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              {isChangingVote && (
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  onClick={handleCancelChange}
                >
                  {t('common.cancel')}
                </Button>
              )}
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleSubmit}
                disabled={!selectedOption}
              >
                {isChangingVote ? t('attendancePoll.updateVote') : t('attendancePoll.submitVote')}
              </Button>
            </Box>

            {!canDismiss && !isChangingVote && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
                {t('attendancePoll.mustVote')}
              </Typography>
            )}
          </>
        ) : (
          <>
            <Box sx={{ textAlign: 'center', py: 2, mb: 3 }}>
              <Typography variant="h6" color="success.main" gutterBottom>
                {t('attendancePoll.thankYou')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('attendancePoll.voteRecorded')}
              </Typography>
            </Box>

            {/* Change Vote Button */}
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleChangeVote}
              >
                {t('attendancePoll.changeVote')}
              </Button>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Attendees List - Visible to all users */}
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              {t('attendancePoll.attendeesList')} ({attendees.length})
            </Typography>

            {attendees.length > 0 ? (
              <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                {attendees.map((attendee) => (
                  <ListItem key={attendee.userId}>
                    <Avatar sx={{ width: 32, height: 32, mr: 2, fontSize: '0.875rem' }}>
                      {attendee.userName.charAt(0).toUpperCase()}
                    </Avatar>
                    <ListItemText
                      primary={attendee.userName}
                      secondary={attendee.userPosition || ''}
                    />
                    <Chip
                      size="small"
                      label={attendee.option === 'training' ? t('attendancePoll.training') : t('attendancePoll.present')}
                      color={attendee.option === 'training' ? 'success' : 'info'}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                {t('attendancePoll.noAttendees')}
              </Typography>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Results Summary */}
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              {t('attendancePoll.results')}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Training */}
              <Box
                sx={{
                  p: 2,
                  border: '2px solid',
                  borderColor: selectedOption === 'training' ? 'success.main' : 'grey.300',
                  borderRadius: 2,
                  backgroundColor: selectedOption === 'training' ? 'success.light' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ color: 'success.main' }}>
                    {getOptionIcon('training')}
                  </Box>
                  <Box>
                    <Typography variant="body1" fontWeight="bold">
                      {t('attendancePoll.training')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('attendancePoll.trainingDesc')}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={results?.training || 0}
                  color="success"
                  sx={{ minWidth: 50, fontWeight: 'bold', fontSize: 16 }}
                />
              </Box>

              {/* Present */}
              <Box
                sx={{
                  p: 2,
                  border: '2px solid',
                  borderColor: selectedOption === 'present' ? 'info.main' : 'grey.300',
                  borderRadius: 2,
                  backgroundColor: selectedOption === 'present' ? 'info.light' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ color: 'info.main' }}>
                    {getOptionIcon('present')}
                  </Box>
                  <Box>
                    <Typography variant="body1" fontWeight="bold">
                      {t('attendancePoll.present')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('attendancePoll.presentDesc')}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={results?.present || 0}
                  color="info"
                  sx={{ minWidth: 50, fontWeight: 'bold', fontSize: 16 }}
                />
              </Box>

              {/* Absent */}
              <Box
                sx={{
                  p: 2,
                  border: '2px solid',
                  borderColor: selectedOption === 'absent' ? 'error.main' : 'grey.300',
                  borderRadius: 2,
                  backgroundColor: selectedOption === 'absent' ? 'error.light' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ color: 'error.main' }}>
                    {getOptionIcon('absent')}
                  </Box>
                  <Box>
                    <Typography variant="body1" fontWeight="bold">
                      {t('attendancePoll.absent')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('attendancePoll.absentDesc')}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={results?.absent || 0}
                  color="error"
                  sx={{ minWidth: 50, fontWeight: 'bold', fontSize: 16 }}
                />
              </Box>
            </Box>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                {t('attendancePoll.totalVotes')}: {results?.totalVotes || 0}
              </Typography>
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
