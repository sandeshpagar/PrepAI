import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CheckSquare, Plus } from 'lucide-react';
import { GlassButton } from '@/components/ui/GlassButton';

export const TasksPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">My Tasks & Assessments</h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Track assignments, revision blocks, and exam deadlines.
          </p>
        </div>
        <GlassButton variant="primary" size="md">
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Add Task</span>
        </GlassButton>
      </div>

      <GlassCard level={1} className="p-8 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-xl bg-tertiary-container/20 border border-tertiary/30 flex items-center justify-center mb-4">
          <CheckSquare className="w-6 h-6 text-tertiary" />
        </div>
        <h2 className="font-headline text-lg font-bold text-on-surface mb-2">
          Academic Task Management
        </h2>
        <p className="text-xs text-on-surface-variant max-w-md mb-6 leading-relaxed">
          Filter by upcoming, overdue, and completed tasks with integrated syllabus topic linkage (Phase 2 feature).
        </p>
        <span className="text-xs font-mono text-on-surface-variant bg-surface-container-high/60 px-3 py-1.5 rounded-lg border border-white/5">
          CRUD & Calendar Aggregations Ready for Phase 2 Integration
        </span>
      </GlassCard>
    </div>
  );
};
