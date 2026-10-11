import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { useAuth } from '@/features/auth/AuthContext';
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
  FileText,
  Presentation,
  History,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Elena Vance';

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
            <span>Thursday, Oct 24, 2024</span>
            <span className="opacity-40">•</span>
            <span className="text-secondary font-medium">Fall Midterm Term</span>
            <span className="opacity-40">•</span>
            <span className="text-primary font-semibold">Week 8</span>
          </div>

          <h1 className="font-headline text-2xl sm:text-3xl font-bold text-on-surface tracking-tight mt-1">
            Good morning, {userName} <span className="inline-block animate-bounce">👋</span>
          </h1>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Your next step toward academic mastery starts here. Next focus session begins in{' '}
            <span className="font-mono text-primary font-bold px-1.5 py-0.5 rounded bg-primary-container/20">
              25 mins
            </span>
            .
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 relative z-10 shrink-0">
          <GlassButton variant="primary" size="md">
            <Zap className="w-4 h-4 mr-1.5" />
            <span>Generate Study Plan</span>
          </GlassButton>
          <GlassButton variant="secondary" size="md">
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
                2.5 <span className="text-sm text-on-surface-variant font-normal">/ 4.0 hrs</span>
              </div>
              <div className="text-xs text-primary flex items-center gap-1 mt-1 font-mono">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+45m over yesterday</span>
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
                  strokeDashoffset="33.44"
                  strokeLinecap="round"
                  strokeWidth="3"
                />
              </svg>
              <span className="absolute font-mono text-[10px] text-primary font-bold">62%</span>
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
              6 <span className="text-sm text-on-surface-variant font-normal">/ 9 tasks</span>
            </div>
            <div className="text-xs text-tertiary-fixed-dim mt-1 font-mono">3 priority tasks remaining</div>
            <div className="grid grid-cols-9 gap-1 mt-3">
              {[...Array(6)].map((_, i) => (
                <span key={i} className="h-1.5 rounded-full bg-tertiary-container" />
              ))}
              {[...Array(3)].map((_, i) => (
                <span key={i + 6} className="h-1.5 rounded-full bg-surface-container-highest" />
              ))}
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
              2 exams <span className="text-sm text-on-surface-variant font-normal">this week</span>
            </div>
            <div className="text-xs text-secondary-fixed-dim flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Computer Networks in 3 days</span>
            </div>
            <div className="w-full bg-surface-container-highest rounded-full h-1.5 mt-3 overflow-hidden">
              <div className="bg-secondary-fixed-dim h-full rounded-full w-2/3" />
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
              7 <span className="text-sm text-on-surface-variant font-normal">days active</span>
            </div>
            <div className="flex items-center justify-between mt-1 text-xs">
              <span className="text-primary font-medium font-mono">Top 5% student cohort</span>
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
                  Active Timetable
                </span>
              </div>
              <a
                href="/planner"
                className="text-xs font-mono text-primary hover:text-primary-fixed-dim transition-colors flex items-center gap-1 group"
              >
                <span>View Full Planner</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>

            <div className="flex flex-col gap-3">
              {/* Session 1: Completed */}
              <div className="p-3.5 rounded-lg bg-surface-container/60 hover:bg-surface-container-high/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 border border-white/5">
                <div className="flex items-start md:items-center gap-3 min-w-0">
                  <div className="w-6 h-6 rounded bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-on-surface-variant font-semibold">
                        09:00 - 09:45
                      </span>
                      <span className="px-2 py-0.5 rounded bg-surface-container-highest text-secondary-fixed text-[10px] font-mono">
                        Advanced Python
                      </span>
                      <span className="px-2 py-0.5 rounded bg-primary-container/15 text-primary text-[10px] font-mono">
                        Completed
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant line-through truncate mt-0.5">
                      RAG Architecture & Vector Indexing
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-on-surface-variant shrink-0">45 min</span>
              </div>

              {/* Session 2: Active / In Progress */}
              <div className="p-3.5 rounded-lg bg-surface-container-high/90 border border-primary/30 shadow-glow-primary flex flex-col md:flex-row md:items-center justify-between gap-3 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-container" />
                <div className="flex items-start md:items-center gap-3 min-w-0 pl-1">
                  <div className="w-6 h-6 rounded bg-primary/20 text-primary flex items-center justify-center shrink-0 animate-pulse">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-primary font-semibold">10:15 - 11:30</span>
                      <span className="px-2 py-0.5 rounded bg-surface-container-highest text-secondary-fixed text-[10px] font-mono font-semibold">
                        Database Management Systems
                      </span>
                      <span className="px-2 py-0.5 rounded bg-primary-container text-on-primary-container text-[10px] font-mono font-semibold">
                        In Progress
                      </span>
                    </div>
                    <p className="text-xs text-on-surface font-medium truncate mt-0.5">
                      B+ Tree Indexing & Query Optimizations
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                  <span className="text-xs font-mono px-2 py-1 rounded bg-surface-container-lowest text-primary font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 28m left
                  </span>
                  <GlassButton variant="primary" size="sm" className="text-xs">
                    <Play className="w-3 h-3 fill-current" />
                    <span>Continue Session</span>
                  </GlassButton>
                </div>
              </div>

              {/* Session 3: Upcoming High Priority */}
              <div className="p-3.5 rounded-lg bg-surface-container/60 hover:bg-surface-container-high/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 border border-white/5">
                <div className="flex items-start md:items-center gap-3 min-w-0">
                  <div className="w-6 h-6 rounded bg-surface-container-highest text-on-surface-variant flex items-center justify-center shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-on-surface-variant font-semibold">
                        14:00 - 14:45
                      </span>
                      <span className="px-2 py-0.5 rounded bg-surface-container-highest text-secondary-fixed text-[10px] font-mono">
                        Computer Networks
                      </span>
                      <span className="px-2 py-0.5 rounded bg-secondary-fixed/20 text-secondary text-[10px] font-mono font-medium">
                        High Priority
                      </span>
                    </div>
                    <p className="text-xs text-on-surface truncate mt-0.5">
                      TCP Congestion Control (Reno vs Cubic)
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-on-surface-variant shrink-0">45 min</span>
              </div>
            </div>
          </GlassCard>

          {/* 3.b Weekly Study Activity & Focus Hours */}
          <GlassCard level={1} className="p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline text-lg font-bold text-on-surface">
                  Weekly Study Activity & Focus Hours
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Measured active focus sessions vs 4.0h daily target
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-surface-container-highest text-primary font-mono text-[10px]">
                Wednesday Peak: 5.0h focus
              </span>
            </div>

            {/* Interactive Bar Visualization */}
            <div className="w-full pt-4">
              <div className="relative h-40 w-full flex items-end justify-between gap-2 px-2 pb-6">
                {/* Target line at 4.0h */}
                <div className="absolute left-0 right-0 top-10 border-b border-dashed border-outline-variant flex items-center justify-between z-0 pointer-events-none">
                  <span className="font-mono text-[10px] text-outline px-1 bg-surface-container-lowest/80 rounded -mt-3 ml-2">
                    Target 4.0h
                  </span>
                </div>

                {[
                  { day: 'Mon', hours: '3.5h', height: '88px', active: false },
                  { day: 'Tue', hours: '4.2h', height: '105px', active: false },
                  { day: 'Wed', hours: '5.0h', height: '125px', peak: true },
                  { day: 'Thu', hours: '2.5h (Now)', height: '62px', current: true },
                  { day: 'Fri', hours: '4.0h', height: '100px', projected: true },
                  { day: 'Sat', hours: '3.0h', height: '75px', projected: true },
                  { day: 'Sun', hours: '2.0h', height: '50px', projected: true },
                ].map((item) => (
                  <div key={item.day} className="flex-1 flex flex-col items-center gap-2 z-10 group cursor-pointer">
                    <span className="font-mono text-[10px] text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.hours}
                    </span>
                    <div
                      className={`w-full max-w-[38px] rounded-t-lg transition-all ${
                        item.peak
                          ? 'bg-primary-container shadow-glow-primary'
                          : item.current
                          ? 'bg-primary/80'
                          : item.projected
                          ? 'bg-surface-container-highest/50 border-t border-dashed border-outline'
                          : 'bg-secondary-container/70 group-hover:bg-secondary-container'
                      }`}
                      style={{ height: item.height }}
                    />
                    <span
                      className={`font-mono text-[11px] ${
                        item.peak
                          ? 'text-primary font-bold'
                          : item.current
                          ? 'text-on-surface font-bold'
                          : 'text-on-surface-variant'
                      }`}
                    >
                      {item.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* 3.c Subject-wise Syllabus Progress */}
          <GlassCard level={1} className="p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-headline text-lg font-bold text-on-surface">
                Subject-wise Syllabus Progress
              </h2>
              <span className="font-mono text-xs text-on-surface-variant">Term Average: 73.5%</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'Advanced Python Programming', pct: 82, completed: 24, total: 29, color: 'bg-primary-container' },
                { title: 'Database Management Systems', pct: 68, completed: 19, total: 28, color: 'bg-secondary-container' },
                { title: 'Computer Networks', pct: 54, completed: 15, total: 28, color: 'bg-tertiary-container' },
                { title: 'Software Engineering', pct: 90, completed: 27, total: 30, color: 'bg-primary-fixed-dim' },
              ].map((subj) => (
                <div key={subj.title} className="p-4 rounded-lg bg-surface-container/60 border border-white/5 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-on-surface">
                    <span className="truncate">{subj.title}</span>
                    <span className="font-mono text-primary">{subj.pct}%</span>
                  </div>
                  <div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden">
                    <div className={`${subj.color} h-full rounded-full`} style={{ width: `${subj.pct}%` }} />
                  </div>
                  <span className="font-mono text-[11px] text-on-surface-variant">
                    {subj.completed} of {subj.total} modules completed
                  </span>
                </div>
              ))}
            </div>
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
              You have <strong className="text-secondary font-semibold">2 pending topics</strong> in Computer Networks before your Friday midterm assessment. We recommend scheduling an intensive 30-minute revision session on TCP flows tomorrow at 15:00.
            </p>
            <GlassButton variant="secondary" size="sm" className="w-full mt-1 text-xs">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              <span>Review & Add Recommendation</span>
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
              />
              <button
                className="absolute right-2 p-1.5 rounded-lg bg-primary-container text-on-primary-container hover:bg-primary-fixed-dim transition-colors cursor-pointer"
                title="Send"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 mt-1">
              {['⚡ Summarize B+ Trees', '🔍 TCP Congestion Formula', '📝 Generate 5 Quiz Questions'].map((chip) => (
                <button
                  key={chip}
                  className="px-2 py-1 rounded bg-surface-container-highest/60 hover:bg-surface-container-high text-on-surface font-mono text-[10px] transition-colors text-left truncate border border-white/5"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Recent knowledge base files */}
            <div className="pt-2 border-t border-white/5 flex flex-col gap-1.5">
              <span className="font-mono text-[10px] text-on-surface-variant">Knowledge Base Sources:</span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-tertiary font-mono text-[10px] shrink-0 flex items-center gap-1 border border-white/5">
                  <FileText className="w-3 h-3" /> DB_Unit4_Notes.pdf
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-tertiary font-mono text-[10px] shrink-0 flex items-center gap-1 border border-white/5">
                  <Presentation className="w-3 h-3" /> Networks_Lec7.pptx
                </span>
              </div>
            </div>
          </GlassCard>

          {/* 3.c Upcoming Deadlines */}
          <GlassCard level={1} className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-sm font-bold text-on-surface flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-secondary" />
                <span>Deadlines & Milestones</span>
              </h3>
              <span className="font-mono text-[10px] text-on-surface-variant">3 Upcoming</span>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="p-2.5 rounded-lg bg-surface-container/60 border border-white/5 flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-semibold text-on-surface">
                  <span className="truncate">Computer Networks Midterm</span>
                  <span className="px-1.5 py-0.5 rounded bg-error/20 text-error font-mono text-[10px]">
                    In 3 days
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-on-surface-variant">
                  <span>Due Oct 27, 2024</span>
                  <span className="text-error">40% syllabus left</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-surface-container/60 border border-white/5 flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-semibold text-on-surface">
                  <span className="truncate">Database Assignment 3 (SQL Triggers)</span>
                  <span className="px-1.5 py-0.5 rounded bg-secondary/20 text-secondary font-mono text-[10px]">
                    In 4 days
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-on-surface-variant">
                  <span>Due Oct 28, 2024</span>
                  <span className="text-primary">In Progress</span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* 3.d Recent Activity */}
          <GlassCard level={1} className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-sm font-bold text-on-surface flex items-center gap-1.5">
                <History className="w-4 h-4 text-primary" />
                <span>Recent Activity</span>
              </h3>
              <span className="font-mono text-[10px] text-on-surface-variant">Live Sync</span>
            </div>

            <div className="flex flex-col gap-3 relative pl-3 border-l border-white/10 text-xs">
              <div className="relative flex flex-col gap-0.5">
                <div className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-primary ring-4 ring-background" />
                <div className="flex items-center justify-between font-medium text-on-surface">
                  <span>Quiz on Vector Embeddings</span>
                  <span className="text-[10px] font-mono text-on-surface-variant">10:15 AM</span>
                </div>
                <span className="font-mono text-[11px] text-primary">Score: 95% (+15 XP)</span>
              </div>

              <div className="relative flex flex-col gap-0.5">
                <div className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-secondary ring-4 ring-background" />
                <div className="flex items-center justify-between font-medium text-on-surface">
                  <span className="truncate">Uploaded Lec8_Distributed_DB.pdf</span>
                  <span className="text-[10px] font-mono text-on-surface-variant">09:00 AM</span>
                </div>
                <span className="font-mono text-[11px] text-on-surface-variant">34 pages parsed & indexed</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
