import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ActivityEvent } from '@/types/analytics';
import { GlassCard } from '@/components/ui/GlassCard';
import { History, CheckCircle2, CheckSquare, BookOpen, Clock } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface RecentActivityFeedProps {
  activities: ActivityEvent[];
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ activities }) => {
  const navigate = useNavigate();

  const getIcon = (type: string) => {
    switch (type) {
      case 'session_completed':
        return <CheckCircle2 className="w-4 h-4 text-primary" />;
      case 'task_completed':
        return <CheckSquare className="w-4 h-4 text-secondary" />;
      case 'document_indexed':
        return <BookOpen className="w-4 h-4 text-accent-blue" />;
      default:
        return <Clock className="w-4 h-4 text-on-surface-variant" />;
    }
  };

  const formatTime = (ts: string) => {
    try {
      return formatDistanceToNow(parseISO(ts), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  return (
    <GlassCard level={1} className="p-5 sm:p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-secondary" />
          <h2 className="font-headline text-lg font-bold text-on-surface">Recent Activity</h2>
        </div>
        <span className="text-[11px] font-mono text-on-surface-variant">
          {activities.length} recorded events
        </span>
      </div>

      {activities.length === 0 ? (
        <div className="py-6 flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/10 rounded-xl bg-surface-container/20">
          <Clock className="w-7 h-7 text-on-surface-variant/40 mb-2" />
          <span className="text-xs font-semibold text-on-surface">No activity recorded yet</span>
          <span className="text-[11px] text-on-surface-variant max-w-xs mt-0.5">
            Complete a study session or task to start building your activity history.
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {activities.slice(0, 6).map((act) => (
            <div
              key={act.id}
              onClick={() => act.link_url && navigate(act.link_url)}
              className="p-3 rounded-lg bg-surface-container/60 border border-white/5 flex items-start justify-between gap-3 hover:bg-surface-container-high/60 transition-colors cursor-pointer group"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-1.5 rounded-lg bg-surface-container-highest shrink-0 mt-0.5">
                  {getIcon(act.event_type)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-on-surface group-hover:text-primary transition-colors truncate">
                    {act.title}
                  </p>
                  <p className="text-[11px] text-on-surface-variant truncate mt-0.5">
                    {act.description}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-on-surface-variant/70 shrink-0 whitespace-nowrap self-center">
                {formatTime(act.timestamp)}
              </span>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
};
