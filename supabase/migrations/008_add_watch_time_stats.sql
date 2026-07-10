-- 008_add_watch_time_stats.sql
--
-- The Profile page's watch-time stats (issue #111) need the total minutes the
-- user has spent watching series episodes and movies. Summing `runtime` over
-- `user_episodes` / `user_movies` joined against the cache tables client-side
-- would require fetching every watched row — the same PostgREST 1000-row cap
-- problem that motivated get_user_series_with_progress (migration 002) — so
-- the aggregation runs server-side instead.

drop function if exists get_watch_time_stats(uuid);

create function get_watch_time_stats(p_user_id uuid)
returns table (
  series_minutes integer,
  movies_minutes integer
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    (
      select coalesce(sum(ec.runtime), 0)::integer
      from user_episodes ue
      join episodes_cache ec
        on ue.tmdb_series_id = ec.tmdb_series_id
        and ue.season_number = ec.season_number
        and ue.episode_number = ec.episode_number
      where ue.user_id = p_user_id
    ) as series_minutes,
    (
      select coalesce(sum(mc.runtime), 0)::integer
      from user_movies um
      join movies_cache mc on um.tmdb_id = mc.tmdb_id
      where um.user_id = p_user_id
        and um.watched = true
    ) as movies_minutes;
$$;
