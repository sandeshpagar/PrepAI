export interface AppNotification {
  id: string;
  user_id: string;
  type: 'exam_alert' | 'task_deadline' | 'session_reminder' | 'document_indexed';
  title: string;
  message: string;
  link_url?: string;
  is_read: boolean;
  dedupe_key: string;
  created_at: string;
}

export interface NotificationsListResponse {
  notifications: AppNotification[];
  unread_count: number;
}
