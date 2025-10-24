import type { AttendancePoll, AttendancePollVote, AttendancePollResults } from '../types/attendancePoll';

const STORAGE_KEY = 'attendancePolls';

// Get all polls
export const getAllPolls = (): AttendancePoll[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

// Get active poll (the one that should be shown to users)
export const getActivePoll = (): AttendancePoll | null => {
  const polls = getAllPolls();
  const now = new Date().toISOString();

  // Find the most recent active poll that hasn't expired
  const activePolls = polls.filter(p => p.isActive && p.expiresAt > now);
  if (activePolls.length === 0) return null;

  // Return the most recently created one
  return activePolls.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
};

// Get poll by ID
export const getPollById = (id: string): AttendancePoll | null => {
  const polls = getAllPolls();
  return polls.find(p => p.id === id) || null;
};

// Create new poll
export const createPoll = (
  sessionId: string,
  sessionName: string,
  sessionDate: string,
  createdBy: string,
  expiresAt: string
): AttendancePoll => {
  const polls = getAllPolls();

  const newPoll: AttendancePoll = {
    id: `poll-${Date.now()}`,
    sessionId,
    sessionName,
    sessionDate,
    createdBy,
    createdAt: new Date().toISOString(),
    expiresAt,
    isActive: true,
    votes: [],
  };

  polls.push(newPoll);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(polls));

  return newPoll;
};

// Check if user has voted in a poll
export const hasUserVoted = (pollId: string, userId: string): boolean => {
  const poll = getPollById(pollId);
  if (!poll) return false;

  return poll.votes.some(v => v.userId === userId);
};

// Submit vote
export const submitVote = (
  pollId: string,
  userId: string,
  userName: string,
  option: 'training' | 'present' | 'absent'
): boolean => {
  const polls = getAllPolls();
  const pollIndex = polls.findIndex(p => p.id === pollId);

  if (pollIndex === -1) return false;

  const poll = polls[pollIndex];

  // Check if user already voted
  const existingVoteIndex = poll.votes.findIndex(v => v.userId === userId);

  const newVote: AttendancePollVote = {
    userId,
    userName,
    option,
    timestamp: new Date().toISOString(),
  };

  if (existingVoteIndex !== -1) {
    // Update existing vote
    poll.votes[existingVoteIndex] = newVote;
  } else {
    // Add new vote
    poll.votes.push(newVote);
  }

  polls[pollIndex] = poll;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(polls));

  return true;
};

// Get poll results
export const getPollResults = (pollId: string): AttendancePollResults | null => {
  const poll = getPollById(pollId);
  if (!poll) return null;

  const results: AttendancePollResults = {
    training: 0,
    present: 0,
    absent: 0,
    totalVotes: poll.votes.length,
    voters: {
      training: [],
      present: [],
      absent: [],
    },
  };

  poll.votes.forEach(vote => {
    if (vote.option === 'training') {
      results.training++;
      results.voters.training.push(vote);
    } else if (vote.option === 'present') {
      results.present++;
      results.voters.present.push(vote);
    } else if (vote.option === 'absent') {
      results.absent++;
      results.voters.absent.push(vote);
    }
  });

  return results;
};

// Close/deactivate a poll
export const closePoll = (pollId: string): boolean => {
  const polls = getAllPolls();
  const pollIndex = polls.findIndex(p => p.id === pollId);

  if (pollIndex === -1) return false;

  polls[pollIndex].isActive = false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(polls));

  return true;
};

// Delete poll
export const deletePoll = (pollId: string): boolean => {
  const polls = getAllPolls();
  const filteredPolls = polls.filter(p => p.id !== pollId);

  if (filteredPolls.length === polls.length) return false;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredPolls));
  return true;
};

// Get user's vote in a poll
export const getUserVote = (pollId: string, userId: string): AttendancePollVote | null => {
  const poll = getPollById(pollId);
  if (!poll) return null;

  return poll.votes.find(v => v.userId === userId) || null;
};
