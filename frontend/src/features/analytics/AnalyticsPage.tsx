import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { apiClient } from '@/lib/api-client';
import { AnalyticsOverview } from '@/types/analytics';
import {
  BarChart3,
  Flame,
  CheckSquare,
  Clock,
  BookOpen,
  Calendar,
  ArrowUpRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AnalyticsPage: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('week');
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchAnalytics = async (tf: 'week' | 'month') => {
    try {
      setLoading(true);
      const res = await apiClient<AnalyticsOverview>(`/analytics/overview?timeframe=${tf}`);
      setData(res);
    } catch (err) {
      console.error('Failed to load analytics overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(timeframe);
  }, [timeframe]);

  const completedHours = ((data?.total_completed_minutes ?? 0) / 60).toFixed(1);
  const plannedHours = ((data?.total_planned_minutes ?? 0) / 60).toFixed(1);
  const completionRate = data?.completion_rate_pct ?? 0;
  const currentStreak = data?.consistency.current_streak_days ?? 0;
  const longestStreak = data?.consistency.longest_streak_days ?? 0;
  const activeDays = data?.consistency.active_days_count ?? 0;
  const totalTasks = data?.tasks.total ?? 0;
  const completedTasks = data?.tasks.completed ?? 0;
  const overdueTasks = data?.tasks.overdue ?? 0;
  const taskRate = data?.tasks.completion_rate_pct ?? 0;

  const maxDailyMinutes = Math.max(
    60,
    ...(data?.daily_trend || []).map((d) => Math.max(d.planned_minutes, d.completed_minutes))
  );

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 1. Header with Timeframe Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
            Progress & Academic Analytics
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Evidence-based study time tracking, syllabus mastery, and habit consistency.
          </p>
        </div>

        {/* Timeframe Filter Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-container/60 border border-white/5 self-start sm:self-auto">
          <button
            onClick={() => setTimeframe('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
              timeframe === 'week'
                ? 'bg-primary-container text-on-primary-container shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setTimeframe('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
              timeframe === 'month'
                ? 'bg-primary-container text-on-primary-container shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {/* 2. Top Summary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Completed Study Time */}
        <GlassCard level={1} className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant font-semibold">
              Study Logged
            </span>
            <span className="p-1.5 rounded-lg bg-primary-container/20 text-primary">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="font-headline text-2xl font-bold text-on-surface tracking-tight">
              {completedHours}h{' '}
              <span className="text-xs text-on-surface-variant font-normal">/ {plannedHours}h planned</span>
            </div>
            <div className="flex items-center justify-between mt-1 text-xs font-mono">
              <span className="text-primary">{completionRate}% Completion Rate</span>
            </div>
            <div className="w-full bg-surface-container-highest rounded-full h-1.5 mt-3 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all shadow-glow-primary"
                style={{ width: `${Math.min(100, completionRate)}%` }}
              />
            </div>
          </div>
        </GlassCard>

        {/* Metric 2: Task Completion */}
        <GlassCard level={1} className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant font-semibold">
              Tasks Completed
            </span>
            <span className="p-1.5 rounded-lg bg-secondary-container/20 text-secondary">
              <CheckSquare className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="font-headline text-2xl font-bold text-on-surface tracking-tight">
              {completedTasks}{' '}
              <span className="text-xs text-on-surface-variant font-normal">of {totalTasks} tasks</span>
            </div>
            <div className="flex items-center justify-between mt-1 text-xs font-mono">
              <span className="text-secondary">{taskRate}% Finished</span>
              {overdueTasks > 0 && (
                <span className="text-error font-semibold">{overdueTasks} Overdue</span>
              )}
            </div>
            <div className="w-full bg-surface-container-highest rounded-full h-1.5 mt-3 overflow-hidden">
              <div
                className="bg-secondary h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, taskRate)}%` }}
              />
            </div>
          </div>
        </GlassCard>

        {/* Metric 3: Consistency Streak */}
        <GlassCard level={1} className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant font-semibold">
              Current Streak
            </span>
            <span className="p-1.5 rounded-lg bg-secondary-container/20 text-secondary-fixed">
              <Flame className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="font-headline text-2xl font-bold text-on-surface tracking-tight">
              {currentStreak} <span className="text-xs text-on-surface-variant font-normal">days</span>
            </div>
            <div className="flex items-center justify-between mt-1 text-xs font-mono">
              <span className="text-primary">
                {currentStreak > 0 ? 'Active Habit' : 'No Active Streak'}
              </span>
              <span className="text-on-surface-variant">Best: {longestStreak}d</span>
            </div>
            <div className="w-full bg-surface-container-highest rounded-full h-1.5 mt-3 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all shadow-glow-primary"
                style={{ width: `${Math.min(100, Math.max(currentStreak > 0 ? 15 : 0, currentStreak * 14))}%` }}
              />
            </div>
          </div>
        </GlassCard>

        {/* Metric 4: Active Study Days */}
        <GlassCard level={1} className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant font-semibold">
              Active Days
            </span>
            <span className="p-1.5 rounded-lg bg-tertiary-container/20 text-tertiary">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="font-headline text-2xl font-bold text-on-surface tracking-tight">
              {activeDays}{' '}
              <span className="text-xs text-on-surface-variant font-normal">
                / {timeframe === 'month' ? '30' : '7'} days
              </span>
            </div>
            <div className="flex items-center justify-between mt-1 text-xs font-mono">
              <span className="text-tertiary">
                {Math.round((activeDays / (timeframe === 'month' ? 30 : 7)) * 100)}% Consistency
              </span>
            </div>
            <div className="w-full bg-surface-container-highest rounded-full h-1.5 mt-3 overflow-hidden">
              <div
                className="bg-tertiary h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, (activeDays / (timeframe === 'month' ? 30 : 7)) * 100)}%` }}
              />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* 3. Central Analysis Grid (8 cols Left, 4 cols Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (8 cols): Trend Chart & Subject Breakdown */}
        <div className="lg:col-span-8 flex flex-col gap-6 min-w-0">
          {/* 3.a Daily Study Consistency Chart */}
          <GlassCard level={1} className="p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h2 className="font-headline text-lg font-bold text-on-surface">
                  Daily Study Hours Trend ({timeframe === 'month' ? '30 Days' : '7 Days'})
                </h2>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-primary shadow-glow-primary" />
                  <span className="text-on-surface-variant">Completed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-secondary/60 border border-secondary/40" />
                  <span className="text-on-surface-variant">Planned</span>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-on-surface-variant gap-2">
                <Clock className="w-6 h-6 animate-spin text-primary" />
                <span className="text-xs font-mono">Aggregating study records...</span>
              </div>
            ) : !data || data.daily_trend.every((d) => d.completed_minutes === 0 && d.planned_minutes === 0) ? (
              <div className="py-12 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/10 rounded-xl bg-surface-container/20">
                <Clock className="w-8 h-8 text-on-surface-variant/40 mb-2" />
                <span className="text-sm font-semibold text-on-surface">No study sessions recorded</span>
                <p className="text-xs text-on-surface-variant max-w-sm mt-1 mb-4">
                  Generate and complete study sessions in the AI Planner to view your consistency curves.
                </p>
                <GlassButton variant="primary" size="sm" onClick={() => navigate('/planner')}>
                  <Zap className="w-3.5 h-3.5 mr-1" />
                  <span>Open Study Planner</span>
                </GlassButton>
              </div>
            ) : (
              <div className={`grid gap-1.5 sm:gap-2 items-end h-52 pt-6 px-1 ${
                timeframe === 'month' ? 'grid-cols-15 sm:grid-cols-30' : 'grid-cols-7'
              }`}>
                {data.daily_trend.map((day) => {
                  const completedHeight = Math.min(100, Math.round((day.completed_minutes / maxDailyMinutes) * 100));
                  const plannedHeight = Math.min(100, Math.round((day.planned_minutes / maxDailyMinutes) * 100));

                  return (
                    <div
                      key={day.date}
                      className="flex flex-col items-center gap-1.5 h-full justify-end group relative"
                    >
                      {/* Tooltip */}
                      <div className="absolute -top-9 bg-surface-container-highest text-on-surface text-[10px] font-mono px-2 py-0.5 rounded shadow border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                        {day.date}: {day.completed_minutes}m done / {day.planned_minutes}m plan
                      </div>

                      {/* Bars */}
                      <div className="flex items-end gap-0.5 h-36 w-full justify-center">
                        <div
                          className="w-full max-w-[8px] bg-secondary/30 border border-secondary/40 rounded-t-sm transition-all"
                          style={{ height: `${Math.max(4, plannedHeight)}%` }}
                        />
                        <div
                          className="w-full max-w-[8px] bg-primary shadow-glow-primary rounded-t-sm transition-all"
                          style={{ height: `${Math.max(4, completedHeight)}%` }}
                        />
                      </div>

                      {/* Label */}
                      <span className="text-[10px] font-mono text-on-surface-variant truncate max-w-full">
                        {timeframe === 'month' ? day.date.slice(8) : day.day_name}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>

          {/* 3.b Subject-wise Syllabus Progress */}
          <GlassCard level={1} className="p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline text-lg font-bold text-on-surface">
                  Curriculum & Syllabus Coverage
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Percentage of syllabus topics mastered per enrolled course
                </p>
              </div>
              <button
                onClick={() => navigate('/tasks')}
                className="text-xs font-mono text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Edit Subjects</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {!data || data.subjects.length === 0 ? (
              <div className="py-8 text-center text-xs text-on-surface-variant border border-dashed border-white/10 rounded-xl p-4">
                No subjects registered yet. Add courses in My Tasks.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {data.subjects.map((subj) => (
                  <div
                    key={subj.id}
                    className="p-3.5 rounded-xl bg-surface-container/60 border border-white/5 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-on-surface">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: subj.color }}
                        />
                        <span>{subj.title}</span>
                        {subj.code && (
                          <span className="text-[10px] font-mono text-on-surface-variant px-1.5 py-0.5 rounded bg-surface-container-highest">
                            {subj.code}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-primary font-bold">{subj.percentage}%</span>
                    </div>

                    <div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${subj.percentage}%`,
                          backgroundColor: subj.color,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-on-surface-variant">
                      <span>
                        {subj.completed_modules} of {subj.total_modules} topics completed
                      </span>
                      <span>{(subj.completed_minutes / 60).toFixed(1)}h logged</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {/* RIGHT COLUMN (4 cols): Task Breakdown & Insights */}
        <div className="lg:col-span-4 flex flex-col gap-6 min-w-0">
          {/* 3.c PrepAI Study Insights Card */}
          <GlassCard level={2} className="p-5 flex flex-col gap-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full bg-primary-container/30 text-primary font-mono text-[10px] font-semibold flex items-center gap-1.5 border border-primary/20 shadow-glow-primary">
                <Sparkles className="w-3.5 h-3.5" />
                <span>PrepAI Smart Recommendations</span>
              </span>
            </div>
            <p className="text-xs text-on-surface leading-relaxed mt-1">
              {currentStreak >= 3
                ? `Impressive consistency! You've maintained a ${currentStreak}-day study habit. Keep up momentum before upcoming exams.`
                : totalTasks > 0 && completedTasks === 0
                ? 'You have active tasks waiting. Completing a quick 30-minute study block today will kickstart your streak.'
                : 'Balanced study schedules prevent cramming. Plan your upcoming assignments in the AI Planner.'}
            </p>
            <GlassButton
              variant="primary"
              size="sm"
              className="w-full mt-1 text-xs"
              onClick={() => navigate('/planner')}
            >
              <Zap className="w-3.5 h-3.5 mr-1" />
              <span>Optimize Study Schedule</span>
            </GlassButton>
          </GlassCard>

          {/* 3.d Task Status Distribution */}
          <GlassCard level={1} className="p-5 flex flex-col gap-3">
            <h3 className="font-headline text-sm font-bold text-on-surface flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-primary" />
              <span>Task Status Distribution</span>
            </h3>

            <div className="flex flex-col gap-2.5 mt-1">
              <div className="p-3 rounded-lg bg-surface-container/60 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <span className="text-xs text-on-surface font-medium">Completed</span>
                </div>
                <span className="text-xs font-mono font-bold text-on-surface">{completedTasks}</span>
              </div>

              <div className="p-3 rounded-lg bg-surface-container/60 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                  <span className="text-xs text-on-surface font-medium">In Progress</span>
                </div>
                <span className="text-xs font-mono font-bold text-on-surface">
                  {data?.tasks.in_progress ?? 0}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-surface-container/60 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-error" />
                  <span className="text-xs text-on-surface font-medium">Overdue</span>
                </div>
                <span className="text-xs font-mono font-bold text-error">{overdueTasks}</span>
              </div>
            </div>
          </GlassCard>

          {/* 3.e Quick Link to Documents & Chat */}
          <GlassCard level={1} className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-sm font-bold text-on-surface flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-accent-blue" />
                <span>RAG Knowledge Base</span>
              </h3>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Upload course slides and syllabus documents to ask grounded study questions with verifiable citations.
            </p>
            <GlassButton
              variant="secondary"
              size="sm"
              className="w-full text-xs"
              onClick={() => navigate('/documents')}
            >
              <span>Manage Study Documents</span>
            </GlassButton>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
