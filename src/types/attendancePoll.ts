export interface AttendancePollVote {
  userId: string;
  userName: string;
  option: 'training' | 'present' | 'absent'; // trainiere mit, bin dabei, abwesend
  timestamp: string;
  userPosition?: string; // Position of the user who voted
}

export interface AttendancePoll {
  id: string;
  sessionId: string; // Link to training session
  sessionName: string;
  sessionDate: string;
  createdBy: string; // Coach who created it
  createdAt: string;
  expiresAt: string; // When poll closes
  isActive: boolean;
  votes: AttendancePollVote[];
}

export interface AttendancePollResults {
  training: number; // Count of "trainiere mit"
  present: number; // Count of "bin dabei"
  absent: number; // Count of "abwesend"
  totalVotes: number;
  voters: {
    training: AttendancePollVote[];
    present: AttendancePollVote[];
    absent: AttendancePollVote[];
  };
}
