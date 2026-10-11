import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Sparkles, Calendar, Plus } from 'lucide-react';
import { GlassButton } from '@/components/ui/GlassButton';

export const PlannerPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">AI Study Planner</h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Deterministic, constraint-based timetable and study plan optimizer.
          </p>
        </div>
        <GlassButton variant="primary" size="md">
          <Plus className="w-4 h-4 mr-1.5" />
          <span>New Study Plan</span>
        </GlassButton>
      </div>

      <GlassCard level={1} className="p-8 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-xl bg-primary-container/20 border border-primary/30 flex items-center justify-center mb-4">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <h2 className="font-headline text-lg font-bold text-on-surface mb-2">
          Intelligent Study Planner Engine
        </h2>
        <p className="text-xs text-on-surface-variant max-w-md mb-6 leading-relaxed">
          The planning engine calculates optimal priority queues based on deadlines, syllabus difficulties, and availability windows (Phase 2 feature).
        </p>
        <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant bg-surface-container-high/60 px-3 py-1.5 rounded-lg border border-white/5">
          <Calendar className="w-3.5 h-3.5 text-secondary" />
          <span>Deterministic Greedy Scheduler Ready for Phase 2 Integration</span>
        </div>
      </GlassCard>
    </div>
  );
};
