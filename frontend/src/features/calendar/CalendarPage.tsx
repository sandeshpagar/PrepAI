import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { apiClient } from '@/lib/api-client';
import { CalendarEvent } from '@/types/planner';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  BookOpen,
  AlertCircle,
  GraduationCap,
  Check,
  Play,
} from 'lucide-react';
import {
  format,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
  isSameDay,
  parseISO,
  isToday,
} from 'date-fns';

export const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  // Compute week range
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Fetch events
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const startStr = weekStart.toISOString();
      const endStr = weekEnd.toISOString();
      const data = await apiClient<CalendarEvent[]>(
        `/calendar/events?start_date=${encodeURIComponent(startStr)}&end_date=${encodeURIComponent(endStr)}`
      );
      setEvents(data);
    } catch (err) {
      console.error('Failed to fetch calendar events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'week') {
      setCurrentDate((prev) => subWeeks(prev, 1));
    } else {
      setCurrentDate((prev) => subDays(prev, 1));
      setSelectedDate((prev) => subDays(prev, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'week') {
      setCurrentDate((prev) => addWeeks(prev, 1));
    } else {
      setCurrentDate((prev) => addDays(prev, 1));
      setSelectedDate((prev) => addDays(prev, 1));
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Update session status directly from calendar
  const handleUpdateSessionStatus = async (
    sessionId: string,
    status: 'in_progress' | 'completed'
  ) => {
    try {
      await apiClient(`/sessions/${sessionId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      await fetchEvents();
    } catch (err) {
      console.error('Failed to update session:', err);
    }
  };

  // Filter events for selected day
  const selectedDayEvents = events.filter((ev) =>
    isSameDay(parseISO(ev.start_time), selectedDate)
  );

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">Academic Calendar</h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Aggregated timeline of study sessions, task deadlines, and exams.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* View mode toggle */}
          <div className="flex items-center p-1 rounded-lg bg-surface-container-highest/60 border border-white/5 text-xs font-mono">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-primary-container text-on-primary-container font-semibold shadow-glow-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => {
                setViewMode('day');
                setSelectedDate(currentDate);
              }}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'day'
                  ? 'bg-primary-container text-on-primary-container font-semibold shadow-glow-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Day
            </button>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <GlassButton variant="glass" size="sm" onClick={handleToday}>
              Today
            </GlassButton>
            <GlassButton variant="glass" size="sm" onClick={handlePrev}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </GlassButton>
            <span className="font-mono text-xs font-semibold px-2 min-w-28 text-center text-on-surface">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <GlassButton variant="glass" size="sm" onClick={handleNext}>
              <ChevronRight className="w-3.5 h-3.5" />
            </GlassButton>
          </div>
        </div>
      </div>

      {/* Main Grid: Week Timetable & Day Agenda */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Calendar Grid (8 cols in week view or 12 in full) */}
        <div className={viewMode === 'week' ? 'lg:col-span-8 flex flex-col gap-4' : 'lg:col-span-12'}>
          <GlassCard level={1} className="p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-on-surface-variant flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary" />
                {viewMode === 'week'
                  ? `Week of ${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
                  : format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </span>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="flex items-center gap-1.5 text-primary">
                  <span className="w-2 h-2 rounded-full bg-primary" /> Session
                </span>
                <span className="flex items-center gap-1.5 text-secondary">
                  <span className="w-2 h-2 rounded-full bg-secondary" /> Exam
                </span>
                <span className="flex items-center gap-1.5 text-tertiary">
                  <span className="w-2 h-2 rounded-full bg-tertiary" /> Deadline
                </span>
              </div>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-on-surface-variant gap-2">
                <Clock className="w-6 h-6 animate-spin text-primary" />
                <span className="text-xs font-mono">Loading calendar schedule...</span>
              </div>
            ) : viewMode === 'week' ? (
              /* Week Grid (7 columns) */
              <div className="grid grid-cols-7 gap-2 overflow-x-auto min-w-[600px] pt-2">
                {weekDays.map((day) => {
                  const dayEvents = events.filter((ev) =>
                    isSameDay(parseISO(ev.start_time), day)
                  );
                  const isDayToday = isToday(day);
                  const isDaySelected = isSameDay(day, selectedDate);

                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={`flex flex-col gap-2 p-2.5 rounded-xl border transition-all cursor-pointer min-h-[320px] ${
                        isDaySelected
                          ? 'bg-surface-container-high/90 border-primary/40 ring-1 ring-primary/40'
                          : isDayToday
                          ? 'bg-surface-container/80 border-primary/20'
                          : 'bg-surface-container/40 border-white/5 hover:bg-surface-container/60'
                      }`}
                    >
                      {/* Day Header */}
                      <div className="flex flex-col items-center pb-2 border-b border-white/5">
                        <span className="text-[10px] font-mono uppercase text-on-surface-variant font-medium">
                          {format(day, 'EEE')}
                        </span>
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold mt-0.5 ${
                            isDayToday
                              ? 'bg-primary text-on-primary shadow-glow-primary'
                              : 'text-on-surface'
                          }`}
                        >
                          {format(day, 'd')}
                        </span>
                      </div>

                      {/* Day Events Stack */}
                      <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto">
                        {dayEvents.length === 0 ? (
                          <div className="flex-1 flex items-center justify-center">
                            <span className="text-[10px] font-mono text-on-surface-variant/30 text-center">
                              Free
                            </span>
                          </div>
                        ) : (
                          dayEvents.map((ev) => (
                            <div
                              key={ev.id}
                              className={`p-1.5 rounded-lg border text-left flex flex-col gap-0.5 transition-transform hover:scale-[1.02] ${
                                ev.event_type === 'study_session'
                                  ? ev.status === 'completed'
                                    ? 'bg-primary-container/10 border-primary/20 opacity-70'
                                    : 'bg-primary-container/20 border-primary/30 text-primary'
                                  : ev.event_type === 'assessment'
                                  ? 'bg-secondary-container/25 border-secondary/40 text-secondary'
                                  : 'bg-tertiary-container/20 border-tertiary/30 text-tertiary'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-mono opacity-80 truncate">
                                  {format(parseISO(ev.start_time), 'HH:mm')}
                                </span>
                                {ev.event_type === 'study_session' && ev.status === 'completed' && (
                                  <Check className="w-2.5 h-2.5 stroke-[3] text-primary" />
                                )}
                              </div>
                              <span
                                className={`text-[10px] font-semibold leading-tight line-clamp-2 ${
                                  ev.status === 'completed' ? 'line-through opacity-70' : ''
                                }`}
                              >
                                {ev.title}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Full Day View */
              <div className="flex flex-col gap-3 py-2">
                {selectedDayEvents.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <CalendarIcon className="w-10 h-10 text-on-surface-variant/30 mb-2" />
                    <span className="text-sm font-semibold text-on-surface">No events scheduled</span>
                    <span className="text-xs text-on-surface-variant mt-1">Enjoy your free time or schedule a new study session!</span>
                  </div>
                ) : (
                  selectedDayEvents.map((ev) => (
                    <DayEventRow
                      key={ev.id}
                      event={ev}
                      onUpdateStatus={handleUpdateSessionStatus}
                    />
                  ))
                )}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Right Column: Selected Day Agenda Drawer (Only in Week view) */}
        {viewMode === 'week' && (
          <div className="lg:col-span-4 flex flex-col gap-4">
            <GlassCard level={2} className="p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h3 className="font-headline text-sm font-bold text-on-surface">
                    {format(selectedDate, 'EEEE, MMM d')}
                  </h3>
                  <span className="text-[11px] font-mono text-on-surface-variant">
                    {selectedDayEvents.length} scheduled item{selectedDayEvents.length === 1 ? '' : 's'}
                  </span>
                </div>
                {isToday(selectedDate) && (
                  <span className="px-2 py-0.5 rounded-full bg-primary-container/20 text-primary font-mono text-[10px] font-semibold">
                    Today
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
                {selectedDayEvents.length === 0 ? (
                  <div className="py-10 flex flex-col items-center justify-center text-center">
                    <Clock className="w-8 h-8 text-on-surface-variant/30 mb-2" />
                    <span className="text-xs text-on-surface font-medium">No events for this day</span>
                    <span className="text-[11px] text-on-surface-variant mt-1">
                      Select another day or generate a plan.
                    </span>
                  </div>
                ) : (
                  selectedDayEvents.map((ev) => (
                    <DayEventRow
                      key={ev.id}
                      event={ev}
                      onUpdateStatus={handleUpdateSessionStatus}
                    />
                  ))
                )}
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
};

// Sub-component: Day Event Row
interface DayEventRowProps {
  event: CalendarEvent;
  onUpdateStatus: (sessionId: string, status: 'in_progress' | 'completed') => void;
}

const DayEventRow: React.FC<DayEventRowProps> = ({ event, onUpdateStatus }) => {
  const start = parseISO(event.start_time);
  const end = parseISO(event.end_time);
  const isDone = event.status === 'completed';
  const isInProgress = event.status === 'in_progress';

  const getIcon = () => {
    switch (event.event_type) {
      case 'assessment':
        return <GraduationCap className="w-4 h-4 text-secondary" />;
      case 'task_deadline':
        return <AlertCircle className="w-4 h-4 text-tertiary" />;
      default:
        return <BookOpen className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div
      className={`p-3.5 rounded-xl border flex flex-col gap-2 transition-all ${
        isInProgress
          ? 'bg-surface-container-high/90 border-primary/40 shadow-glow-primary'
          : isDone
          ? 'bg-surface-container/30 border-white/5 opacity-70'
          : 'bg-surface-container/60 border-white/5'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-surface-container-highest shrink-0">
            {getIcon()}
          </div>
          <div className="min-w-0">
            <span
              className={`text-xs font-semibold block truncate ${
                isDone ? 'line-through text-on-surface-variant' : 'text-on-surface'
              }`}
            >
              {event.title}
            </span>
            <span className="text-[10px] font-mono text-on-surface-variant">
              {format(start, 'HH:mm')}
              {event.event_type === 'study_session' && ` - ${format(end, 'HH:mm')}`}
            </span>
          </div>
        </div>

        <span
          className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize shrink-0 ${
            event.event_type === 'study_session'
              ? event.status === 'completed'
                ? 'bg-primary-container/20 text-primary'
                : event.status === 'in_progress'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-highest text-on-surface-variant'
              : event.event_type === 'assessment'
              ? 'bg-secondary-container/30 text-secondary'
              : 'bg-tertiary-container/30 text-tertiary'
          }`}
        >
          {event.event_type === 'study_session' ? event.status : event.event_type.replace('_', ' ')}
        </span>
      </div>

      {/* Quick Study Session Actions */}
      {event.event_type === 'study_session' && !isDone && (
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
          {event.status === 'planned' && (
            <GlassButton
              variant="glass"
              size="sm"
              onClick={() => onUpdateStatus(event.id, 'in_progress')}
              className="text-[11px] py-1"
            >
              <Play className="w-3 h-3 text-primary mr-1" />
              <span>Start</span>
            </GlassButton>
          )}
          {event.status === 'in_progress' && (
            <GlassButton
              variant="primary"
              size="sm"
              onClick={() => onUpdateStatus(event.id, 'completed')}
              className="text-[11px] py-1"
            >
              <Check className="w-3 h-3 stroke-[3] mr-1" />
              <span>Complete</span>
            </GlassButton>
          )}
        </div>
      )}
    </div>
  );
};
