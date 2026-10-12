import React from 'react';
import { DailyStudyPoint } from '@/types/analytics';
import { GlassCard } from '@/components/ui/GlassCard';
import { BarChart3, Clock } from 'lucide-react';

interface WeeklyStudyChartProps {
  dailyTrend: DailyStudyPoint[];
}

export const WeeklyStudyChart: React.FC<WeeklyStudyChartProps> = ({ dailyTrend }) => {
  const maxMinutes = Math.max(
    60,
    ...dailyTrend.map((d) => Math.max(d.planned_minutes, d.completed_minutes))
  );

  const totalCompletedMins = dailyTrend.reduce((acc, d) => acc + d.completed_minutes, 0);
  const totalPlannedMins = dailyTrend.reduce((acc, d) => acc + d.planned_minutes, 0);

  return (
    <GlassCard level={1} className="p-5 sm:p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="font-headline text-lg font-bold text-on-surface">Weekly Study Trend</h2>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-primary shadow-glow-primary" />
            <span className="text-on-surface-variant">Completed ({(totalCompletedMins / 60).toFixed(1)}h)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-secondary/60 border border-secondary/40" />
            <span className="text-on-surface-variant">Planned ({(totalPlannedMins / 60).toFixed(1)}h)</span>
          </div>
        </div>
      </div>

      {dailyTrend.length === 0 || (totalCompletedMins === 0 && totalPlannedMins === 0) ? (
        <div className="py-8 flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/10 rounded-xl bg-surface-container/20">
          <Clock className="w-8 h-8 text-on-surface-variant/40 mb-2" />
          <span className="text-xs font-semibold text-on-surface">No study hours recorded this week</span>
          <span className="text-[11px] text-on-surface-variant max-w-sm mt-0.5">
            Complete a scheduled study block in the AI Planner to track your daily progress here.
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2 sm:gap-3 items-end h-40 pt-4 px-2">
          {dailyTrend.map((day) => {
            const completedHeight = Math.min(100, Math.round((day.completed_minutes / maxMinutes) * 100));
            const plannedHeight = Math.min(100, Math.round((day.planned_minutes / maxMinutes) * 100));

            return (
              <div key={day.date} className="flex flex-col items-center gap-2 h-full justify-end group relative">
                {/* Tooltip */}
                <div className="absolute -top-8 bg-surface-container-highest text-on-surface text-[10px] font-mono px-2 py-0.5 rounded shadow border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                  {day.day_name}: {day.completed_minutes}m done / {day.planned_minutes}m plan
                </div>

                {/* Bars Container */}
                <div className="flex items-end gap-1 h-28 w-full max-w-[28px] justify-center">
                  {/* Planned Bar */}
                  <div
                    className="w-2.5 bg-secondary/30 border border-secondary/40 rounded-t-sm transition-all"
                    style={{ height: `${Math.max(4, plannedHeight)}%` }}
                    title={`Planned: ${day.planned_minutes} mins`}
                  />
                  {/* Completed Bar */}
                  <div
                    className="w-2.5 bg-primary shadow-glow-primary rounded-t-sm transition-all"
                    style={{ height: `${Math.max(4, completedHeight)}%` }}
                    title={`Completed: ${day.completed_minutes} mins`}
                  />
                </div>

                {/* Day Label */}
                <span className="text-[11px] font-mono text-on-surface-variant font-medium">
                  {day.day_name}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
};
