# Mockups — Series archive (issue #67)

Builds the `/series/archive` page — the destination for the **“Stopped & completed”** link at the
bottom of the Series → To Watch tab (`src/components/series/ToWatchView.tsx`). The link already
exists and currently 404s; this design defines the page it should open.

Open `index.html` at a **390px-wide viewport** and toggle your OS appearance to preview light and
dark (both driven by `prefers-color-scheme`, matching `src/app/globals.css`). Reuses the To Watch
poster grid (`docs/mockups/series-tab/`) so the archive reads as part of the same Series surface.

## Design intent

The issue asks for a **lightweight archive — not a primary surface**. Three decisions follow:

1. **Push-navigation sub-page, not a tab.** Reached by tapping a link, so it opens with a standard
   iOS nav bar: a `‹ Series` back button top-left and an inline `Archive` title. No large title,
   no search field in the header — those belong to primary surfaces. The bottom tab bar stays
   (Series active), matching the app shell.
2. **Two grouped sections instead of a filter.** `Completed` then `Stopped`, each with a count.
   Grouping is more legible than a segmented control for a low-traffic page and needs no client
   state. A section is **rendered only when it has ≥1 series** (frame 2). If both are empty, the
   whole page falls back to a single empty state (frame 3).
3. **No search.** An archive is browsed, not queried; a 3-up poster grid scans fine at this scale.
   If a user accumulates hundreds of completed shows we can revisit, but nothing speculative now.

Completed leads because it’s the rewarding half (a “finished” shelf); Stopped follows as the
set-aside pile. Stopped posters are **dimmed to `opacity: 0.62`** to read as inactive, and carry a
muted “Stopped at S# E#” subcaption (where the user left off). Completed posters get a **green
check badge** (top-right, mirroring the accent unwatched-count badge) plus a green “Completed”
subcaption — the `accent-green` = completed convention from DESIGN_SYSTEM.md “Status Badges”.

## Screens covered

| # | Screen | State |
| - | ------ | ----- |
| 1 | Archive — populated | Completed group (green check) + Stopped group (muted) |
| 2 | Archive — one group | Only Stopped has entries; Completed section omitted |
| 3 | Archive — empty | Neither stopped nor completed; centered empty state |

Every poster taps through to the existing series detail page (`/series/[id]`), where Resume /
Remove already live (issue #66) — so the archive needs no per-card actions of its own.

---

## Data rules

Both groups come from `getUserSeriesWithProgress(userId)` (`src/lib/series/queries.ts`), which
returns `SeriesWithProgress[]` with `status`, `unwatchedCount`, `totalEpisodes`, and `nextEpisode`.
The archive page filters that one result — no new query is strictly required for stopped, but
**completed needs the show’s TMDB status** (`Ended` / `Canceled`), which the current RPC row does
not expose:

- **Stopped** = `status === 'stopped'`. Subcaption “Stopped at S{nextEpisode.season} E{episode}”
  when `nextEpisode` is present, else “Stopped”.
- **Completed** = `status === 'watching'` **and** `unwatchedCount === 0` **and** the series’ TMDB
  `status` is `Ended` or `Canceled` (a fully-watched *returning* show is “caught up”, not
  completed — see the ADR referenced in the issue). The `get_user_series_with_progress` RPC
  (migration 002) must **add the cached `series_cache.status` column** to its returned row so this
  is computable without an extra round-trip. Flag this for the backend follow-up — it’s the one
  backend change this page depends on.

> Ordering within each group: reuse the RPC’s existing order (or sort by title). Not prescriptive.

## Component mapping → Tailwind

Tokens resolve to the `bg-*`, `text-*`, `accent*`, `separator`, and `radius-*` theme keys in
`globals.css` (`@theme inline`). The mockup uses plain CSS with the same variables.

> **Radius classes.** `globals.css` overrides the radius scale, so `rounded-sm` = **8px**,
> `rounded-md` = **12px**, `rounded-lg` = **16px**. `rounded-full` is the pill.

### Page — new `src/app/(app)/series/[archive]/page.tsx` → route `src/app/(app)/series/archive/page.tsx`

Server Component. Loads the user, calls `getUserSeriesWithProgress`, partitions into
`completed` / `stopped`, and renders the nav bar + one `ArchiveSection` per non-empty group, or
the empty state. Auth-guard mirrors `src/app/(app)/series/page.tsx`.

### Nav bar — new (or shared) sub-page header

```
Bar:    relative flex h-11 items-center justify-center border-b border-separator
          bg-bg-primary/80 backdrop-blur-xl
Title:  text-[17px] font-semibold text-text-primary        ("Archive")
Back:   absolute left-2 inline-flex h-11 items-center gap-0.5 px-2 text-[17px] text-accent
          → Link href="/series"   (chevron 12×20, stroke 2.4)
```

A plain `<Link href="/series">` back is fine — this page is always entered from `/series`.

### Section header — matches the To Watch heading

```
Wrap:   flex items-baseline gap-2 px-4 pt-5 pb-2
Title:  text-[20px] font-semibold tracking-tight text-text-primary
Count:  text-[15px] font-semibold text-text-secondary tabular-nums     ("· 5")
```

### Poster grid — reuse `src/components/series/PosterGrid.tsx`

The existing grid shell is identical (`grid grid-cols-3 gap-x-3 gap-y-4 px-4`). Extend
`PosterGrid` with `'completed' | 'stopped'` variants, or add a thin `ArchiveGrid` wrapper that
maps each series to `SeriesPosterCard`. Per-variant card content:

**Completed** — `SeriesPosterCard` with a green check badge instead of the numeric badge:

```
Badge:  absolute right-1.5 top-1.5 flex h-[22px] w-[22px] items-center justify-center
          rounded-full bg-accent-green text-white shadow   (check glyph 13×13, stroke 3.2)
Sub:    inline-flex items-center gap-0.5 text-xs font-semibold text-accent-green   ("✓ Completed")
```

`SeriesPosterCard` currently takes a numeric `badge`. Add a small `variant`/`checkBadge` prop (or
a `badgeSlot`) so it can render the green check — keep the change minimal and additive.

**Stopped** — dimmed poster, muted subcaption, no badge:

```
Card:   add opacity-[.62] to the poster wrapper (`.aspect-[2/3]` block) only
Sub:    truncate text-xs text-text-secondary        ("Stopped at S3 E2")
```

### Empty state — reuse `src/components/ui/CenteredState.tsx`

```
Icon:    archive box, 48×48, text-tertiary (muted)
Title:   "Nothing archived yet"        (headline / text-[17px] font-semibold)
Desc:    "Series you finish or stop watching will collect here."
```

No CTA button — this is a dead-end secondary page; the user reaches it deliberately and backs out
via the nav bar. (DESIGN_SYSTEM.md allows the CTA to be omitted when none applies.)

## Notes for implementation

- **One backend dependency:** the completed check needs `series_cache.status` on the RPC row (see
  Data rules). Everything else is presentation over the existing `getUserSeriesWithProgress`.
- Keep the page a Server Component — no client interactivity beyond `Link` navigation.
- Handle the load error the same way the Series page does (the query throws on failure).
- No new statuses. `completed` stays computed, never stored — consistent with issues #65 / #66.
