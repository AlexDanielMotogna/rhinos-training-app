export type SessionType = 'gym' | 'outdoor' | 'coach-plan' | 'free-training';

export type RSVPStatus = 'going' | 'not-going' | 'pending';

export interface TrainingSession {
  id: string;
  creatorId: string;
  creatorName: string;
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
  createdAt: string;
}
