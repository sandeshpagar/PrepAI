-- ==============================================================================
-- PrepAI Migration 00002: Study Planner, Tasks, Syllabus & Calendar Tables
-- Subordinate to: PRD Section 6 (FR-02 to FR-06), Architecture Section 7, 8, 9
-- ==============================================================================

-- 1. Subjects
create table if not exists public.subjects (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    code text,
    color text default '#43E58B',
    term text,
    target_completion_date date,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

create index if not exists idx_subjects_user_id on public.subjects(user_id);
alter table public.subjects enable row level security;

create policy "Users can manage their own subjects"
    on public.subjects for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- 2. Syllabus Topics
create table if not exists public.syllabus_topics (
    id uuid primary key default gen_random_uuid(),
    subject_id uuid not null references public.subjects(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    importance integer default 3 check (importance between 1 and 5),
    estimated_minutes integer default 45 check (estimated_minutes > 0),
    difficulty integer default 3 check (difficulty between 1 and 5),
    status text default 'todo' check (status in ('todo', 'in_progress', 'completed')),
    order_index integer default 0,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

create index if not exists idx_topics_subject on public.syllabus_topics(subject_id);
create index if not exists idx_topics_user on public.syllabus_topics(user_id);
alter table public.syllabus_topics enable row level security;

create policy "Users can manage their own topics"
    on public.syllabus_topics for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- 3. Tasks
create table if not exists public.tasks (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    subject_id uuid references public.subjects(id) on delete set null,
    topic_id uuid references public.syllabus_topics(id) on delete set null,
    title text not null,
    description text,
    category text default 'assignment' check (category in ('assignment', 'revision', 'practice', 'reading', 'exam_prep')),
    priority text default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
    estimated_duration_minutes integer default 45 check (estimated_duration_minutes > 0),
    due_date timestamptz,
    status text default 'todo' check (status in ('todo', 'in_progress', 'completed')),
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

create index if not exists idx_tasks_user on public.tasks(user_id);
create index if not exists idx_tasks_due_date on public.tasks(due_date);
alter table public.tasks enable row level security;

create policy "Users can manage their own tasks"
    on public.tasks for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- 4. Assessments / Exams
create table if not exists public.assessments (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    subject_id uuid not null references public.subjects(id) on delete cascade,
    title text not null,
    assessment_date timestamptz not null,
    notes text,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

create index if not exists idx_assessments_user on public.assessments(user_id);
create index if not exists idx_assessments_date on public.assessments(assessment_date);
alter table public.assessments enable row level security;

create policy "Users can manage their own assessments"
    on public.assessments for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- 5. Availability Rules
create table if not exists public.availability_rules (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    day_of_week integer not null check (day_of_week between 0 and 6),
    start_time time not null,
    end_time time not null,
    is_active boolean default true,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

create index if not exists idx_availability_user on public.availability_rules(user_id);
alter table public.availability_rules enable row level security;

create policy "Users can manage their own availability"
    on public.availability_rules for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- 6. Study Sessions
create table if not exists public.study_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    subject_id uuid references public.subjects(id) on delete set null,
    topic_id uuid references public.syllabus_topics(id) on delete set null,
    task_id uuid references public.tasks(id) on delete set null,
    assessment_id uuid references public.assessments(id) on delete set null,
    title text not null,
    start_time timestamptz not null,
    end_time timestamptz not null,
    duration_minutes integer not null check (duration_minutes > 0),
    status text default 'planned' check (status in ('planned', 'in_progress', 'completed', 'skipped')),
    session_type text default 'study' check (session_type in ('study', 'revision', 'practice')),
    priority_score double precision default 0.0,
    reasoning text,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

create index if not exists idx_sessions_user on public.study_sessions(user_id);
create index if not exists idx_sessions_start on public.study_sessions(start_time);
alter table public.study_sessions enable row level security;

create policy "Users can manage their own sessions"
    on public.study_sessions for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
