import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { apiClient } from '@/lib/api-client';
import {
  AvailabilityRule,
  PlanPreview,
  StudySession,
  UnscheduledItem,
} from '@/types/planner';
import {
  Sparkles,
  Calendar,
  Clock,
  RotateCcw,
  Check,
  Play,
  SkipForward,
  Trash2,
  AlertTriangle,
  Sliders,
  CheckCircle2,
  X,
  Info,
  CalendarCheck,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const PlannerPage: React.FC = () => {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [availability, setAvailability] = useState<AvailabilityRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [replanning, setReplanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Planner options
  const [horizonDays, setHorizonDays] = useState(7);
  const [sessionDuration, setSessionDuration] = useState(45);
  const [breakDuration, setBreakDuration] = useState(15);

  // Modals & Panels
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [planPreview, setPlanPreview] = useState<PlanPreview | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Load initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sessionsData, availData] = await Promise.all([
        apiClient<StudySession[]>('/sessions'),
        apiClient<AvailabilityRule[]>('/availability'),
      ]);
      setSessions(sessionsData);
      setAvailability(availData);
    } catch (err: any) {
      console.error('Error fetching planner data:', err);
      setError(err.message || 'Failed to load planner data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update session status (start, complete, skip)
  const handleUpdateSessionStatus = async (
    id: string,
    status: 'in_progress' | 'completed' | 'skipped'
  ) => {
    try {
      const updated = await apiClient<StudySession>(`/sessions/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      setSessions((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch (err: any) {
      setError(err.message || 'Failed to update session');
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await apiClient(`/sessions/${id}`, { method: 'DELETE' });
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete session');
    }
  };

  // Generate Plan Preview
  const handleGeneratePlan = async () => {
    try {
      setGenerating(true);
      setError(null);
      const preview = await apiClient<PlanPreview>('/planner/generate', {
        method: 'POST',
        body: JSON.stringify({
          horizon_days: horizonDays,
          session_duration_minutes: sessionDuration,
          break_duration_minutes: breakDuration,
        }),
      });
      setPlanPreview(preview);
    } catch (err: any) {
      setError(err.message || 'Failed to generate study plan');
    } finally {
      setGenerating(false);
    }
  };

  // Apply Plan
  const handleApplyPlan = async () => {
    if (!planPreview) return;
    try {
      setApplying(true);
      setError(null);
      await apiClient<StudySession[]>('/planner/apply', {
        method: 'POST',
        body: JSON.stringify(planPreview.planned_sessions),
      });
      setPlanPreview(null);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to apply plan');
    } finally {
      setApplying(false);
    }
  };

  // Replan Schedule
  const handleReplanSchedule = async () => {
    try {
      setReplanning(true);
      setError(null);
      const preview = await apiClient<PlanPreview>('/planner/replan', {
        method: 'POST',
        body: JSON.stringify({
          horizon_days: horizonDays,
          session_duration_minutes: sessionDuration,
          break_duration_minutes: breakDuration,
        }),
      });
      await fetchData();
      setPlanPreview(preview); // Show the diff/results
    } catch (err: any) {
      setError(err.message || 'Failed to replan schedule');
    } finally {
      setReplanning(false);
    }
  };

  // Save Availability Rules
  const handleSaveAvailability = async (updatedRules: AvailabilityRule[]) => {
    try {
      const saved = await apiClient<AvailabilityRule[]>('/availability', {
        method: 'PUT',
        body: JSON.stringify(updatedRules),
      });
      setAvailability(saved);
      setShowAvailabilityModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save availability rules');
    }
  };

  const filteredSessions = sessions.filter((s) => {
    if (filterStatus === 'all') return true;
    return s.status === filterStatus;
  });

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">AI Study Planner</h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Deterministic greedy scheduling with deadline constraints & availability windows.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <GlassButton
            variant="glass"
            size="md"
            onClick={() => setShowAvailabilityModal(true)}
          >
            <Sliders className="w-4 h-4 mr-1.5 text-secondary" />
            <span>Availability Rules</span>
          </GlassButton>
          <GlassButton
            variant="glass"
            size="md"
            onClick={handleReplanSchedule}
            disabled={replanning}
          >
            <RotateCcw className={`w-4 h-4 mr-1.5 text-tertiary ${replanning ? 'animate-spin' : ''}`} />
            <span>{replanning ? 'Replanning...' : 'Replan Schedule'}</span>
          </GlassButton>
          <GlassButton
            variant="primary"
            size="md"
            onClick={handleGeneratePlan}
            disabled={generating}
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            <span>{generating ? 'Calculating...' : 'Generate New Plan'}</span>
          </GlassButton>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-error/15 border border-error/30 text-error text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Scheduler Configuration Strip */}
      <GlassCard level={1} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-container/20 border border-primary/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-headline text-sm font-semibold text-on-surface">Scheduling Algorithm Parameters</h3>
            <p className="text-[11px] text-on-surface-variant">Deterministic Multi-Factor Scoring (0.5 Urgency + 0.3 Importance + 0.2 Difficulty)</p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap text-xs">
          <div className="flex items-center gap-2">
            <span className="text-on-surface-variant font-mono">Horizon:</span>
            <select
              value={horizonDays}
              onChange={(e) => setHorizonDays(Number(e.target.value))}
              aria-label="Planning Horizon in Days"
              className="px-2.5 py-1 rounded-lg bg-surface-container-high/80 text-on-surface border border-white/5 font-mono text-xs focus:outline-none focus:border-primary"
            >
              <option value={3}>3 Days</option>
              <option value={7}>7 Days</option>
              <option value={14}>14 Days</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-on-surface-variant font-mono">Session:</span>
            <select
              value={sessionDuration}
              onChange={(e) => setSessionDuration(Number(e.target.value))}
              aria-label="Study Session Duration"
              className="px-2.5 py-1 rounded-lg bg-surface-container-high/80 text-on-surface border border-white/5 font-mono text-xs focus:outline-none focus:border-primary"
            >
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>60 min</option>
              <option value={90}>90 min</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-on-surface-variant font-mono">Break:</span>
            <select
              value={breakDuration}
              onChange={(e) => setBreakDuration(Number(e.target.value))}
              aria-label="Break Duration"
              className="px-2.5 py-1 rounded-lg bg-surface-container-high/80 text-on-surface border border-white/5 font-mono text-xs focus:outline-none focus:border-primary"
            >
              <option value={10}>10 min</option>
              <option value={15}>15 min</option>
              <option value={20}>20 min</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Main Sessions Section */}
      <GlassCard level={1} className="p-6 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-primary" />
            <h2 className="font-headline text-lg font-bold text-on-surface">Scheduled Study Sessions</h2>
            <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-mono text-[10px]">
              {sessions.length} Total
            </span>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-surface-container-highest/60 border border-white/5 self-start text-xs">
            {['all', 'planned', 'in_progress', 'completed', 'skipped'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterStatus(tab)}
                className={`px-2.5 py-1 rounded-md capitalize font-mono text-[11px] transition-all cursor-pointer ${
                  filterStatus === tab
                    ? 'bg-primary-container text-on-primary-container font-semibold shadow-glow-primary'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Sessions List */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-on-surface-variant gap-2">
            <Clock className="w-6 h-6 animate-spin text-primary" />
            <span className="text-xs font-mono">Loading study schedule...</span>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/10 rounded-xl bg-surface-container/30">
            <Calendar className="w-10 h-10 text-on-surface-variant/40 mb-3" />
            <h3 className="font-headline text-sm font-semibold text-on-surface">No sessions found</h3>
            <p className="text-xs text-on-surface-variant max-w-sm mt-1 mb-4">
              {filterStatus === 'all'
                ? "You don't have any study sessions scheduled yet. Click 'Generate New Plan' to build your optimal timetable."
                : `No sessions with status '${filterStatus}'.`}
            </p>
            {filterStatus === 'all' && (
              <GlassButton variant="primary" size="sm" onClick={handleGeneratePlan}>
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                <span>Generate Plan Now</span>
              </GlassButton>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredSessions.map((session) => {
              const start = parseISO(session.start_time);
              const end = parseISO(session.end_time);
              const isDone = session.status === 'completed';
              const isInProgress = session.status === 'in_progress';

              return (
                <div
                  key={session.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isInProgress
                      ? 'bg-surface-container-high/90 border-primary/40 shadow-glow-primary'
                      : isDone
                      ? 'bg-surface-container/40 border-white/5 opacity-80'
                      : 'bg-surface-container/70 border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isDone
                          ? 'bg-primary-container/30 text-primary'
                          : isInProgress
                          ? 'bg-primary text-on-primary animate-pulse'
                          : 'bg-surface-container-highest text-on-surface-variant'
                      }`}
                    >
                      {isDone ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-primary font-semibold">
                          {format(start, 'EEE, MMM d • HH:mm')} - {format(end, 'HH:mm')}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-surface-container-highest text-[10px] font-mono text-on-surface-variant capitalize">
                          {session.session_type}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize ${
                            session.status === 'completed'
                              ? 'bg-primary-container/20 text-primary font-semibold'
                              : session.status === 'in_progress'
                              ? 'bg-secondary-container/30 text-secondary font-semibold'
                              : session.status === 'skipped'
                              ? 'bg-error/20 text-error'
                              : 'bg-surface-container-highest text-on-surface-variant'
                          }`}
                        >
                          {session.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h4
                        className={`text-sm font-semibold truncate mt-1 ${
                          isDone ? 'line-through text-on-surface-variant' : 'text-on-surface'
                        }`}
                      >
                        {session.title}
                      </h4>
                      {session.reasoning && (
                        <p className="text-[11px] text-on-surface-variant/80 mt-0.5 truncate">
                          💡 {session.reasoning}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <span className="text-xs font-mono text-on-surface-variant mr-2">
                      {session.duration_minutes}m
                    </span>

                    {session.status === 'planned' && (
                      <GlassButton
                        variant="glass"
                        size="sm"
                        onClick={() => handleUpdateSessionStatus(session.id, 'in_progress')}
                        title="Start Session"
                      >
                        <Play className="w-3.5 h-3.5 text-primary" />
                      </GlassButton>
                    )}

                    {session.status === 'in_progress' && (
                      <GlassButton
                        variant="primary"
                        size="sm"
                        onClick={() => handleUpdateSessionStatus(session.id, 'completed')}
                        title="Complete Session"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </GlassButton>
                    )}

                    {session.status !== 'completed' && session.status !== 'skipped' && (
                      <GlassButton
                        variant="glass"
                        size="sm"
                        onClick={() => handleUpdateSessionStatus(session.id, 'skipped')}
                        title="Skip Session"
                      >
                        <SkipForward className="w-3.5 h-3.5 text-on-surface-variant" />
                      </GlassButton>
                    )}

                    <GlassButton
                      variant="glass"
                      size="sm"
                      onClick={() => handleDeleteSession(session.id)}
                      title="Delete Session"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-error/80 hover:text-error" />
                    </GlassButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* Plan Preview Modal */}
      {planPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <GlassCard level={2} className="w-full max-w-3xl max-h-[90vh] flex flex-col p-6 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary-container/20 border border-primary/30 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-headline text-lg font-bold text-on-surface">Generated Plan Preview</h3>
                  <p className="text-xs text-on-surface-variant">Review optimized timetable before applying</p>
                </div>
              </div>
              <button
                onClick={() => setPlanPreview(null)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content scrollable */}
            <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-5">
              {/* Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-surface-container/60 border border-white/5">
                  <span className="text-[10px] font-mono uppercase text-on-surface-variant">Planned Sessions</span>
                  <div className="font-headline text-xl font-bold text-primary mt-0.5">
                    {planPreview.planned_sessions.length}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-surface-container/60 border border-white/5">
                  <span className="text-[10px] font-mono uppercase text-on-surface-variant">Planned Time</span>
                  <div className="font-headline text-xl font-bold text-on-surface mt-0.5">
                    {Math.round(planPreview.total_planned_minutes / 60)} hrs
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-surface-container/60 border border-white/5">
                  <span className="text-[10px] font-mono uppercase text-on-surface-variant">Available Time</span>
                  <div className="font-headline text-xl font-bold text-on-surface mt-0.5">
                    {Math.round(planPreview.total_available_minutes / 60)} hrs
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-surface-container/60 border border-white/5">
                  <span className="text-[10px] font-mono uppercase text-on-surface-variant">Unscheduled Items</span>
                  <div className="font-headline text-xl font-bold text-secondary mt-0.5">
                    {planPreview.unscheduled_items.length}
                  </div>
                </div>
              </div>

              {/* Reasoning Summary */}
              {planPreview.reasoning_summary.length > 0 && (
                <div className="p-4 rounded-xl bg-surface-container-high/60 border border-white/5 flex flex-col gap-2">
                  <span className="text-xs font-mono font-semibold text-primary flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    Scheduler Decision Reasoning
                  </span>
                  <ul className="flex flex-col gap-1 text-xs text-on-surface-variant list-disc pl-4">
                    {planPreview.reasoning_summary.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Unscheduled Warnings */}
              {planPreview.unscheduled_items.length > 0 && (
                <div className="p-4 rounded-xl bg-secondary-container/15 border border-secondary/30 flex flex-col gap-2">
                  <span className="text-xs font-mono font-semibold text-secondary flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Items Not Scheduled (Constraint Limits)
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {planPreview.unscheduled_items.map((item: UnscheduledItem) => (
                      <div key={item.id} className="text-xs flex items-center justify-between text-on-surface">
                        <span className="font-medium">{item.title}</span>
                        <span className="font-mono text-secondary text-[11px]">{item.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Planned Sessions List */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-mono font-semibold text-on-surface-variant">
                  Proposed Sessions ({planPreview.planned_sessions.length}):
                </span>
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                  {planPreview.planned_sessions.map((ps, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-surface-container/60 border border-white/5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-on-surface truncate">{ps.title}</div>
                        <div className="text-[11px] font-mono text-on-surface-variant mt-0.5">
                          {format(parseISO(ps.start_time), 'EEE, MMM d • HH:mm')} -{' '}
                          {format(parseISO(ps.end_time), 'HH:mm')}
                        </div>
                      </div>
                      <span className="font-mono text-[11px] text-primary shrink-0">
                        Score: {Math.round(ps.priority_score * 100) / 100}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3 shrink-0">
              <GlassButton variant="glass" size="md" onClick={() => setPlanPreview(null)}>
                Cancel
              </GlassButton>
              <GlassButton variant="primary" size="md" onClick={handleApplyPlan} disabled={applying}>
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                <span>{applying ? 'Applying...' : 'Apply Plan to Schedule'}</span>
              </GlassButton>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Availability Rules Modal */}
      {showAvailabilityModal && (
        <AvailabilityModal
          initialRules={availability}
          onClose={() => setShowAvailabilityModal(false)}
          onSave={handleSaveAvailability}
        />
      )}
    </div>
  );
};

// Sub-component: Availability Modal
interface AvailabilityModalProps {
  initialRules: AvailabilityRule[];
  onClose: () => void;
  onSave: (rules: AvailabilityRule[]) => void;
}

const AvailabilityModal: React.FC<AvailabilityModalProps> = ({
  initialRules,
  onClose,
  onSave,
}) => {
  // Ensure rules for 0-6 days
  const [rules, setRules] = useState<AvailabilityRule[]>(() => {
    const defaultRules: AvailabilityRule[] = DAYS_OF_WEEK.map((_, dayIndex) => {
      const existing = initialRules.find((r) => r.day_of_week === dayIndex);
      return (
        existing || {
          day_of_week: dayIndex,
          start_time: '09:00',
          end_time: '18:00',
          is_active: dayIndex >= 1 && dayIndex <= 5, // Mon-Fri active by default
        }
      );
    });
    return defaultRules;
  });

  const handleToggleDay = (dayIndex: number) => {
    setRules((prev) =>
      prev.map((r) =>
        r.day_of_week === dayIndex ? { ...r, is_active: !r.is_active } : r
      )
    );
  };

  const handleTimeChange = (
    dayIndex: number,
    field: 'start_time' | 'end_time',
    val: string
  ) => {
    setRules((prev) =>
      prev.map((r) => (r.day_of_week === dayIndex ? { ...r, [field]: val } : r))
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <GlassCard level={2} className="w-full max-w-xl flex flex-col p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-secondary" />
            <h3 className="font-headline text-lg font-bold text-on-surface">Weekly Study Availability</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-on-surface-variant my-4">
          Configure which days and hours the intelligent scheduler can allocate study sessions for you.
        </p>

        <div className="flex flex-col gap-2.5 max-h-96 overflow-y-auto pr-1">
          {rules.map((rule) => {
            const dayName = DAYS_OF_WEEK[rule.day_of_week];
            return (
              <div
                key={rule.day_of_week}
                className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  rule.is_active
                    ? 'bg-surface-container/70 border-white/10'
                    : 'bg-surface-container/30 border-transparent opacity-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={rule.is_active}
                    onChange={() => handleToggleDay(rule.day_of_week)}
                    id={`day-${rule.day_of_week}`}
                    className="w-4 h-4 rounded text-primary focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <label
                    htmlFor={`day-${rule.day_of_week}`}
                    className="font-medium text-xs text-on-surface cursor-pointer select-none w-24"
                  >
                    {dayName}
                  </label>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  <input
                    type="time"
                    value={rule.start_time}
                    disabled={!rule.is_active}
                    onChange={(e) =>
                      handleTimeChange(rule.day_of_week, 'start_time', e.target.value)
                    }
                    className="px-2 py-1 rounded bg-surface-container-high text-on-surface border border-white/5 focus:outline-none focus:border-primary disabled:opacity-40"
                  />
                  <span className="text-on-surface-variant">to</span>
                  <input
                    type="time"
                    value={rule.end_time}
                    disabled={!rule.is_active}
                    onChange={(e) =>
                      handleTimeChange(rule.day_of_week, 'end_time', e.target.value)
                    }
                    className="px-2 py-1 rounded bg-surface-container-high text-on-surface border border-white/5 focus:outline-none focus:border-primary disabled:opacity-40"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-end gap-3">
          <GlassButton variant="glass" size="md" onClick={onClose}>
            Cancel
          </GlassButton>
          <GlassButton variant="primary" size="md" onClick={() => onSave(rules)}>
            Save Rules
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
};
