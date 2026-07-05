-- 002_series_progress_function.sql
--
-- Aggregation RPC for the "To Watch" series grid. Computing per-series watch
-- progress in the app would require transferring every episode and every
-- watched row (tens of thousands after a TV Time import) and, worse, PostgREST
-- caps result sets at 1000 rows by default — silently truncating the joins and
-- producing wrong counts. Pushing the join + aggregation into the database
-- returns exactly one row per tracked series instead.
--
-- SECURITY INVOKER (the default) keeps Row Level Security in force: the
-- user_series / user_episodes reads are still scoped to auth.uid(), so a caller
-- can only ever see their own progress. Season 0 (specials) is excluded.

create or replace function get_user_series_with_progress(p_user_id uuid)
returns table (
  tmdb_id integer,
  status text,
  title text,
  poster_path text,
  total_episodes bigint,
  unwatched_count bigint,
  next_season_number smallint,
  next_episode_number smallint,
  next_name text
)
language sql
stable
security invoker
set search_path = public
as $$
  with tracked as (
    select us.tmdb_id, us.status
    from user_series us
    where us.user_id = p_user_id
  ),
  ep as (
    select
      ec.tmdb_series_id,
      ec.season_number,
      ec.episode_number,
      ec.name,
      (ue.id is not null) as watched
    from episodes_cache ec
    join tracked t on t.tmdb_id = ec.tmdb_series_id
    left join user_episodes ue
      on ue.user_id = p_user_id
      and ue.tmdb_series_id = ec.tmdb_series_id
      and ue.season_number = ec.season_number
      and ue.episode_number = ec.episode_number
    where ec.season_number > 0
  ),
  agg as (
    select
      tmdb_series_id,
      count(*) as total_episodes,
      count(*) filter (where not watched) as unwatched_count
    from ep
    group by tmdb_series_id
  ),
  next_ep as (
    select distinct on (tmdb_series_id)
      tmdb_series_id, season_number, episode_number, name
    from ep
    where not watched
    order by tmdb_series_id, season_number, episode_number
  )
  select
    t.tmdb_id,
    t.status,
    sc.title,
    sc.poster_path,
    coalesce(a.total_episodes, 0) as total_episodes,
    coalesce(a.unwatched_count, 0) as unwatched_count,
    n.season_number as next_season_number,
    n.episode_number as next_episode_number,
    n.name as next_name
  from tracked t
  join series_cache sc on sc.tmdb_id = t.tmdb_id
  left join agg a on a.tmdb_series_id = t.tmdb_id
  left join next_ep n on n.tmdb_series_id = t.tmdb_id
  order by sc.title asc;
$$;
