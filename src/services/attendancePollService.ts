/**
 * Attendance Poll Service
 * Manages attendance polls with backend + IndexedDB + localStorage support
 */

import type { AttendancePoll, AttendancePollVote, AttendancePollResults } from '../types/attendancePoll';
import { attendancePollService as apiService } from './api';

const STORAGE_KEY = 'attendancePolls';

/**
 * Get all polls
 * Priority: Backend (if online) -> IndexedDB -> localStorage
 */
export const getAllPolls = async (): Promise<AttendancePoll[]> => {
  try {
    console.log('[POLLS] Fetching polls from backend...');
    const polls = await apiService.getAll() as AttendancePoll[];

    // Update caches
      ...p,
      updatedAt: new Date().toISOString(),
    })));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(polls));

    console.log(`[POLLS] Loaded ${polls.length} polls from backend`);
    return polls;
  } catch (error) {
    console.error('[POLLS ERROR] Failed to load polls:', error);

    // Fallback to IndexedDB
    if (cached.length > 0) {
      return cached as AttendancePoll[];
    }

    // Last resort: localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }
};

/**
 * Get active poll (the one that should be shown to users)
 */
export const getActivePoll = async (): Promise<AttendancePoll | null> => {
  try {
    const poll = await apiService.getActive() as AttendancePoll | null;

    // Update cache if poll exists
    if (poll) {
        ...poll,
        updatedAt: new Date().toISOString(),
      });
    }

    return poll;
  } catch (error) {
    console.error('[POLLS ERROR] Failed to get active poll:', error);

    // Fallback to cache
    const polls = await getAllPolls();
    const now = new Date().toISOString();
    const activePolls = polls.filter(p => p.isActive && p.expiresAt > now);
    if (activePolls.length === 0) return null;
    return activePolls.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  }
};

/**
 * Get poll by ID
 */
export const getPollById = async (id: string): Promise<AttendancePoll | null> => {
  try {
    const poll = await apiService.getById(id) as AttendancePoll;

    // Update cache
      ...poll,
      updatedAt: new Date().toISOString(),
    });

    return poll;
  } catch (error) {
    console.error('[POLLS ERROR] Failed to get poll:', error);

    const polls = await getAllPolls();
    return polls.find(p => p.id === id) || null;
  }
};

/**
 * Create new poll
 */
export const createPoll = async (
  sessionId: string,
  sessionName: string,
  sessionDate: string,
  createdBy: string,
  expiresAt: string
): Promise<AttendancePoll> => {
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

  // Save to localStorage first (immediate feedback)
  const polls = await getAllPolls();
  polls.push(newPoll);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(polls));

  // Save to IndexedDB
    ...newPoll,
    updatedAt: new Date().toISOString(),
  });

  // Try to save to backend
  try {
    const created = await apiService.create({
      sessionId,
      sessionName,
      sessionDate,
      expiresAt,
    }) as AttendancePoll;

    console.log('[POLLS] Poll saved to backend:', created.id);

    // Update local caches with backend ID
    newPoll.id = created.id;
      ...created,
      updatedAt: new Date().toISOString(),
    });

    return created;
  } catch (error) {
    console.warn('[POLLS] Failed to save poll to backend, will sync later:', error);
    await addToOutbox('attendancePoll', 'create', newPoll);
  }

  return newPoll;
};

/**
 * Check if user has voted in a poll
 * Priority: Backend (if online) -> Local cache
 */
export const hasUserVoted = async (pollId: string, userId: string): Promise<boolean> => {
  try {
    console.log('[POLLS] Checking vote status from backend...');
    const poll = await apiService.getById(pollId) as AttendancePoll;

    if (poll) {
      // Update local cache with fresh backend data
        ...poll,
        updatedAt: new Date().toISOString(),
      });

      // Also update localStorage cache
      const polls = await getAllPolls();
      const pollIndex = polls.findIndex(p => p.id === pollId);
      if (pollIndex !== -1) {
        polls[pollIndex] = poll;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(polls));
      }

      const hasVoted = poll.votes?.some(v => v.userId === userId) || false;
      console.log('[POLLS] User has voted (from backend):', hasVoted);
      return hasVoted;
    }
  } catch (error) {
    console.error('[POLLS] CRITICAL: Failed to check vote status from backend:', error);
    // When backend fails, we should NOT trust local cache
    // Return false to be safe and show the poll again
    return false;
  }

  return false;
};

/**
 * Submit vote
 */
