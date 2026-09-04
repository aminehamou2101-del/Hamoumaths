-- =========================================================
-- HAMOU MATH GLOBAL
-- Supabase database schema
-- =========================================================

create extension if not exists pgcrypto;

-- =========================================================
-- PROFILES
-- =========================================================

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text unique,
    full_name text,
    avatar_url text,
    role text not null default 'student'
        check (role in ('student','teacher','researcher','admin','owner')),
    xp integer not null default 0,
    level integer not null default 1,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- =========================================================
-- USER PROGRESS
-- =========================================================

create table if not exists public.user_progress (
    user_id uuid primary key references auth.users(id) on delete cascade,
    xp integer not null default 0,
    level integer not null default 1,
    games_played integer not null default 0,
    challenges_completed integer not null default 0,
    updated_at timestamptz not null default now()
);

-- =========================================================
-- FAVORITES
-- =========================================================

create table if not exists public.favorites (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    resource_id text not null,
    created_at timestamptz not null default now(),
    unique(user_id, resource_id)
);

-- =========================================================
-- RESOURCE VIEWS
-- =========================================================

create table if not exists public.resource_views (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete set null,
    resource_id text not null,
    created_at timestamptz not null default now()
);

-- =========================================================
-- RLS
-- =========================================================

alter table public.profiles enable row level security;
alter table public.user_progress enable row level security;
alter table public.favorites enable row level security;
alter table public.resource_views enable row level security;

-- =========================================================
-- PROFILES POLICIES
-- =========================================================

drop policy if exists "profiles_select_own" on public.profiles;

create policy "profiles_select_own"
on public.profiles
for select
using (
    auth.uid() = id
);

drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_update_own"
on public.profiles
for update
using (
    auth.uid() = id
)
with check (
    auth.uid() = id
);

-- =========================================================
-- PROGRESS POLICIES
-- =========================================================

drop policy if exists "progress_select_own"
on public.user_progress;

create policy "progress_select_own"
on public.user_progress
for select
using (
    auth.uid() = user_id
);

drop policy if exists "progress_insert_own"
on public.user_progress;

create policy "progress_insert_own"
on public.user_progress
for insert
with check (
    auth.uid() = user_id
);

drop policy if exists "progress_update_own"
on public.user_progress;

create policy "progress_update_own"
on public.user_progress
for update
using (
    auth.uid() = user_id
)
with check (
    auth.uid() = user_id
);

-- =========================================================
-- FAVORITES POLICIES
-- =========================================================

drop policy if exists "favorites_select_own"
on public.favorites;

create policy "favorites_select_own"
on public.favorites
for select
using (
    auth.uid() = user_id
);

drop policy if exists "favorites_insert_own"
on public.favorites;

create policy "favorites_insert_own"
on public.favorites
for insert
with check (
    auth.uid() = user_id
);

drop policy if exists "favorites_delete_own"
on public.favorites;

create policy "favorites_delete_own"
on public.favorites
for delete
using (
    auth.uid() = user_id
);

-- =========================================================
-- RESOURCE VIEWS
-- =========================================================

drop policy if exists "resource_views_insert"
on public.resource_views;

create policy "resource_views_insert"
on public.resource_views
for insert
with check (
    auth.uid() = user_id
    or user_id is null
);

-- =========================================================
-- NEW USER TRIGGER
-- =========================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

    insert into public.profiles (
        id,
        email,
        full_name
    )
    values (
        new.id,
        new.email,
        coalesce(
            new.raw_user_meta_data ->> 'full_name',
            ''
        )
    )
    on conflict (id) do nothing;

    insert into public.user_progress (
        user_id
    )
    values (
        new.id
    )
    on conflict (user_id) do nothing;

    return new;

end;
$$;

drop trigger if exists on_auth_user_created
on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

-- =========================================================
-- UPDATED_AT
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists profiles_updated_at
on public.profiles;

create trigger profiles_updated_at
before update on public.profiles
for each row
execute procedure public.set_updated_at();

drop trigger if exists progress_updated_at
on public.user_progress;

create trigger progress_updated_at
before update on public.user_progress
for each row
execute procedure public.set_updated_at();
