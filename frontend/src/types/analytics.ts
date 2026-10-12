export interface DailyStudyPoint {
  date: string;
  day_name: string;
  planned_minutes: number;
  completed_minutes: number;
}

export interface SubjectProgressMetric {
  id: string;
  title: string;
  code?: string;
  color: string;
  completed_minutes: number;
  planned_minutes: number;
  total_modules: number;
  completed_modules: number;
  percentage: number;
}

export interface TaskCompletionMetric {
  total: number;
  completed: number;
  in_progress: number;
  overdue: number;
  completion_rate_pct: number;
}

export interface ConsistencyMetric {
  current_streak_days: number;
  longest_streak_days: number;
  active_days_count: number;
}

export interface ActivityEvent {
  id: string;
  event_type: string;
  title: string;
  description: string;
  timestamp: string;
  link_url?: string;
}

export interface AnalyticsOverview {
  timeframe: 'week' | 'month';
  total_planned_minutes: number;
  total_completed_minutes: number;
  completion_rate_pct: number;
  daily_trend: DailyStudyPoint[];
  subjects: SubjectProgressMetric[];
  tasks: TaskCompletionMetric;
  sessions: {
    total: number;
    completed: number;
    planned: number;
    total_duration_minutes: number;
  };
  consistency: ConsistencyMetric;
  recent_activity: ActivityEvent[];
}
