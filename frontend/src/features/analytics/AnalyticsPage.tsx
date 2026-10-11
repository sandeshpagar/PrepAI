import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { BarChart3, TrendingUp } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h1 className="font-headline text-2xl font-bold text-on-surface">Progress & Analytics</h1>
        <p className="text-xs text-on-surface-variant mt-1">
          Evidence-based academic tracking without fabricated usage data.
        </p>
      </div>

      <GlassCard level={1} className="p-8 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-xl bg-primary-container/20 border border-primary/30 flex items-center justify-center mb-4">
          <BarChart3 className="w-6 h-6 text-primary" />
        </div>
        <h2 className="font-headline text-lg font-bold text-on-surface mb-2">
          Academic Analytics Engine
        </h2>
        <p className="text-xs text-on-surface-variant max-w-md mb-6 leading-relaxed">
          Aggregates actual planned vs completed study hours, retention trends, and syllabus mastery percentages from persisted sessions (Phase 5 feature).
        </p>
        <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant bg-surface-container-high/60 px-3 py-1.5 rounded-lg border border-white/5">
          <TrendingUp className="w-3.5 h-3.5 text-primary" />
          <span>Strict Real-Data Metrics Schema Configured</span>
        </div>
      </GlassCard>
    </div>
  );
};
