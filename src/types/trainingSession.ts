export type SessionType = 'gym' | 'outdoor' | 'coach-plan' | 'free-training';

export type SessionCategory = 'team' | 'private';

export type RSVPStatus = 'going' | 'not-going' | 'pending';

export type CheckInStatus = 'on_time' | 'late' | 'absent';

export interface TrainingSession {
  id: string;
  creatorId: string;
  creatorName: string;
  sessionCategory: SessionCategory; // team = mandatory coach sessions, private = voluntary user sessions
  type: SessionType;
  title: string;
  location: string;
  address?: string;
  date: string; // ISO string
  time: string; // HH:mm format
  description?: string;
  planId?: string; // If using a coach plan
  attendees: {
    userId: string;
    userName: string;
    status: RSVPStatus;
  }[];
  checkIns?: {
    userId: string;
    userName: string;
    checkedInAt: string; // ISO timestamp
    status: CheckInStatus;
  }[];
  createdAt: string;
}
