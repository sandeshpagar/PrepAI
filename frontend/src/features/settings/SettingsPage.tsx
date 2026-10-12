import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { Shield, User, Bell, Clock, Save, Check, Sparkles, BookOpen } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { apiClient } from '@/lib/api-client';
import { UserSettings } from '@/types/settings';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form fields
  const [displayName, setDisplayName] = useState('');
  const [university, setUniversity] = useState('');
  const [major, setMajor] = useState('');
  const [targetHours, setTargetHours] = useState(4.0);
  const [duration, setDuration] = useState(45);
  const [examLeadDays, setExamLeadDays] = useState(7);
  const [notifyDeadlines, setNotifyDeadlines] = useState(true);
  const [notifySessions, setNotifySessions] = useState(true);
  const [notifyDocs, setNotifyDocs] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiClient<UserSettings>('/settings');
        setSettings(res);
        setDisplayName(res.display_name || '');
        setUniversity(res.university || '');
        setMajor(res.major || '');
        setTargetHours(res.target_study_hours || 4.0);
        setDuration(res.preferred_session_duration || 45);
        setExamLeadDays(res.exam_alert_lead_days || 7);
        setNotifyDeadlines(res.notify_upcoming_deadlines ?? true);
        setNotifySessions(res.notify_session_reminders ?? true);
        setNotifyDocs(res.notify_document_indexing ?? true);
      } catch (err) {
        console.error('Failed to load user settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSaveSuccess(false);
      const updated = await apiClient<UserSettings>('/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          display_name: displayName.trim() || null,
          university: university.trim() || null,
          major: major.trim() || null,
          target_study_hours: targetHours,
          preferred_session_duration: duration,
          exam_alert_lead_days: examLeadDays,
          notify_upcoming_deadlines: notifyDeadlines,
          notify_session_reminders: notifySessions,
          notify_document_indexing: notifyDocs,
        }),
      });
      setSettings(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
        <Clock className="w-6 h-6 animate-spin text-primary" />
        <span className="text-xs font-mono">Loading system preferences...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
            Account & Study Settings
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Manage your academic targets, study session habits, notifications, and security.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="flex items-center gap-1.5 text-xs font-mono text-primary animate-fade-in bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Saved Successfully</span>
            </span>
          )}
          <GlassButton
            type="submit"
            variant="primary"
            size="md"
            disabled={saving}
            className="text-xs font-semibold"
          >
            {saving ? (
              <Clock className="w-4 h-4 animate-spin mr-1.5" />
            ) : (
              <Save className="w-4 h-4 mr-1.5" />
            )}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </GlassButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Profile & Academic Information */}
        <GlassCard level={1} className="p-6 flex flex-col gap-5">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <User className="w-5 h-5 text-primary" />
            <h2 className="font-headline text-base font-bold text-on-surface">
              Profile & Academic Information
            </h2>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-on-surface mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Elena Vance"
                className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest/80 border border-white/10 text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-on-surface mb-1.5">
                University / Institution
              </label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="e.g. Stanford University"
                className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest/80 border border-white/10 text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-on-surface mb-1.5">
                Academic Program / Major
              </label>
              <input
                type="text"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                placeholder="e.g. Computer Science & AI"
                className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest/80 border border-white/10 text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-all"
              />
            </div>

            <div className="p-3 rounded-lg bg-surface-container/40 border border-white/5 space-y-1">
              <span className="block text-[11px] font-mono text-on-surface-variant">
                Authenticated Account: {user?.email || 'authenticated-user@prepai.local'}
              </span>
              <span className="block text-[10px] font-mono text-on-surface-variant/60">
                User ID: {user?.id || settings?.user_id || 'dev-student-1'}
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Section 2: Study Habits & Targets */}
        <GlassCard level={1} className="p-6 flex flex-col gap-5">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <Clock className="w-5 h-5 text-secondary" />
            <h2 className="font-headline text-base font-bold text-on-surface">
              Study Targets & Session Habits
            </h2>
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-on-surface">
                  Daily Study Goal (Hours)
                </label>
                <span className="text-xs font-mono font-bold text-primary">
                  {targetHours} hours/day
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="12.0"
                step="0.5"
                value={targetHours}
                onChange={(e) => setTargetHours(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] font-mono text-on-surface-variant mt-1">
                <span>1.0h Light</span>
                <span>4.0h Standard</span>
                <span>8.0h+ Intensive</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-on-surface mb-2">
                Preferred Study Session Duration
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '25m', desc: 'Pomodoro', val: 25 },
                  { label: '45m', desc: 'Standard', val: 45 },
                  { label: '60m', desc: 'Deep Work', val: 60 },
                  { label: '90m', desc: 'Extended', val: 90 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setDuration(item.val)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      duration === item.val
                        ? 'bg-secondary-container/30 border-secondary text-on-surface shadow-glow-secondary'
                        : 'bg-surface-container/60 border-white/5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    <div className="text-xs font-bold font-mono">{item.label}</div>
                    <div className="text-[10px] opacity-70 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-on-surface mb-2">
                Upcoming Exam Alert Lead Time
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '3 Days', val: 3 },
                  { label: '7 Days', val: 7 },
                  { label: '14 Days', val: 14 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setExamLeadDays(item.val)}
                    className={`py-2 px-3 rounded-xl border text-xs font-mono font-medium transition-all cursor-pointer ${
                      examLeadDays === item.val
                        ? 'bg-primary-container/30 border-primary text-primary shadow-glow-primary'
                        : 'bg-surface-container/60 border-white/5 text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Section 3: In-App Reminder Preferences */}
        <GlassCard level={1} className="p-6 flex flex-col gap-5">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <Bell className="w-5 h-5 text-tertiary" />
            <h2 className="font-headline text-base font-bold text-on-surface">
              In-App Reminder Preferences
            </h2>
          </div>

          <div className="flex flex-col gap-4">
            <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container/60 border border-white/5 cursor-pointer hover:bg-surface-container-high/60 transition-colors">
              <div>
                <div className="text-xs font-semibold text-on-surface">Upcoming Deadlines & Exams</div>
                <div className="text-[11px] text-on-surface-variant mt-0.5">
                  Receive notifications before assignment dates and exams.
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifyDeadlines}
                onChange={(e) => setNotifyDeadlines(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 accent-primary cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container/60 border border-white/5 cursor-pointer hover:bg-surface-container-high/60 transition-colors">
              <div>
                <div className="text-xs font-semibold text-on-surface">Study Session Reminders</div>
                <div className="text-[11px] text-on-surface-variant mt-0.5">
                  Alerts for scheduled sessions planned for today.
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifySessions}
                onChange={(e) => setNotifySessions(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 accent-primary cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container/60 border border-white/5 cursor-pointer hover:bg-surface-container-high/60 transition-colors">
              <div>
                <div className="text-xs font-semibold text-on-surface">Document Processing & Indexing</div>
                <div className="text-[11px] text-on-surface-variant mt-0.5">
                  Notification when uploaded study materials finish vector indexing.
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifyDocs}
                onChange={(e) => setNotifyDocs(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 accent-primary cursor-pointer"
              />
            </label>
          </div>
        </GlassCard>

        {/* Section 4: Security & Privacy */}
        <GlassCard level={1} className="p-6 flex flex-col gap-4 justify-between">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="font-headline text-base font-bold text-on-surface">
                Data Privacy & Security
              </h2>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Your study notes, assignments, documents, and chat history are isolated via Supabase Row Level Security (RLS) and stored with per-user ownership constraints.
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-on-surface">
                <Sparkles className="w-4 h-4 text-primary shrink-0" />
                <span>Local Ollama AI ensures documents never leak to external clouds.</span>
              </div>
              <div className="flex items-center gap-2 text-on-surface">
                <BookOpen className="w-4 h-4 text-secondary shrink-0" />
                <span>Deterministic study scheduler runs locally without hallucinated dates.</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-primary bg-primary/10 px-3 py-2 rounded-lg border border-primary/20">
            <Shield className="w-3.5 h-3.5" />
            <span>RLS Active • Local Privacy Guardrails Enforced</span>
          </div>
        </GlassCard>
      </div>
    </form>
  );
};
