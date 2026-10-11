export interface Topic {
  id: string;
  subject_id: string;
  user_id: string;
  title: string;
  importance: number;
  estimated_minutes: number;
  difficulty: number;
  status: 'todo' | 'in_progress' | 'completed';
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  user_id: string;
  title: string;
  code?: string;
  color: string;
  term?: string;
  target_completion_date?: string;
  topics: Topic[];
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  subject_id?: string;
  topic_id?: string;
  title: string;
  description?: string;
  category: 'assignment' | 'revision' | 'practice' | 'reading' | 'exam_prep';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_duration_minutes: number;
  due_date?: string;
  status: 'todo' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface Assessment {
  id: string;
  user_id: string;
  subject_id: string;
  title: string;
  assessment_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityRule {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface StudySession {
  id: string;
  user_id?: string;
  subject_id?: string;
  topic_id?: string;
  task_id?: string;
  assessment_id?: string;
  title: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: 'planned' | 'in_progress' | 'completed' | 'skipped';
  session_type: 'study' | 'revision' | 'practice';
  priority_score: number;
  reasoning?: string;
}

export interface UnscheduledItem {
  id: string;
  title: string;
  reason: string;
  estimated_minutes: number;
}

export interface PlanPreview {
  planned_sessions: StudySession[];
  unscheduled_items: UnscheduledItem[];
  total_planned_minutes: number;
  total_available_minutes: number;
  reasoning_summary: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  event_type: 'study_session' | 'task_deadline' | 'assessment';
  start_time: string;
  end_time: string;
  status?: string;
  priority?: string;
  session_type?: string;
  subject_id?: string;
}

export interface DashboardSummary {
  today_study_hours: number;
  target_study_hours: number;
  tasks_completed_count: number;
  tasks_total_count: number;
  upcoming_exams_count: number;
  upcoming_exam_summary: string;
  streak_days: number;
  today_sessions: StudySession[];
  upcoming_deadlines: Task[];
  subject_progress: {
    id: string;
    title: string;
    code?: string;
    color: string;
    percentage: number;
    completed_modules: number;
    total_modules: number;
  }[];
}
