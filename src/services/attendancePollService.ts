/**
 * Attendance Poll Service
 * Manages attendance polls with backend + IndexedDB + localStorage support
 */

import type { AttendancePoll, AttendancePollVote, AttendancePollResults } from '../types/attendancePoll';
import { attendancePollService as apiService } from './api';
import { db, addToOutbox } from './db';
import { isOnline } from './sync';

const STORAGE_KEY = 'attendancePolls';

/**
 * Get all polls
 * Priority: Backend (if online) -> IndexedDB -> localStorage
 */
export const getAllPolls = async (): Promise<AttendancePoll[]> => {
  const online = isOnline();

  try {
    if (online) {
      console.log('[POLLS] Fetching polls from backend...');
      const polls = await apiService.getAll() as AttendancePoll[];

      // Update caches
      await db.attendancePolls.clear();
      await db.attendancePolls.bulkPut(polls.map(p => ({
        ...p,
        updatedAt: new Date().toISOString(),
      })));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(polls));

      console.log(`[POLLS] Loaded ${polls.length} polls from backend`);
      return polls;
    } else {
      // Load from IndexedDB cache
      console.log('[POLLS] Loading polls from cache...');
      const cached = await db.attendancePolls.toArray();

      if (cached.length > 0) {
        console.log(`[POLLS] Loaded ${cached.length} polls from IndexedDB`);
        return cached as AttendancePoll[];
      }

      // Fallback to localStorage
      const stored = localStorage.getItem(STORAGE_KEY);
      const polls = stored ? JSON.parse(stored) : [];
      console.log(`[POLLS] Loaded ${polls.length} polls from localStorage`);
      return polls;
    }
  } catch (error) {
    console.error('[POLLS ERROR] Failed to load polls:', error);

    // Fallback to IndexedDB
    const cached = await db.attendancePolls.toArray();
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
  const online = isOnline();

  try {
    if (online) {
      const poll = await apiService.getActive() as AttendancePoll | null;

      // Update cache if poll exists
      if (poll) {
        await db.attendancePolls.put({
          ...poll,
          updatedAt: new Date().toISOString(),
        });
      }

      return poll;
    } else {
      // Get from cache
      const polls = await getAllPolls();
      const now = new Date().toISOString();

      // Find the most recent active poll that hasn't expired
      const activePolls = polls.filter(p => p.isActive && p.expiresAt > now);
      if (activePolls.length === 0) return null;

      // Return the most recently created one
      return activePolls.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    }
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
  const online = isOnline();

  try {
    if (online) {
      const poll = await apiService.getById(id) as AttendancePoll;

      // Update cache
      await db.attendancePolls.put({
        ...poll,
        updatedAt: new Date().toISOString(),
      });

      return poll;
    } else {
      // Get from cache
      const cached = await db.attendancePolls.get(id);
      if (cached) return cached as AttendancePoll;

      // Fallback to localStorage
      const polls = await getAllPolls();
      return polls.find(p => p.id === id) || null;
    }
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
  const online = isOnline();

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
  await db.attendancePolls.put({
    ...newPoll,
    updatedAt: new Date().toISOString(),
  });

  // Try to save to backend
  if (online) {
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
      await db.attendancePolls.put({
        ...created,
        updatedAt: new Date().toISOString(),
      });

      return created;
    } catch (error) {
      console.warn('[POLLS] Failed to save poll to backend, will sync later:', error);
      await addToOutbox('attendancePoll', 'create', newPoll);
    }
  } else {
    // Queue for sync when online
    await addToOutbox('attendancePoll', 'create', newPoll);
    console.log('[POLLS] Poll queued for sync when online');
  }

  return newPoll;
};

/**
 * Check if user has voted in a poll
 */
export const hasUserVoted = async (pollId: string, userId: string): Promise<boolean> => {
  const poll = await getPollById(pollId);
  if (!poll) return false;

  return poll.votes.some(v => v.userId === userId);
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
  const online = isOnline();

  // Update local cache first
  const polls = await getAllPolls();
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

  // Update caches
  polls[pollIndex] = poll;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(polls));
  await db.attendancePolls.put({
    ...poll,
    updatedAt: new Date().toISOString(),
  });

  // Try to update backend
  if (online) {
    try {
      await apiService.vote(pollId, option);
      console.log('[POLLS] Vote saved to backend');
    } catch (error) {
      console.warn('[POLLS] Failed to save vote to backend, will sync later:', error);
      await addToOutbox('attendancePoll', 'vote', { pollId, userId, option });
    }
  } else {
    await addToOutbox('attendancePoll', 'vote', { pollId, userId, option });
    console.log('[POLLS] Vote queued for sync when online');
  }

  return true;
};

/**
 * Get poll results
 */
export const getPollResults = async (pollId: string): Promise<AttendancePollResults | null> => {
  const online = isOnline();

  try {
    if (online) {
      return await apiService.getResults(pollId) as AttendancePollResults;
    }
  } catch (error) {
    console.warn('[POLLS] Failed to get results from backend, using local cache:', error);
  }

  // Calculate results from local poll data
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

  return results;
};

/**
 * Close/deactivate a poll
 */
export const closePoll = async (pollId: string): Promise<boolean> => {
  const online = isOnline();

  // Update local cache
  const polls = await getAllPolls();
  const pollIndex = polls.findIndex(p => p.id === pollId);

  if (pollIndex === -1) return false;

  polls[pollIndex].isActive = false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(polls));
  await db.attendancePolls.put({
    ...polls[pollIndex],
    updatedAt: new Date().toISOString(),
  });

  // Try to update backend
  if (online) {
    try {
      await apiService.close(pollId);
      console.log('[POLLS] Poll closed on backend');
    } catch (error) {
      console.warn('[POLLS] Failed to close poll on backend:', error);
      await addToOutbox('attendancePoll', 'close', { pollId });
    }
  } else {
    await addToOutbox('attendancePoll', 'close', { pollId });
    console.log('[POLLS] Poll close queued for sync when online');
  }

  return true;
};

/**
 * Delete poll
 */
export const deletePoll = async (pollId: string): Promise<boolean> => {
  const online = isOnline();

  // Remove from caches
  const polls = await getAllPolls();
  const filteredPolls = polls.filter(p => p.id !== pollId);

  if (filteredPolls.length === polls.length) return false;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredPolls));
  await db.attendancePolls.delete(pollId);

  // Try to delete from backend
  if (online) {
    try {
      await apiService.delete(pollId);
      console.log('[POLLS] Poll deleted from backend');
    } catch (error) {
      console.warn('[POLLS] Failed to delete poll from backend:', error);
      await addToOutbox('attendancePoll', 'delete', { pollId });
    }
  } else {
    await addToOutbox('attendancePoll', 'delete', { pollId });
    console.log('[POLLS] Poll delete queued for sync when online');
  }

  return true;
};

/**
 * Get user's vote in a poll
 */
export const getUserVote = async (pollId: string, userId: string): Promise<AttendancePollVote | null> => {
  const poll = await getPollById(pollId);
  if (!poll) return null;

  return poll.votes.find(v => v.userId === userId) || null;
};
