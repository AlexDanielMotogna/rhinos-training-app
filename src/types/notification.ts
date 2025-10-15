export type NotificationSeverity = 'low' | 'medium' | 'high';

export interface HardNotification {
  id: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  timestamp: Date;
  acknowledged?: boolean;
}

export type NotificationType =
  | 'new_plan'
  | 'plan_updated'
  | 'new_exercise'
  | 'free_work_reviewed'
  | 'attendance_reminder'
  | 'performance_alert';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}
