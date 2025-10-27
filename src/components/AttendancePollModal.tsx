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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import PeopleIcon from '@mui/icons-material/People';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import { useI18n } from '../i18n/I18nProvider';
import { submitVote, getPollResults, getUserVote } from '../services/attendancePollService';
import { getUser } from '../services/mock';
import type { AttendancePoll } from '../types/attendancePoll';

interface AttendancePollModalProps {
  poll: AttendancePoll;
  onClose: () => void;
  canDismiss?: boolean; // If false, user must vote before closing
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

  useEffect(() => {
    if (!currentUser) return;

    // Check if user has already voted
    const checkVote = async () => {
      console.log('[POLL DEBUG] Checking vote for user:', currentUser.id, 'poll:', poll.id);
      console.log('[POLL DEBUG] Poll data:', poll);
      
      const existingVote = await getUserVote(poll.id, currentUser.id);
      console.log('[POLL DEBUG] Existing vote found:', existingVote);
      
      // Load results
      const pollResults = await getPollResults(poll.id);
      console.log('[POLL DEBUG] Poll results:', pollResults);
      setResults(pollResults);
      
      if (existingVote) {
        console.log('[POLL DEBUG] User has voted:', existingVote.option);
        setSelectedOption(existingVote.option);
        setHasVoted(true);
      } else {
        console.log('[POLL DEBUG] User has not voted yet');
        setHasVoted(false);
      }
    };
    
    checkVote();
  }, [poll.id, currentUser]);

  const handleSubmit = async () => {
    if (!currentUser || !selectedOption) return;

    console.log('[POLL DEBUG] Submitting vote:', selectedOption);
    const success = await submitVote(poll.id, currentUser.id, currentUser.name, selectedOption);
    console.log('[POLL DEBUG] Vote submission result:', success);

    if (success) {
      setHasVoted(true);
      const newResults = await getPollResults(poll.id);
      setResults(newResults);

      // Auto-close after voting if canDismiss is true
      if (canDismiss) {
        setTimeout(() => onClose(), 1500);
      }
    }
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
        {hasVoted ? (
          <>
            <Box sx={{ textAlign: 'center', py: 2, mb: 3 }}>
              <Typography variant="h6" color="success.main" gutterBottom>
                {t('attendancePoll.thankYou')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('attendancePoll.voteRecorded')}
              </Typography>
            </Box>

            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              {t('attendancePoll.results')}
            </Typography>

            {/* Results */}
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

              {/* Present (bin dabei) */}
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
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t('attendancePoll.question')}
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

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleSubmit}
              disabled={!selectedOption}
              sx={{ mt: 3 }}
            >
              {t('attendancePoll.submitVote')}
            </Button>

            {!canDismiss && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
                {t('attendancePoll.mustVote')}
              </Typography>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
