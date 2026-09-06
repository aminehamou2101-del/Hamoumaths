-- =========================================================
-- HAMOU MATH GLOBAL DATABASE V1
-- PART 1 : USERS + SECURITY
-- =========================================================

create extension if not exists pgcrypto;


-- =========================
-- PROFILES
-- =========================

create table if not exists public.profiles (

id uuid primary key references auth.users(id)
on delete cascade,

email text unique,

full_name text,

avatar_url text,

role text not null default 'student'
check(role in(
'student',
'teacher',
'researcher',
'admin',
'owner'
)),

xp integer default 0,

level integer default 1,

created_at timestamptz default now(),

updated_at timestamptz default now()

);



-- =========================
-- USER PROGRESS
-- =========================

create table if not exists public.user_progress (

user_id uuid primary key references auth.users(id)
on delete cascade,

xp integer default 0,

level integer default 1,

games_played integer default 0,

challenges_completed integer default 0,

updated_at timestamptz default now()

);



-- =========================
-- SECURITY FUNCTIONS
-- =========================


create or replace function public.is_owner()

returns boolean

language sql

security definer

as $$

select exists(

select 1

from public.profiles

where id=auth.uid()

and role='owner'

);

$$;



create or replace function public.is_admin()

returns boolean

language sql

security definer

as $$

select exists(

select 1

from public.profiles

where id=auth.uid()

and role in('admin','owner')

);

$$;



create or replace function public.is_teacher()

returns boolean

language sql

security definer

as $$

select exists(

select 1

from public.profiles

where id=auth.uid()

and role in(
'teacher',
'admin',
'owner'
)

);

$$;



-- =========================
-- NEW USER TRIGGER
-- =========================


create or replace function public.handle_new_user()

returns trigger

language plpgsql

security definer

as $$

begin


insert into public.profiles
(
id,
email,
full_name
)

values
(
new.id,
new.email,
coalesce(
new.raw_user_meta_data->>'full_name',
''
)

)

on conflict(id)
do nothing;



insert into public.user_progress
(
user_id
)

values
(
new.id
)

on conflict(user_id)
do nothing;


return new;


end;

$$;



drop trigger if exists on_auth_user_created
on auth.users;


create trigger on_auth_user_created

after insert on auth.users

for each row

execute procedure public.handle_new_user();



-- =========================
-- ENABLE RLS
-- =========================

alter table public.profiles enable row level security;

alter table public.user_progress enable row level security;



-- =========================
-- PROFILE POLICIES
-- =========================


create policy "read own profile"

on public.profiles

for select

using(
auth.uid()=id
);



create policy "update own profile"

on public.profiles

for update

using(
auth.uid()=id
);



create policy "owner manage profiles"

on public.profiles

for all

using(
public.is_owner()
);



-- =========================
-- PROGRESS POLICIES
-- =========================


create policy "read progress"

on public.user_progress

for select

using(
auth.uid()=user_id
);



create policy "insert progress"

on public.user_progress

for insert

with check(
auth.uid()=user_id
);



create policy "update progress"

on public.user_progress

for update

using(
auth.uid()=user_id
);
