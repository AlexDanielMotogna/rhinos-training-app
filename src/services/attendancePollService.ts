/**
 * Attendance Poll Service
 * Manages attendance polls with backend + localStorage support
 */

import type { AttendancePoll, AttendancePollVote, AttendancePollResults } from '../types/attendancePoll';
import { attendancePollService as apiService } from './api';

const STORAGE_KEY = 'attendancePolls';

/**
 * Get all polls from backend
 */
export const getAllPolls = async (): Promise<AttendancePoll[]> => {
  try {
    console.log('[POLLS] Fetching polls from backend...');
    const polls = await apiService.getAll() as AttendancePoll[];

    // Update localStorage cache
    localStorage.setItem(STORAGE_KEY, JSON.stringify(polls));

    console.log(`[POLLS] Loaded ${polls.length} polls from backend`);
    return polls;
  } catch (error) {
    console.error('[POLLS ERROR] Failed to load polls:', error);

    // Fallback to localStorage
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
    return poll;
  } catch (error) {
    console.error('[POLLS ERROR] Failed to get active poll:', error);

    // Fallback to localStorage cache
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
    return poll;
  } catch (error) {
    console.error('[POLLS ERROR] Failed to get poll:', error);

    // Fallback to localStorage
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
  try {
    const created = await apiService.create({
      sessionId,
      sessionName,
      sessionDate,
      expiresAt,
    }) as AttendancePoll;

    console.log('[POLLS] Poll saved to backend:', created.id);

    // Update localStorage cache
    const polls = await getAllPolls();
    polls.push(created);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(polls));

    return created;
  } catch (error) {
    console.error('[POLLS] Failed to create poll:', error);
    throw error;
  }
};

/**
 * Check if user has voted in a poll
 */
export const hasUserVoted = async (pollId: string, userId: string): Promise<boolean> => {
  try {
    console.log('[POLLS] Checking vote status from backend...');
    const poll = await apiService.getById(pollId) as AttendancePoll;

    if (poll) {
      // Update localStorage cache
      const polls = await getAllPolls();
      const pollIndex = polls.findIndex(p => p.id === pollId);
      if (pollIndex !== -1) {
        polls[pollIndex] = poll;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(polls));
      }

      const hasVoted = poll.votes?.some(v => v.userId === userId) || false;
      console.log('[POLLS] User has voted:', hasVoted);
      return hasVoted;
    }
    return false;
  } catch (error) {
    console.error('[POLLS] Failed to check vote status:', error);

    // Fallback to localStorage cache
    const poll = await getPollById(pollId);
    if (!poll) return false;
    return poll.votes.some(v => v.userId === userId);
  }
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
  try {
    await apiService.vote(pollId, option);
    console.log('[POLLS] Vote saved to backend');

    // Update local cache
    const polls = await getAllPolls();
    const pollIndex = polls.findIndex(p => p.id === pollId);

    if (pollIndex !== -1) {
      const poll = polls[pollIndex];

      // Check if user already voted
      const existingVoteIndex = poll.votes.findIndex(v => v.userId === userId);

      // Get user position from current logged in user
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

      // Update cache
      polls[pollIndex] = poll;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(polls));
    }

    return true;
  } catch (error) {
    console.error('[POLLS] Failed to save vote:', error);
    return false;
  }
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

    // Fallback: Calculate results from local cache
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
  }
};

/**
 * Close/deactivate a poll
 */
export const closePoll = async (pollId: string): Promise<boolean> => {
  try {
    await apiService.close(pollId);
    console.log('[POLLS] Poll closed on backend');

    // Update local cache
    const polls = await getAllPolls();
    const pollIndex = polls.findIndex(p => p.id === pollId);

    if (pollIndex !== -1) {
      polls[pollIndex].isActive = false;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(polls));
    }

    return true;
  } catch (error) {
    console.error('[POLLS] Failed to close poll:', error);
    return false;
  }
};

/**
 * Delete poll
 */
export const deletePoll = async (pollId: string): Promise<boolean> => {
  try {
    await apiService.delete(pollId);
    console.log('[POLLS] Poll deleted from backend');

    // Remove from local cache
    const polls = await getAllPolls();
    const filteredPolls = polls.filter(p => p.id !== pollId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredPolls));

    return true;
  } catch (error) {
    console.error('[POLLS] Failed to delete poll:', error);
    return false;
  }
};

/**
 * Get user's vote in a poll
 */
export const getUserVote = async (pollId: string, userId: string): Promise<AttendancePollVote | null> => {
  try {
    console.log('[POLLS] Fetching user vote from backend...');
    const poll = await apiService.getById(pollId) as AttendancePoll;

    if (poll) {
      // Update localStorage cache
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
    return null;
  } catch (error) {
    console.error('[POLLS] Failed to get user vote:', error);

    // Fallback to local cache
    const poll = await getPollById(pollId);
    if (!poll) return null;
    return poll.votes.find(v => v.userId === userId) || null;
  }
};
