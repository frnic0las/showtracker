# Mockups — Movies watchlist + archive (issue #68)

Refactors the Movies tab so `/movies` shows **only the watchlist** ("what do I want to watch next"),
and moves watched films to a new `/movies/archive` push-navigation sub-page reached from a **"Watched"**
link at the bottom of the list. Directly mirrors the `/series/archive` pattern (issue #67, implemented
in #76) so the two surfaces read as one system.

Open `index.html` at a **390px-wide viewport** and toggle your OS appearance to preview light and
dark (both driven by `prefers-color-scheme`, matching `src/app/globals.css`). Reuses the existing
3-up poster grid and `MovieCard` so the archive is visually indistinguishable from the main grid.

## Design intent

The issue frames the watchlist as the primary surface and watched films as historical. Three
decisions follow — deliberately aligned with the series archive so the app has one archive idiom:

1. **Main tab keeps its shell, loses the Watched section.** `/movies` keeps its large `Movies`
   title + search button (it's a primary tab surface). Below it, the `MoviesList` now renders the
   **Watchlist** grid only, then the `Watched` link. The `Watched` section is gone from this page.
2. **Push-navigation sub-page, not a tab or filter.** `/movies/archive` opens with a standard iOS
   nav bar: a `‹ Movies` back button and an inline title. No large title, no search — those belong
   to primary surfaces. The bottom tab bar stays (Movies active), matching the app shell. This is
   identical to the series archive nav treatment.
3. **One group, no sub-grouping.** Movies only split `watched` / `watchlist` — there is no
   completed-vs-stopped distinction like series. So the archive is a single **Watched** grid with a
   count, no segmented control, no client state. If empty, the whole page falls back to a centered
   empty state (frame 3).

Unlike the series archive, the archive posters are **not dimmed and carry no badge**. Series dims
"stopped" shows to read as set-aside; a watched movie is a completed, positive record, so it keeps
the full-color `MovieCard` — including its live watched toggle (see below).

## Screens covered

| # | Screen | State |
| - | ------ | ----- |
| 1 | `/movies` — watchlist only | Watchlist grid + `Watched` archive link at the bottom |
| 2 | `/movies/archive` — populated | Single `Watched` poster grid (toggle filled green) |
| 3 | `/movies/archive` — empty | No watched films; centered empty state |
| 4 | `/movies` — empty watchlist | Watchlist empty but watched films exist: short message + `Watched` link |

## Interaction — the watched toggle stays live

`MovieCard` already overlays a watched toggle on every poster and calls `toggleMovieWatched` on tap,
revalidating the page. Reusing it **unchanged** in the archive means:

- On the **watchlist** (frame 1): the toggle is the hollow ring. Tapping it marks the film watched,
  which revalidates `/movies` — the card leaves the watchlist and now lives in the archive.
- In the **archive** (frame 2): the toggle is filled green. Tapping it un-watches the film, which
  revalidates `/movies/archive` — the card leaves the archive and returns to the watchlist.

No per-card "remove" action is needed; the existing toggle already moves films between the two
surfaces. This is the one behavioural difference from the series archive, whose cards are inert links.

---

## Data rules

Both surfaces come from the existing `getUserMovies(userId)` (`src/lib/movies/queries.ts`), which
already returns `{ watched: UserMovie[]; watchlist: UserMovie[] }`. **No backend change is required** —
this is a pure presentation refactor (contrast issue #67, which needed a new RPC column):

- **Watchlist** (main page) = the `watchlist` array. Rendered as today, minus the Watched section.
- **Watched** (archive page) = the `watched` array.
- Ordering: reuse whatever order `getUserMovies` returns (or sort by title). Not prescriptive.

The archive page loads the user, calls `getUserMovies`, and renders the `watched` array — the auth
guard mirrors `src/app/(app)/movies/page.tsx`.

### Empty states — three distinct cases (frames 1, 3, 4)

`MoviesPage` keeps its existing full-page empty state when the user has **no movies at all**
(`movieIds.length === 0` → `CenteredState` "No movies yet" with the search CTA — unchanged). Two new
cases fall out of the watchlist/watched split:

- **Empty watchlist, watched films exist** (frame 4): `MoviesPage` still renders `MoviesList` (the
  user *has* movies). `MoviesList` shows no watchlist grid, so — to avoid a bare floating link — it
  renders a compact centred message ("Your watchlist is empty" + one line) above the `Watched` link.
  This is lighter than the full-page `CenteredState`; it sits inline where the grid would be.
- **Empty archive** (frame 3): the `/movies/archive` page's own empty state (below).

## Component mapping → Tailwind

Tokens resolve to the `bg-*`, `text-*`, `accent*`, `separator`, and `radius-*` theme keys in
`globals.css` (`@theme inline`). The mockup uses plain CSS with the same variables.

> **Radius classes.** `globals.css` overrides the radius scale, so `rounded-sm` = **8px**,
> `rounded-md` = **12px**, `rounded-lg` = **16px**. `rounded-full` is the pill.

### Main page — `src/app/(app)/movies/page.tsx` (edit) + `MoviesList` (edit)

`MoviesPage` is unchanged except that `MoviesList` no longer takes/needs `watched` for its grid.
`MoviesList` renders the **Watchlist** section only, followed by the archive link. The existing
`MovieSection` heading is kept for Watchlist. Drop the `Watched` `MovieSection`.

> The main page still needs the full `movieIds` list (watched + watchlist) for the search sheet's
> "already added" state, so `getUserMovies` keeps returning both arrays — only the rendering changes.

### Archive link — new bottom-of-list row in `MoviesList` (mirror `ToWatchView`)

Copy the link markup from `src/components/series/ToWatchView.tsx` verbatim, swapping the href and copy:

```
Link:   mx-4 mt-6 mb-1 flex min-h-[44px] items-center justify-between rounded-md
          border border-separator bg-bg-elevated px-4 py-3 text-[15px] text-text-primary
          → href="/movies/archive"
Label:  "Watched"
Sub:    mt-0.5 block text-[13px] text-text-secondary        ("Movies you've seen")
Chevron: h-4 w-2.5 shrink-0 text-text-tertiary   (9×16, stroke 2)
```

### Archive page — new `src/app/(app)/movies/archive/page.tsx`

Server Component, structured exactly like `src/app/(app)/series/archive/page.tsx`:

```
Nav bar:  relative flex h-11 items-center justify-center border-b border-separator
            bg-bg-primary/80 backdrop-blur-xl
Title:    text-[17px] font-semibold text-text-primary        ("Watched")
Back:     absolute left-2 inline-flex h-11 items-center gap-0.5 px-2 text-[17px] text-accent
            → Link href="/movies"   (chevron 12×20, stroke 2.4)
```

Then a section header + the poster grid. Use the series `ArchiveSection` header (a separate 15px
tabular count, `pt-5`) — **not** `MoviesList`'s `MovieSection` heading — so the two archives match:

```
Head:   flex items-baseline gap-2 px-4 pt-5 pb-2      (matches series/archive ArchiveSection)
Title:  text-[20px] font-semibold tracking-tight text-text-primary        ("Watched")
Count:  text-[15px] font-semibold text-text-secondary tabular-nums         ("· 6")
Grid:   grid grid-cols-3 gap-x-3 gap-y-4 px-4          (reuse; one MovieCard per watched movie)
```

> Note the deliberate split: the **watchlist** header on `/movies` keeps `MovieSection`'s inline
> 20px count (`MoviesList.tsx:12-14`), while the **archive** header uses the series `ArchiveSection`
> style above. Same 20px title, different count treatment — matching each surface's neighbour.

`MovieCard` is reused **as-is** — no new prop or variant. Its watched toggle already does the right
thing in this context (un-watch → revalidate → returns to watchlist). The toggle keeps `MovieCard`'s
44px (`h-11 w-11`) touch target; the visible ring is a 28px circle inset within it.

### Empty state — reuse `src/components/ui/CenteredState.tsx`

```
Icon:    movie/clapper strip, 48×48, text-tertiary (the same glyph as the Movies tab icon)
Title:   "Nothing watched yet"        (headline / text-[17px] font-semibold)
Desc:    "Movies you mark as watched will collect here."
```

No CTA button — this is a dead-end secondary page; the user reaches it deliberately and backs out
via the nav bar. (DESIGN_SYSTEM.md allows the CTA to be omitted when none applies.)

## Notes for implementation

- **No backend dependency** — everything is presentation over the existing `getUserMovies`.
- Keep the archive page a Server Component; the only interactivity is `MovieCard` (already a client
  component) and `Link` navigation.
- Handle the load error the same way the Movies page does (the query throws on failure).
- `MoviesList` still receives both arrays if convenient, but renders only `watchlist` — the archive
  page owns the `watched` render. Keep the change surgical: remove one section, add one link.
