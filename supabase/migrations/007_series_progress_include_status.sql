-- 007_series_progress_include_status.sql
--
-- The /series/archive page (issue #72) separates "completed" series — a fully
-- watched show that has Ended or been Canceled — from ones the user has merely
-- caught up on (a Returning Series with no aired-unwatched episodes). That
-- distinction needs the series' cached TMDB lifecycle status, which
-- get_user_series_with_progress did not return.
--
-- Expose series_cache.status as series_status (the row already has a `status`
-- column for the user's tracking state, so the TMDB status needs its own name)
-- so the archive can compute "completed" from the single RPC result without a
-- second round-trip. Everything else is unchanged from migration 006.

drop function if exists get_user_series_with_progress(uuid);

create or replace function get_user_series_with_progress(p_user_id uuid)
returns table (
  tmdb_id integer,
  status text,
  series_status text,
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
      and (ec.air_date is null or ec.air_date <= current_date)
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
    sc.status as series_status,
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
