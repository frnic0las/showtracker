# Mockups — Series list + add-series flow (issue #27)

Design phase for the series list page and add-series flow. Open `index.html` in a
browser at a 390px-wide viewport. Toggle your OS appearance to preview light and
dark (both driven by `prefers-color-scheme`, matching `src/app/globals.css`).

## Screens & states covered

| # | Screen | State |
| - | ------ | ----- |
| 1 | Series list | Populated — grouped by status (Watching, Watchlist, Stopped, Completed) |
| 2 | Series list | Empty (first run) |
| 3 | Series list | Error (Supabase load failed) |
| 4 | Add-series sheet | Results — `Add` / `Adding…` / `Added` |
| 5 | Add-series sheet | Loading (skeletons) |
| 6 | Add-series sheet | No results |
| 7 | Add-series sheet | Error (search failed) |

## What changes vs. current implementation

The current list (`src/app/(app)/series/page.tsx`) shows only poster + title + year in a
single flat list. This design adds the two things the issue asks for:

1. **Status grouping** — series are split into `Watching` / `Watchlist` / `Stopped` /
   `Completed` sections (iOS grouped-list style) so the user can distinguish where each
   show sits at a glance.
2. **Progress on every card** — a status badge plus a `S02 — 3/10` label and a thin
   progress bar, computed from `watched / total` episode counts.

Everything else (Sheet, SearchBar, BottomNav, add flow) keeps its existing structure —
this design refines the card and adds the missing states, it does not rebuild the plumbing.

---

## Component mapping → Tailwind

Design tokens resolve to the `bg-*`, `text-*`, `accent*`, `separator`, and `radius-*`
theme keys already defined in `globals.css` (`@theme inline`). The mockup uses plain CSS
with the same variables; the Tailwind equivalents below are what the React components
should use.

### Page header — `src/app/(app)/series/page.tsx`

Already implemented, keep as-is:

```
<header class="flex items-center justify-between pb-2 px-4 pt-3">
  <h1 class="text-[34px] font-bold text-text-primary">Series</h1>
  <SeriesSearch … />   // 44×44 "+" button, text-accent
</header>
```

### Status section header (new) — iOS grouped-list label

```
<h2 class="px-4 pt-4 pb-2 text-[13px] uppercase tracking-wide text-text-secondary">
  Watching
</h2>
```

Render a section only when it has ≥1 series. Suggested order: Watching → Watchlist →
Stopped → Completed.

### Grouped card container — `src/components/series/` (new `SeriesCard` + list)

```
<ul class="mx-4 overflow-hidden rounded-md bg-bg-elevated
           divide-y divide-separator">
  … SeriesCard items …
</ul>
```

`divide-y divide-separator` reproduces the inset separators (Tailwind's `divide` inset is
adjusted with `[&>li+li]:before` in the mockup; `divide-y` on the `ul` is the simpler
equivalent and acceptable — keep the left inset by padding the poster column).

### Series card (new) — `src/components/series/SeriesCard.tsx`

Poster + body + chevron, wrapped in a `next/link` to `/series/[id]`:

```
<Link href={`/series/${tmdbId}`}
      class="relative flex items-center gap-3 p-3">

  {/* poster — next/image w185, 60×90, 2:3 */}
  <Image src={posterUrl(poster, 'w185')} width={60} height={90}
         class="shrink-0 rounded-sm object-cover" alt="" />
  {/* fallback when no poster: */}
  <div class="h-[90px] w-[60px] shrink-0 rounded-sm bg-bg-secondary" />

  <div class="min-w-0 flex-1">
    <p class="truncate text-[17px] font-semibold text-text-primary">{title}</p>

    <div class="mt-1.5 flex items-center gap-2">
      <StatusBadge status={status} />
    </div>

    {/* progress — omit the bar for watchlist (not started) */}
    <p class="mt-2 text-[13px] text-text-secondary">S02 — 3/10</p>
    <div class="mt-1.5 h-1 overflow-hidden rounded-full bg-bg-secondary">
      <div class="h-full rounded-full bg-accent-orange" style="width:30%" />
    </div>
  </div>

  <ChevronIcon class="shrink-0 text-text-tertiary" />
</Link>
```

Touch target: the whole row is tappable and ≥44px tall (poster is 90px), satisfying HIG.

### Status badge (new) — `src/components/series/StatusBadge.tsx`

| Status | Label | Text | Tint background |
| ------ | ----- | ---- | --------------- |
| `watching` | Watching | `text-accent-orange` | `bg-accent-orange/10` |
| `watchlist` | Watchlist | `text-accent` | `bg-accent/10` |
| `stopped` | Stopped | `text-text-secondary` (see note) | `bg-text-secondary/15` |
| `completed` | Completed | `text-accent-green` | `bg-accent-green/10` |

> **Deliberate deviation — `stopped` label color.** `DESIGN_SYSTEM.md`'s Status Badges
> table lists `stopped → text-tertiary`. `text-tertiary` is 30%-opacity gray, which fails
> WCAG contrast as 12px badge text, so this design uses `text-text-secondary` instead. The
> progress-bar fill for stopped still uses tertiary (`bg-text-tertiary`), which is fine at
> 4px. **Action for implementation:** update the spec's badge table to `text-secondary`,
> or explicitly accept this override — spec and design currently disagree here.

```
<span class="inline-flex items-center rounded-sm px-2 py-1
             text-[12px] font-semibold leading-none
             text-accent-orange bg-accent-orange/10">
  Watching
</span>
```

