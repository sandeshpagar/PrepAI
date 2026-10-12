export interface UserSettings {
  user_id: string;
  target_study_hours: number;
  preferred_session_duration: number;
  exam_alert_lead_days: number;
  notify_upcoming_deadlines: boolean;
  notify_session_reminders: boolean;
  notify_document_indexing: boolean;
  display_name: string | null;
  university: string | null;
  major: string | null;
  updated_at: string;
}
