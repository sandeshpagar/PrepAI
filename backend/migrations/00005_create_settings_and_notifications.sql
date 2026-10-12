-- Migration: 00005_create_settings_and_notifications.sql
-- Description: Supports user preferences, in-app notifications, and activity logs with RLS

-- 1. USER SETTINGS TABLE
CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    target_study_hours NUMERIC(4, 1) NOT NULL DEFAULT 4.0 CHECK (target_study_hours >= 0.5 AND target_study_hours <= 16.0),
    preferred_session_duration INT NOT NULL DEFAULT 45 CHECK (preferred_session_duration >= 15 AND preferred_session_duration <= 180),
    exam_alert_lead_days INT NOT NULL DEFAULT 7 CHECK (exam_alert_lead_days >= 1 AND exam_alert_lead_days <= 30),
    notify_upcoming_deadlines BOOLEAN NOT NULL DEFAULT TRUE,
    notify_session_reminders BOOLEAN NOT NULL DEFAULT TRUE,
    notify_document_indexing BOOLEAN NOT NULL DEFAULT TRUE,
    display_name TEXT,
    university TEXT,
    major TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('exam_alert', 'task_deadline', 'session_reminder', 'document_indexed')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    dedupe_key TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_dedupe UNIQUE (user_id, dedupe_key)
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications (user_id, is_read, created_at DESC);

-- 3. ACTIVITY EVENTS TABLE
CREATE TABLE IF NOT EXISTS activity_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    link_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_activity_events_user_time ON activity_events (user_id, created_at DESC);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings"
    ON user_settings FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own notifications"
    ON notifications FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own activity events"
    ON activity_events FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
