-- ==============================================================================
-- PrepAI Migration 00001: Create Profiles Table & Row Level Security
-- Subordinate to: PRD Section 6 (FR-01), Architecture Section 7 & 8
-- ==============================================================================

-- Create profiles table tied to Supabase Auth users
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text,
    avatar_url text,
    university text,
    major text,
    preferred_study_hours numeric(3, 1) default 4.0,
    daily_target_minutes integer default 240,
    session_length_minutes integer default 45,
    break_length_minutes integer default 15,
    timezone text default 'UTC',
    streak_count integer default 0,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- Index for quick lookup
create index if not exists idx_profiles_user_id on public.profiles(id);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- RLS Policies: strict user-isolation
create policy "Users can view their own profile"
    on public.profiles
    for select
    using (auth.uid() = id);

create policy "Users can insert their own profile"
    on public.profiles
    for insert
    with check (auth.uid() = id);

create policy "Users can update their own profile"
    on public.profiles
    for update
    using (auth.uid() = id)
    with check (auth.uid() = id);

-- Function and trigger to auto-create profile on signup in Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    insert into public.profiles (id, full_name, avatar_url)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        coalesce(new.raw_user_meta_data->>'avatar_url', null)
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
