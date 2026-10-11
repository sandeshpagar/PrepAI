import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { GlassButton } from '@/components/ui/GlassButton';

export const CalendarPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">Academic Calendar</h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Month, week, and day agenda views for exams and scheduled study sessions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <GlassButton variant="glass" size="sm">
            <ChevronLeft className="w-3.5 h-3.5" />
          </GlassButton>
          <span className="font-mono text-xs font-semibold px-2">October 2024</span>
          <GlassButton variant="glass" size="sm">
            <ChevronRight className="w-3.5 h-3.5" />
          </GlassButton>
        </div>
      </div>

      <GlassCard level={1} className="p-8 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-xl bg-secondary-container/20 border border-secondary/30 flex items-center justify-center mb-4">
          <CalendarIcon className="w-6 h-6 text-secondary" />
        </div>
        <h2 className="font-headline text-lg font-bold text-on-surface mb-2">
          Interactive Study Timetable
        </h2>
        <p className="text-xs text-on-surface-variant max-w-md mb-6 leading-relaxed">
          Synchronized event blocks for assignments, revision sessions, and midterm assessments (Phase 2 feature).
        </p>
        <span className="text-xs font-mono text-on-surface-variant bg-surface-container-high/60 px-3 py-1.5 rounded-lg border border-white/5">
          Timezone-Aware Schedule Aggregation Ready for Phase 2 Integration
        </span>
      </GlassCard>
    </div>
  );
};