### Progress bar fill color by status

| Status | Fill | Label form |
| ------ | ---- | ---------- |
| `watching` | `bg-accent-orange` | `S02 — 3/10` |
| `stopped` | `bg-text-tertiary` (muted) | `S05 — 42/177` |
| `completed` | `bg-accent-green`, width 100% | `62/62 episodes` |
| `watchlist` | *no bar* | `Not started · 10 episodes` |

### Empty state — replaces the current inline empty block

```
<div class="flex min-h-[420px] flex-col items-center justify-center gap-3
            px-10 text-center">
  <SeriesIcon class="h-12 w-12 text-text-tertiary" />
  <p class="text-[17px] font-semibold text-text-primary">No series yet</p>
  <p class="max-w-[260px] text-[15px] text-text-secondary">
    Search TMDB to add the shows you're watching and track every episode.
  </p>
  <button class="mt-3 flex min-h-11 items-center justify-center rounded-md
                 bg-accent px-6 text-[17px] font-semibold text-white">
    Search for a series
  </button>
</div>
```

The CTA opens the same add-series sheet as the header "+" button.

### Error state — replaces the current inline error paragraph

Same layout as the empty state, warning-triangle icon, title "Couldn't load your series",
`Try again` CTA. (`page.tsx` currently renders a plain centered paragraph on `error` —
upgrade it to this icon + message + retry pattern.)

### Add-series sheet — `Sheet` + `SeriesSearchSheet` (existing)

The sheet chrome (grabber, title, backdrop) already matches the design system. The result
rows and states below map to the existing `SeriesSearchSheet` markup:

**Result row** (`Add` / `Adding…` / `Added`) — already implemented; classes confirmed:

```
<button class="flex w-full items-center gap-3 px-4 py-2 text-left">
  <Image … 60×90 rounded-sm />
  <div class="min-w-0 flex-1">
    <p class="truncate text-[17px] font-semibold text-text-primary">{title}</p>
    <p class="text-[13px] text-text-secondary">{year}</p>
  </div>
  <span class="shrink-0 text-[15px] font-semibold
               {added ? 'text-accent-green'      // Added
              : pending ? 'text-text-secondary'  // Adding…
              : 'text-accent'}">                 // Add
    {label}
  </span>
</button>
```

> **Change from the shipped component.** `SeriesSearchSheet.tsx` currently colors the
> pending `Adding…` label `text-accent` (blue). This design mutes it to
> `text-text-secondary` so only the terminal `Added` (green) and actionable `Add` (blue)
> read as states. Implementation should update the pending branch accordingly.

**Loading** — the current sheet shows a centered "Searching…" line. This design upgrades it
to 3 skeleton rows (poster block + two shimmering lines) so the layout doesn't jump when
results land:

```
<div class="flex items-center gap-3 p-3">
  <div class="h-[90px] w-[60px] shrink-0 animate-pulse rounded-sm bg-bg-secondary" />
  <div class="flex-1 space-y-2">
    <div class="h-3 w-3/5 animate-pulse rounded bg-bg-secondary" />
    <div class="h-3 w-1/3 animate-pulse rounded bg-bg-secondary" />
  </div>
</div>
```

(`animate-pulse` is the Tailwind equivalent of the mockup's custom shimmer.)

**No results** — centered search icon + "No series found" + "Try a different title or
spelling." (upgrades the current plain "No series found." line).

**Error** — centered warning icon + "Couldn't search right now" + retry hint. The
per-item **add** error stays as the existing inline red line under the search bar
(`text-[13px] text-accent-red`).

### Bottom navigation — `src/components/ui/BottomNav.tsx` (existing, no change)

Confirmed against the design: 4 tabs, 49px bar + safe-area, 24×24 icons over 10px labels,
active tab `text-accent`, inactive `text-text-secondary`, top `border-separator`,
`bg-bg-primary/80 backdrop-blur-[20px]`. The mockup renders the Series tab active.

---

## Interaction notes

- **Tap a card** → push-navigate to `/series/[tmdbId]` (horizontal slide per Motion spec).
- **Tap "+" (or the empty-state CTA)** → `Sheet` slides up (300ms spring), `SearchBar`
  autofocuses.
- **Search** debounces 300ms (`SearchBar` default) before hitting `/api/tmdb/search`;
  in-flight requests abort on the next keystroke (already handled in `SeriesSearchSheet`).
- **Tap "Add"** → optimistic `Adding…`, then `Added` (green, non-interactive) on success;
  on failure the inline red error appears and the row returns to `Add`. Already-tracked
  results render as `Added` immediately (dedup via `trackedIds`).
- **Dismiss sheet** → backdrop tap, Escape, or swipe-down on the grabber; the list behind
  refreshes (`router.refresh()`) so a newly added series appears in its status group.
- **Status is computed, not stored** — a finished series with all episodes watched is
  `completed`; grouping/badges derive from the same `watched / total` data the cards show.

## Notes / open questions for implementation

- Status computation (`watching` vs `stopped` vs `completed`) needs episode-level data that
  isn't in the current `user_series` + `series_cache` queries — the list page will need an
  episode-progress source (aggregate watched/total per series). Flagging as a backend
  dependency; not part of this design deliverable.
- Poster thumbnails: design system says `w185` for list thumbnails — current code passes
  `w154`. Minor; recommend `w185` for the 60px @2–3x displays.
