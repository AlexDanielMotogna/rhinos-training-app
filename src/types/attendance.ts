export type AttendanceStatus = 'on_time' | 'late' | 'absent';

export type Weekday = 'Tue' | 'Thu';

export interface TeamSession {
  start: Date;
  end: Date;
}

export interface AttendanceRow {
  dateISO: string;
  weekday: Weekday;
  start: string;
  end: string;
  status: AttendanceStatus;
  editable?: boolean;
}