export const submitVote = async (
  pollId: string,
  userId: string,
  userName: string,
  option: 'training' | 'present' | 'absent'
): Promise<boolean> => {
  // Update local cache first
  const polls = await getAllPolls();
  const pollIndex = polls.findIndex(p => p.id === pollId);

  if (pollIndex === -1) return false;

  const poll = polls[pollIndex];

  // Check if user already voted
  const existingVoteIndex = poll.votes.findIndex(v => v.userId === userId);

  // Get user position from current logged in user
  // Note: userId should always be the current authenticated user's ID
  const { getUser } = await import('./mock');
  const currentUser = getUser();

  // Validate that the userId matches the current user (security check)
  if (currentUser?.id !== userId) {
    console.warn('[POLLS] UserId mismatch - security issue detected');
    return false;
  }

  const newVote: AttendancePollVote = {
    userId,
    userName,
    option,
    timestamp: new Date().toISOString(),
    userPosition: currentUser?.position || undefined,
  };

  if (existingVoteIndex !== -1) {
    // Update existing vote
    poll.votes[existingVoteIndex] = newVote;
  } else {
    // Add new vote
    poll.votes.push(newVote);
  }

  // Update caches
  polls[pollIndex] = poll;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(polls));
    ...poll,
    updatedAt: new Date().toISOString(),
  });

  // Try to update backend
  try {
    await apiService.vote(pollId, option);
    console.log('[POLLS] Vote saved to backend');
  } catch (error) {
    console.warn('[POLLS] Failed to save vote to backend, will sync later:', error);
    await addToOutbox('attendancePoll', 'vote', { pollId, userId, option });
  }

  return true;
};

/**
 * Get poll results
 */
export const getPollResults = async (pollId: string): Promise<AttendancePollResults | null> => {
  try {
    console.log('[POLLS] Fetching results from backend...');
    const results = await apiService.getResults(pollId) as AttendancePollResults;
    console.log('[POLLS] Results from backend:', results);
    return results;
  } catch (error) {
    console.error('[POLLS] Failed to get results from backend:', error);
    // Continue to local calculation as fallback
  }

  // Calculate results from local poll data (backend failed)
  console.log('[POLLS] Calculating results from local cache...');
  const poll = await getPollById(pollId);
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

  console.log('[POLLS] Results from local cache:', results);
  return results;
};

/**
 * Close/deactivate a poll
 */
export const closePoll = async (pollId: string): Promise<boolean> => {
  // Update local cache
  const polls = await getAllPolls();
  const pollIndex = polls.findIndex(p => p.id === pollId);

  if (pollIndex === -1) return false;

  polls[pollIndex].isActive = false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(polls));
    ...polls[pollIndex],
    updatedAt: new Date().toISOString(),
  });

  // Try to update backend
  try {
    await apiService.close(pollId);
    console.log('[POLLS] Poll closed on backend');
  } catch (error) {
    console.warn('[POLLS] Failed to close poll on backend:', error);
    await addToOutbox('attendancePoll', 'close', { pollId });
  }

  return true;
};

/**
 * Delete poll
 */
export const deletePoll = async (pollId: string): Promise<boolean> => {
  // Remove from caches
  const polls = await getAllPolls();
  const filteredPolls = polls.filter(p => p.id !== pollId);

  if (filteredPolls.length === polls.length) return false;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredPolls));

  // Try to delete from backend
  try {
    await apiService.delete(pollId);
    console.log('[POLLS] Poll deleted from backend');
  } catch (error) {
    console.warn('[POLLS] Failed to delete poll from backend:', error);
    await addToOutbox('attendancePoll', 'delete', { pollId });
  }

  return true;
};

/**
 * Get user's vote in a poll
 * Priority: Backend (if online) -> Local cache
 */
export const getUserVote = async (pollId: string, userId: string): Promise<AttendancePollVote | null> => {
  try {
    console.log('[POLLS] Fetching user vote from backend...');
    const poll = await apiService.getById(pollId) as AttendancePoll;

    if (poll) {
      // Update local cache with fresh backend data
        ...poll,
        updatedAt: new Date().toISOString(),
      });

      // Also update localStorage cache
      const polls = await getAllPolls();
      const pollIndex = polls.findIndex(p => p.id === pollId);
      if (pollIndex !== -1) {
        polls[pollIndex] = poll;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(polls));
      }

      const userVote = poll.votes?.find(v => v.userId === userId) || null;
      console.log('[POLLS] User vote from backend:', userVote ? userVote.option : 'no vote');
      return userVote;
    }
  } catch (error) {
    console.error('[POLLS] CRITICAL: Failed to get user vote from backend:', error);
    // When backend fails, we should NOT trust local cache
    // Return null to be safe and show the poll again
    return null;
  }

  return null;
};
