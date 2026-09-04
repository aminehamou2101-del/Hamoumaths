create extension if not exists pgcrypto;

create table if not exists profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text,
    full_name text,
    role text not null default 'user'
        check (role in ('user','premium','admin','owner')),
    plan text not null default 'free',
    created_at timestamptz not null default now()
);

create table if not exists resources (
    id uuid primary key default gen_random_uuid(),

    title text not null,

    description text,

    content text,

    resource_type text,

    language text,

    level text,

    subject text,

    author text,

    year integer,

    file_url text,

    cover_url text,

    is_public boolean not null default true,

    is_premium boolean not null default false,

    search_vector tsvector generated always as (
        to_tsvector(
            'simple',
            coalesce(title,'') || ' ' ||
            coalesce(description,'') || ' ' ||
            coalesce(content,'') || ' ' ||
            coalesce(subject,'') || ' ' ||
            coalesce(author,'')
        )
    ) stored,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);

create index if not exists resources_search_idx
on resources
using gin(search_vector);

create index if not exists resources_language_idx
on resources(language);

create index if not exists resources_type_idx
on resources(resource_type);

create index if not exists resources_level_idx
on resources(level);

create index if not exists resources_created_idx
on resources(created_at desc);


create table if not exists prices (

    id uuid primary key default gen_random_uuid(),

    product_code text not null,

    currency text not null,

    amount numeric(14,2) not null,

    active boolean not null default true,

    created_at timestamptz not null default now()

);


create table if not exists payments (

    id uuid primary key default gen_random_uuid(),

    user_id uuid references auth.users(id),

    product_code text not null,

    currency text not null,

    amount numeric(14,2) not null,

    exchange_rate_to_dzd numeric(18,8),

    amount_dzd numeric(18,2),

    fee numeric(18,2) default 0,

    net_dzd numeric(18,2),

    gateway text,

    transaction_id text,

    status text not null default 'pending',

    created_at timestamptz not null default now()

);


create table if not exists subscriptions (

    id uuid primary key default gen_random_uuid(),

    user_id uuid references auth.users(id) on delete cascade,

    plan text not null,

    status text not null default 'pending',

    gateway text,

    gateway_subscription_id text,

    starts_at timestamptz,

    ends_at timestamptz,

    created_at timestamptz not null default now()

);


create table if not exists ai_usage (

    id uuid primary key default gen_random_uuid(),

    user_id uuid references auth.users(id) on delete cascade,

    request_type text,

    tokens integer default 0,

    created_at timestamptz not null default now()
);


create table if not exists favorites (

    id uuid primary key default gen_random_uuid(),

    user_id uuid references auth.users(id) on delete cascade,

    resource_id uuid references resources(id) on delete cascade,

    created_at timestamptz not null default now(),

    unique(user_id,resource_id)
);


create table if not exists challenge_results (

    id uuid primary key default gen_random_uuid(),

    user_id uuid references auth.users(id) on delete cascade,

    challenge_type text,

    score integer default 0,

    xp integer default 0,

    created_at timestamptz not null default now()
);


create or replace function is_owner()
returns boolean
language sql
security definer
stable
as $$

    select exists(

        select 1

        from auth.users

        where id = auth.uid()

        and lower(email) =
            lower('aminehamou2101@gmail.com')

    );

$$;


alter table profiles enable row level security;
alter table resources enable row level security;
alter table prices enable row level security;
alter table payments enable row level security;
alter table subscriptions enable row level security;
alter table ai_usage enable row level security;
alter table favorites enable row level security;
alter table challenge_results enable row level security;


create policy "public resources readable"
on resources
for select
using (
    is_public = true
);


create policy "owner manages resources"
on resources
for all
using (
    is_owner()
)
with check (
    is_owner()
);


create policy "owner manages prices"
on prices
for all
using (
    is_owner()
)
with check (
    is_owner()
);


create policy "users read own favorites"
on favorites
for select
using (
    auth.uid() = user_id
    or is_owner()
);


create policy "users manage own favorites"
on favorites
for all
using (
    auth.uid() = user_id
    or is_owner()
)
with check (
    auth.uid() = user_id
    or is_owner()
);


create policy "owner sees payments"
on payments
for select
using (
    is_owner()
);


create policy "owner sees subscriptions"
on subscriptions
for select
using (
    is_owner()
);


create policy "users see own subscription"
on subscriptions
for select
using (
    auth.uid() = user_id
    or is_owner()
);
