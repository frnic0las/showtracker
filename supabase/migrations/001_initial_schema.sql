-- 001_initial_schema.sql

-- Enable RLS on all tables
-- User tables
create table user_series (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tmdb_id integer not null,
  status text not null default 'watching' check (status in ('watching', 'stopped', 'watchlist')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, tmdb_id)
);
alter table user_series enable row level security;

create table user_episodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tmdb_series_id integer not null,
  season_number smallint not null,
  episode_number smallint not null,
  watched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, tmdb_series_id, season_number, episode_number)
);
alter table user_episodes enable row level security;

create table user_movies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tmdb_id integer not null,
  watched boolean not null default false,
  watched_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, tmdb_id)
);
alter table user_movies enable row level security;

-- Cache tables
create table series_cache (
  tmdb_id integer primary key,
  title text not null,
  overview text,
  poster_path text,
  backdrop_path text,
  status text,
  total_seasons smallint,
  first_air_date date,
  last_fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table series_cache enable row level security;

create table episodes_cache (
  id bigint generated always as identity primary key,
  tmdb_series_id integer not null references series_cache(tmdb_id) on delete cascade,
  season_number smallint not null,
  episode_number smallint not null,
  name text,
  overview text,
  air_date date,
  still_path text,
  runtime smallint,
  last_fetched_at timestamptz not null default now(),
  unique (tmdb_series_id, season_number, episode_number)
);
alter table episodes_cache enable row level security;

create table movies_cache (
  tmdb_id integer primary key,
  title text not null,
  overview text,
  poster_path text,
  backdrop_path text,
  release_date date,
  runtime smallint,
  last_fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table movies_cache enable row level security;

-- Import mapping table
create table tvdb_tmdb_mapping (
  tvdb_id integer primary key,
  tmdb_id integer,
  media_type text not null check (media_type in ('tv', 'movie')),
  title text
);

-- Indexes
create index idx_user_series_user on user_series(user_id);
create index idx_user_series_tmdb on user_series(tmdb_id);
create index idx_user_episodes_user_series on user_episodes(user_id, tmdb_series_id);
create index idx_user_movies_user on user_movies(user_id);
create index idx_episodes_cache_series on episodes_cache(tmdb_series_id);
create index idx_episodes_cache_air_date on episodes_cache(air_date) where air_date is not null;

-- RLS Policies

-- user_series: users see and modify only their own rows
create policy "users_own_series_select" on user_series for select using (auth.uid() = user_id);
create policy "users_own_series_insert" on user_series for insert with check (auth.uid() = user_id);
create policy "users_own_series_update" on user_series for update using (auth.uid() = user_id);
create policy "users_own_series_delete" on user_series for delete using (auth.uid() = user_id);

-- user_episodes: users see and modify only their own rows
create policy "users_own_episodes_select" on user_episodes for select using (auth.uid() = user_id);
create policy "users_own_episodes_insert" on user_episodes for insert with check (auth.uid() = user_id);
create policy "users_own_episodes_update" on user_episodes for update using (auth.uid() = user_id);
create policy "users_own_episodes_delete" on user_episodes for delete using (auth.uid() = user_id);

-- user_movies: users see and modify only their own rows
create policy "users_own_movies_select" on user_movies for select using (auth.uid() = user_id);
create policy "users_own_movies_insert" on user_movies for insert with check (auth.uid() = user_id);
create policy "users_own_movies_update" on user_movies for update using (auth.uid() = user_id);
create policy "users_own_movies_delete" on user_movies for delete using (auth.uid() = user_id);

-- Cache tables: all authenticated users can read, only service role can write
create policy "cache_series_select" on series_cache for select to authenticated using (true);
create policy "cache_episodes_select" on episodes_cache for select to authenticated using (true);
create policy "cache_movies_select" on movies_cache for select to authenticated using (true);

-- updated_at trigger function
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on user_series
  for each row execute function update_updated_at();
