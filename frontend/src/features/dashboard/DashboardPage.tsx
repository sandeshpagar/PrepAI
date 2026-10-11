import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { useAuth } from '@/features/auth/AuthContext';
import { apiClient } from '@/lib/api-client';
import { DashboardSummary, StudySession } from '@/types/planner';
import {
  Calendar as CalendarIcon,
  Zap,
  Sparkles,
  Clock,
  TrendingUp,
  CheckSquare,
  AlertCircle,
  Flame,
  Check,
  Play,
  ArrowRight,
  Brain,
  Send,
  BookOpen,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Learner';

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingSessionId, setUpdatingSessionId] = useState<string | null>(null);

  const fetchSummary = async () => {
    try {
      const data = await apiClient<DashboardSummary>('/dashboard/summary');
      setSummary(data);
    } catch (err) {
      console.error('Failed to load dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleUpdateSessionStatus = async (
    sessionId: string,
    status: 'in_progress' | 'completed'
  ) => {
    try {
      setUpdatingSessionId(sessionId);
      await apiClient(`/sessions/${sessionId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      await fetchSummary();
    } catch (err) {
      console.error('Failed to update session:', err);
    } finally {
      setUpdatingSessionId(null);
    }
  };

  // Calculations for metric rings
  const studyHoursToday = summary?.today_study_hours ?? 0;
  const targetStudyHours = summary?.target_study_hours ?? 4.0;
  const hoursPct = Math.min(100, Math.round((studyHoursToday / targetStudyHours) * 100));
  const strokeDashoffset = Math.max(0, 88 - (88 * hoursPct) / 100);

  const tasksCompleted = summary?.tasks_completed_count ?? 0;
  const tasksTotal = summary?.tasks_total_count ?? 0;
  const upcomingExams = summary?.upcoming_exams_count ?? 0;
  const streakDays = summary?.streak_days ?? 7;

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 1. Welcome Banner Header */}
      <GlassCard
        level={1}
        className="p-6 sm:p-8 relative overflow-hidden flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
      >
        <div className="flex flex-col gap-2 relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-highest/60 border border-white/5 self-start text-xs font-mono text-on-surface-variant">
            <CalendarIcon className="w-3.5 h-3.5 text-primary" />
            <span>{format(new Date(), 'EEEE, MMM d, yyyy')}</span>
            <span className="opacity-40">•</span>
            <span className="text-secondary font-medium">Academic Term</span>
            <span className="opacity-40">•</span>
            <span className="text-primary font-semibold">Active Cycle</span>
          </div>

          <h1 className="font-headline text-2xl sm:text-3xl font-bold text-on-surface tracking-tight mt-1">
            Good day, {userName} <span className="inline-block animate-bounce">👋</span>
          </h1>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Your next step toward academic mastery starts here. Track your priorities, stay consistent, and optimize your study sessions.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 relative z-10 shrink-0">
          <GlassButton variant="primary" size="md" onClick={() => navigate('/planner')}>
            <Zap className="w-4 h-4 mr-1.5" />
            <span>Generate Study Plan</span>
          </GlassButton>
          <GlassButton variant="secondary" size="md" onClick={() => navigate('/assistant')}>
            <Sparkles className="w-4 h-4 mr-1.5" />
            <span>Ask PrepAI (RAG)</span>
          </GlassButton>
        </div>
      </GlassCard>

      {/* 2. Top Metric Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Today's Study Hours */}
        <GlassCard level={1} className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant font-semibold">
              Today's Study Hours
            </span>
            <span className="p-1 rounded bg-primary-container/15 text-primary">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="font-headline text-2xl font-bold text-on-surface tracking-tight">
                {studyHoursToday} <span className="text-sm text-on-surface-variant font-normal">/ {targetStudyHours} hrs</span>
              </div>
              <div className="text-xs text-primary flex items-center gap-1 mt-1 font-mono">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{hoursPct}% of daily goal</span>
              </div>
            </div>
            {/* Radial progress ring */}
            <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                <circle
                  className="text-surface-container-highest"
                  cx="18"
                  cy="18"
                  fill="none"
                  r="14"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <circle
                  className="text-primary-container"
                  cx="18"
                  cy="18"
                  fill="none"
                  r="14"
                  stroke="currentColor"
                  strokeDasharray="88"
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  strokeWidth="3"
                />
              </svg>
              <span className="absolute font-mono text-[10px] text-primary font-bold">{hoursPct}%</span>
            </div>
          </div>
        </GlassCard>

        {/* Card 2: Tasks Completed */}
        <GlassCard level={1} className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant font-semibold">
              Tasks Completed
            </span>
            <span className="p-1 rounded bg-tertiary-container/15 text-tertiary">
              <CheckSquare className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="font-headline text-2xl font-bold text-on-surface tracking-tight">
              {tasksCompleted} <span className="text-sm text-on-surface-variant font-normal">/ {tasksTotal} tasks</span>
            </div>
            <div className="text-xs text-tertiary-fixed-dim mt-1 font-mono">
              {Math.max(0, tasksTotal - tasksCompleted)} pending tasks
            </div>
            <div className="w-full bg-surface-container-highest rounded-full h-1.5 mt-3 overflow-hidden">
              <div
                className="bg-tertiary-container h-full rounded-full transition-all"
                style={{ width: `${tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 100 : 0}%` }}
              />
            </div>
          </div>
        </GlassCard>

        {/* Card 3: Upcoming Exams */}
        <GlassCard level={1} className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant font-semibold">
              Upcoming Exams
            </span>
            <span className="px-2 py-0.5 rounded-full bg-secondary-fixed/15 text-secondary font-mono text-[10px] font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              Alert
            </span>
          </div>
          <div>
            <div className="font-headline text-2xl font-bold text-on-surface tracking-tight">
              {upcomingExams} {upcomingExams === 1 ? 'exam' : 'exams'}{' '}
              <span className="text-sm text-on-surface-variant font-normal">this week</span>
            </div>
            <div className="text-xs text-secondary-fixed-dim flex items-center gap-1 mt-1 truncate">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{summary?.upcoming_exam_summary || 'No upcoming exams'}</span>
            </div>
            <div className="w-full bg-surface-container-highest rounded-full h-1.5 mt-3 overflow-hidden">
              <div
                className="bg-secondary-fixed-dim h-full rounded-full transition-all"
                style={{ width: `${upcomingExams > 0 ? 66 : 0}%` }}
              />
            </div>
          </div>
        </GlassCard>

        {/* Card 4: Study Consistency Streak */}
        <GlassCard level={1} className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant font-semibold">
              Study Consistency
            </span>
            <span className="p-1 rounded bg-secondary-container/20 text-secondary-fixed">
              <Flame className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="font-headline text-2xl font-bold text-on-surface tracking-tight">
              {streakDays} <span className="text-sm text-on-surface-variant font-normal">days active</span>
            </div>
            <div className="flex items-center justify-between mt-1 text-xs">
              <span className="text-primary font-medium font-mono">Consistent Study Habit</span>
              <span className="text-on-surface-variant font-mono text-[11px]">Best: 14d</span>
            </div>
            <div className="w-full bg-surface-container-highest rounded-full h-1.5 mt-3 overflow-hidden">
              <div className="bg-primary h-full rounded-full w-4/5 shadow-glow-primary" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* 3. Central Content Grid (Left 8 cols, Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6 min-w-0">
          {/* 3.a Today's Smart Study Schedule */}
          <GlassCard level={1} className="p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <h2 className="font-headline text-lg font-bold text-on-surface">
                  Today's Smart Study Schedule
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-mono text-[10px]">
                  {summary?.today_sessions.length || 0} Sessions
                </span>
              </div>
              <Link
                to="/planner"
                className="text-xs font-mono text-primary hover:text-primary-fixed-dim transition-colors flex items-center gap-1 group"
              >
                <span>View Full Planner</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              {loading ? (
                <div className="py-8 flex flex-col items-center justify-center text-on-surface-variant gap-2">
                  <Clock className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-xs font-mono">Loading sessions...</span>
                </div>
              ) : !summary || summary.today_sessions.length === 0 ? (
                <div className="py-8 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/10 rounded-xl bg-surface-container/20">
                  <Clock className="w-8 h-8 text-on-surface-variant/40 mb-2" />
                  <span className="text-sm font-semibold text-on-surface">No sessions scheduled for today</span>
                  <p className="text-xs text-on-surface-variant max-w-sm mt-1 mb-4">
                    Generate an optimal study plan to allocate focused time slots for your upcoming exams and assignments.
                  </p>
                  <GlassButton variant="primary" size="sm" onClick={() => navigate('/planner')}>
                    <Zap className="w-3.5 h-3.5 mr-1" />
                    <span>Generate Schedule Now</span>
                  </GlassButton>
                </div>
              ) : (
                summary.today_sessions.map((session: StudySession) => {
                  const start = parseISO(session.start_time);
                  const end = parseISO(session.end_time);
                  const isDone = session.status === 'completed';
                  const isInProgress = session.status === 'in_progress';
                  const isUpdating = updatingSessionId === session.id;

                  return (
                    <div
                      key={session.id}
                      className={`p-3.5 rounded-lg transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 border ${
                        isInProgress
                          ? 'bg-surface-container-high/90 border-primary/30 shadow-glow-primary'
                          : isDone
                          ? 'bg-surface-container/40 border-white/5 opacity-75'
                          : 'bg-surface-container/60 border-white/5 hover:bg-surface-container-high/60'
                      }`}
                    >
                      <div className="flex items-start md:items-center gap-3 min-w-0">
                        <div
                          className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                            isDone
                              ? 'bg-primary-container text-on-primary-container'
                              : isInProgress
                              ? 'bg-primary/20 text-primary animate-pulse'
                              : 'bg-surface-container-highest text-on-surface-variant'
                          }`}
                        >
                          {isDone ? (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          ) : (
                            <Clock className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs text-on-surface-variant font-semibold">
                              {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-surface-container-highest text-secondary-fixed text-[10px] font-mono capitalize">
                              {session.session_type}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize ${
                                isDone
                                  ? 'bg-primary-container/15 text-primary'
                                  : isInProgress
                                  ? 'bg-primary-container text-on-primary-container'
                                  : 'bg-surface-container-highest text-on-surface-variant'
                              }`}
                            >
                              {session.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p
                            className={`text-xs truncate mt-0.5 ${
                              isDone ? 'line-through text-on-surface-variant' : 'text-on-surface font-medium'
                            }`}
                          >
                            {session.title}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                        <span className="text-xs font-mono text-on-surface-variant mr-1">
                          {session.duration_minutes}m
                        </span>

                        {session.status === 'planned' && (
                          <GlassButton
                            variant="primary"
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => handleUpdateSessionStatus(session.id, 'in_progress')}
                          >
                            <Play className="w-3 h-3 fill-current mr-1" />
                            <span>Start</span>
                          </GlassButton>
                        )}

                        {session.status === 'in_progress' && (
                          <GlassButton
                            variant="primary"
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => handleUpdateSessionStatus(session.id, 'completed')}
                          >
                            <Check className="w-3 h-3 stroke-[3] mr-1" />
                            <span>Complete</span>
                          </GlassButton>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </GlassCard>

          {/* 3.b Subject-wise Syllabus Progress */}
          <GlassCard level={1} className="p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline text-lg font-bold text-on-surface">
                  Subject-wise Syllabus Progress
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Dynamic curriculum completion derived from registered topics
                </p>
              </div>
              <Link
                to="/tasks"
                className="text-xs font-mono text-primary hover:text-primary-fixed-dim transition-colors flex items-center gap-1"
              >
                <span>Manage Subjects</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {!summary || summary.subject_progress.length === 0 ? (
              <div className="py-6 flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/10 rounded-xl bg-surface-container/20">
                <BookOpen className="w-7 h-7 text-on-surface-variant/40 mb-2" />
                <span className="text-xs font-semibold text-on-surface">No subjects created yet</span>
                <span className="text-[11px] text-on-surface-variant mt-0.5 mb-3">
                  Add your courses in My Tasks to track topic coverage.
                </span>
                <GlassButton variant="glass" size="sm" onClick={() => navigate('/tasks')}>
                  <span>Go to My Tasks</span>
                </GlassButton>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {summary.subject_progress.map((subj) => (
                  <div
                    key={subj.id}
                    className="p-4 rounded-lg bg-surface-container/60 border border-white/5 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-on-surface">
                      <span className="truncate">{subj.title}</span>
                      <span className="font-mono text-primary">{subj.percentage}%</span>
                    </div>
                    <div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${subj.percentage}%`,
                          backgroundColor: subj.color || '#43E58B',
                        }}
                      />
                    </div>
                    <span className="font-mono text-[11px] text-on-surface-variant">
                      {subj.completed_modules} of {subj.total_modules} modules completed
                    </span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {/* RIGHT COLUMN (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6 min-w-0">
          {/* 3.a PrepAI Contextual Insights */}
          <GlassCard level={2} className="p-5 flex flex-col gap-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full bg-secondary-container/30 text-secondary font-mono text-[10px] font-semibold flex items-center gap-1.5 border border-secondary/20 shadow-glow-secondary">
                <Brain className="w-3.5 h-3.5" />
                <span>RAG Adaptive Intelligence</span>
              </span>
            </div>
            <p className="text-xs text-on-surface leading-relaxed mt-1">
              Deterministic planner analyzes difficulty, deadlines, and urgency parameters to schedule your study sessions without hallucination.
            </p>
            <GlassButton
              variant="secondary"
              size="sm"
              className="w-full mt-1 text-xs"
              onClick={() => navigate('/planner')}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              <span>Open Study Planner</span>
            </GlassButton>
          </GlassCard>

          {/* 3.b Quick Ask PrepAI (Document RAG) */}
          <GlassCard level={1} className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-sm font-bold text-on-surface flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-primary" />
                <span>Quick Ask PrepAI</span>
              </h3>
              <span className="font-mono text-[10px] text-on-surface-variant">RAG Indexed</span>
            </div>

            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Ask anything from your uploaded study materials..."
                className="w-full pl-3 pr-10 py-2 rounded-lg bg-surface-container-lowest/80 text-xs text-on-surface placeholder:text-on-surface-variant/50 border border-white/5 focus:outline-none focus:border-secondary transition-all"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') navigate('/assistant');
                }}
              />
              <button
                className="absolute right-2 p-1.5 rounded-lg bg-primary-container text-on-primary-container hover:bg-primary-fixed-dim transition-colors cursor-pointer"
                title="Send"
                onClick={() => navigate('/assistant')}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-1">
              {['⚡ Summarize B+ Trees', '🔍 TCP Congestion Formula', '📝 Generate 5 Quiz Questions'].map((chip) => (
                <button
                  key={chip}
                  onClick={() => navigate('/assistant')}
                  className="px-2 py-1 rounded bg-surface-container-highest/60 hover:bg-surface-container-high text-on-surface font-mono text-[10px] transition-colors text-left truncate border border-white/5 cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          </GlassCard>

          {/* 3.c Upcoming Deadlines */}
          <GlassCard level={1} className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-sm font-bold text-on-surface flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-secondary" />
                <span>Deadlines & Milestones</span>
              </h3>
              <span className="font-mono text-[10px] text-on-surface-variant">
                {summary?.upcoming_deadlines.length || 0} Upcoming
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {!summary || summary.upcoming_deadlines.length === 0 ? (
                <div className="py-4 text-center text-xs text-on-surface-variant">
                  No upcoming deadlines recorded.
                </div>
              ) : (
                summary.upcoming_deadlines.map((task) => (
                  <div
                    key={task.id}
                    className="p-2.5 rounded-lg bg-surface-container/60 border border-white/5 flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-on-surface">
                      <span className="truncate">{task.title}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded font-mono text-[10px] capitalize ${
                          task.priority === 'urgent'
                            ? 'bg-error/20 text-error'
                            : task.priority === 'high'
                            ? 'bg-secondary/20 text-secondary'
                            : 'bg-primary/20 text-primary'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-on-surface-variant">
                      <span>Due {task.due_date ? format(parseISO(task.due_date), 'MMM d, yyyy') : 'No date'}</span>
                      <span className="capitalize">{task.category}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
