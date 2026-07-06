-- 005_drop_catchup_episodes_function.sql
--
-- The Calendar tab (and its "Catch up" section) was removed in issue #50. Drop
-- the now-unused RPC so deployed databases don't retain a dead function. Fresh
-- databases never create it, so `if exists` keeps this migration idempotent.

drop function if exists get_user_catchup_episodes(uuid);
