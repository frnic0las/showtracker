# Mockups — Movies list sort options (issue #82)

Adds a **sort control** to the movies poster grids so the order is no longer hardcoded to
"most recently added". The control is a **pull-down menu** (iOS UIMenu) anchored to a trailing
button in the **section header**, present on both movie surfaces: the Watchlist grid
(`src/components/movies/MoviesList.tsx`) and the Watched archive
(`src/app/(app)/movies/archive/page.tsx`).

Open `index.html` at a **390px-wide viewport** and toggle your OS appearance to preview light and
dark (both driven by `prefers-color-scheme`, matching `src/app/globals.css`). Builds on the Movies
tab (issue #73) and its long-press action sheet (issue #80).

## The interaction

**The problem.** `getUserMovies` sorts each section newest-first and the grids render that order
with no affordance to change it. Users want alphabetical / oldest / by-release orderings. The
control has to sit somewhere that (a) reads as iOS-native, (b) doesn't collide with the existing
chrome — the large title + `+` button up top, the one-tap checkmark and long-press sheet on every
poster (issue #80) — and (c) works identically on the Watchlist page and the archive sub-page.

**Placement — trailing control in the section header.** Both surfaces already own a
`Watchlist · N` / `Watched · N` section header. The sort trigger sits at the **right end of that
row** (`justify-content: space-between`). This scopes the sort visually to the section it labels,
is consistent across both surfaces, and leaves the top chrome untouched. The trigger is a plain
accent-colored button showing the **active** sort's label plus the stacked up/down chevron
(`chevron.up.chevron.down`) — the canonical iOS pull-down indicator — so the current order is
always legible without opening anything.

**Menu — iOS pull-down (UIMenu).** Tapping the trigger opens a translucent, rounded menu anchored
just under it, right-aligned. It's a single flat list of the four orderings; the **active option
carries a trailing checkmark** (accent) and bolded label — exactly one is always checked
(`role="menuitemradio"`). The source button dims to 50% while its menu is open (iOS behavior). A
faint full-bleed scrim catches an outside tap to dismiss. Choosing an option applies immediately,
closes the menu, re-sorts the grid, and updates the trigger label.

**Section-aware labels.** The first two options name the section's own timeline, which differs by
section because the query sorts the Watchlist by `created_at` and the Watched list by `watched_at`:

| Section   | Sort options (top → bottom)                                        | Default          |
| --------- | ------------------------------------------------------------------ | ---------------- |
| Watchlist | **Recently added** · Oldest added · Title (A–Z) · Release year      | Recently added   |
| Watched   | **Recently watched** · Oldest watched · Title (A–Z) · Release year  | Recently watched |

"Release year" orders newest release first. Defaults preserve today's behavior, so the control is
purely additive. The control is only rendered when a section has **more than one** movie (nothing
to sort otherwise).

## Screens covered

| # | Screen | State |
| - | ------ | ----- |
| 1 | Movies tab — Watchlist grid | Rest; trigger shows "Recently added" |
| 2 | Watchlist — sort menu open | Four options, "Recently added" checked, source dimmed |
| 3 | Watchlist — result | Grid re-sorted A–Z, trigger label now "Title (A–Z)" |
| 4 | Watched archive — menu open | Same control; labels adapt to "Recently/Oldest watched" |

---

## Component mapping → Tailwind

Tokens resolve to the `bg-*`, `text-*`, `accent`, `separator`, and `radius-*` theme keys in
`globals.css` (`@theme inline`). The mockup uses plain CSS with the same variables; the Tailwind
equivalents below are what the React components should use.

> **Radius classes.** `globals.css` overrides the radius scale, so `rounded-md` = **12px**,
> `rounded-lg` = **16px**. The pull-down menu uses the iOS `rounded-[13px]`; posters keep their
> existing `rounded-md`.

### State model — `?sort=` query param (keeps the grids server-rendered)

The grids are Server Components and the sort is computed in `getUserMovies` today. Model the
selection as a **URL search param** rather than client state:

- `/movies?sort=<key>` for the Watchlist, `/movies/archive?sort=<key>` for the archive.
- Param keys (shared enum): `added_desc` (default, Watchlist) · `added_asc` · `title_asc` ·
  `year_desc`. For the archive the timeline keys map to watched date — reuse `added_desc` /
  `added_asc` (they already resolve to `watched_at` in that section) or name them
  `watched_desc` / `watched_asc` if you prefer explicitness. One shared union type in
  `src/types/movies.ts`.
- Menu items are plain `<Link href={{ query: { sort } }}>` — selecting one is a navigation, the
  page re-renders server-side with the new order. No optimistic state, no client data fetching.
- Only the **trigger + menu open/close** is a small client island; the pages and grids stay Server
  Components.

### Sort trigger — new `src/components/movies/MovieSortMenu.tsx` (client)

A compact pull-down button + menu island. Suggested props:
`{ section: 'watchlist' | 'watched'; active: MovieSort; count: number }` (render `null` when
`count <= 1`).

```
Row wrapper (section header): flex items-center justify-between px-4 pt-4 pb-2
Lead (title + count):         flex items-baseline gap-2   (unchanged from today)
Trigger:  inline-flex items-center gap-1 min-h-[44px] pl-2 pr-0.5
            text-[15px] font-medium text-accent   (aria-haspopup="menu" aria-expanded)
Chevron:  the stacked chevron.up.chevron.down glyph, text-accent
Open state: text-accent/50   (source dims while the menu is open)
```

Open/close: toggle on tap; close on Escape, on outside tap (the scrim), and on selecting an item.
Reuse the body-scroll-lock / Escape handling already in `SeriesActionSheet` / `MovieActionSheet`
if convenient, though a lighter popover is fine here (no full sheet transition).

### Pull-down menu — same island

```
Scrim:   fixed inset-0 z-40 bg-black/[0.04]           (outside-tap dismiss; very light)
Menu:    absolute z-50 w-[232px] rounded-[13px] overflow-hidden
           bg-bg-elevated/85 backdrop-blur-2xl shadow-[0_12px_32px_rgba(0,0,0,0.24)]
           anchored under the trigger, right-aligned (top-full right-0 mt-1 via a relative parent)
Item:    flex items-center justify-between gap-3 w-full min-h-[44px] px-3.5
           text-[17px] text-text-primary   (border-t border-separator between items)
Selected: font-semibold + trailing check (text-accent, ~18px)
```

Each item is `role="menuitemradio"` with `aria-checked`; the group is the active-sort radio set.
The check glyph is the same `M20 6L9 17l-5-5` path used by the watched toggle / series sheet.

Motion (per DESIGN_SYSTEM.md): menu scales/fades in from the top-right origin (~150ms spring);
scrim fades. Grid re-order is a normal server re-render — a brief staggered fade-in of the grid
items (the existing list-appear motion) is enough; no FLIP animation required for v1.

### Section headers — `MoviesList.tsx` + archive page

Both section headers change from a plain `<h2> + count` to the `justify-between` row with the
trailing `MovieSortMenu`. The archive header is currently `flex items-baseline gap-2` — wrap its
title/count in a `.lead` and add the menu as the trailing child, matching the Watchlist header so
the control sits identically on both.

## Backend / query change

- **`getUserMovies`** (`src/lib/movies/queries.ts`) currently hardcodes `byNewest`. Extend it to
  accept the active sort per section and pick the comparator:
  - `added_desc` / `added_asc` → the existing `sortKey` (`created_at` for watchlist, `watched_at ??
    created_at` for watched), descending / ascending.
  - `title_asc` → `a.movie.title.localeCompare(b.movie.title)` (case-insensitive; consider
    `{ sensitivity: 'base' }` and stripping a leading "The " if desired — call it out, don't
    silently add it).
  - `year_desc` → compare `movie.year` descending; nulls sort last.
- The page reads `searchParams.sort`, validates it against the `MovieSort` union (fall back to the
  default on anything unknown), and passes it down. Keep the `{ ok } | { ok: false, error }`-style
  discipline — invalid params degrade to the default rather than throwing.
- This is a small backend follow-up (agent-backend); it's noted here for the implementer and is
  out of scope for this design deliverable.

## Status / colors

Matches DESIGN_SYSTEM.md: interactive elements (trigger, checkmark) use `accent`; text uses
`text-primary` / `text-secondary`. No new tokens. The watched checkmark on posters keeps
`accent-green` unchanged.

## Alternatives considered

- **Nav-bar trailing button (archive) / header button (Watchlist).** The natural iOS spot for a
  screen-wide sort, but the two surfaces have different top chrome (large-title header vs. a
  back/title nav bar), so the control would land in two different places and read inconsistently.
  The section header is the one row both surfaces share.
- **Segmented control under the header.** Very discoverable, but four labels ("Recently added",
  "Oldest added", "Title (A–Z)", "Release year") don't fit a 358px-wide segmented control without
  truncating, and it adds a persistent band of chrome above every grid.
- **Bottom action sheet (like the movie manage sheet).** Consistent with issue #80, but a full
  sheet is heavy for a one-tap preference; iOS reserves sheets for actions, and uses the inline
  pull-down menu specifically for sort/filter (Files, Mail, Photos).
- **Separate field + ascending/descending toggle (iOS Files style).** More powerful, but the issue
  lists four discrete orderings; a flat four-item menu is simpler and matches the request. Direction
  is folded into the label ("Recently" vs "Oldest") where it matters.

## Notes for implementation

- One shared `MovieSortMenu` island serves both surfaces; only `section` (and the resulting
  labels/param mapping) differs.
- Persisting the choice beyond the URL (e.g. a user preference) is not required — the `?sort=`
  param already survives in-session navigation and is shareable. Revisit only if product wants the
  order to stick across visits.
- No new movie statuses; movies remain a binary `watched` / `watchlist`.
