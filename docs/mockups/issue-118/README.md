# Mockups — Movie detail page (issue #118)

A dedicated page at **`/movies/[id]`**, reachable from movie search results and from both movie
grids. It exists so two identically-titled films can be told apart *before* one is added, and so a
tracked movie has somewhere to show its state.

Open `index.html` at a **390px-wide viewport** and toggle your OS appearance to preview light and
dark (both driven by `prefers-color-scheme`, matching `src/app/globals.css`). Screen 7 renders at
375px, the narrowest supported width. **The frames scroll** — a detail page is taller than one
viewport, so each screen is live-scrollable rather than clipped.

> Sample content. "Dune: Part Two" uses real TMDB-style credits; the two "The Odyssey" (2026)
> entries are invented, standing in for the collision described in the issue.

## Screens covered

| # | Screen | State |
| - | ------ | ----- |
| 1 | The Odyssey (2026) #1 | Not tracked — the two add actions |
| 2 | The Odyssey (2026) #2 | Not tracked — the twin, to compare against #1 |
| 3 | Dune: Part Two | Tracked, `watched = false` — watchlist state card |
| 4 | Dune: Part Two | Tracked, `watched = true` — watched state card with its date |
| 5 | Dune: Part Two | The `•••` action sheet: reverse + remove |
| 6 | Sirocco (2025) | No backdrop — the poster cover-cropped into the hero band |
| 7 | The Long Dark (2027) @375px | Not tracked, unreleased, almost no metadata |
| 8 | — | Loading skeleton |

The error state needs no frame: `src/app/(app)/series/[id]/error.tsx` already defines the pattern
and `movies/[id]/error.tsx` is a copy of it. An unknown TMDB id calls `notFound()`, like the series
page.

---

## The layout

One page, top to bottom. Only the block under the hero changes with tracking state:

```
┌──────────────────────────┐
│  hero — backdrop 220px   │  ‹ back        ••• (tracked only)
│  title + year · runtime  │
├──────────────────────────┤
│  ACTION BLOCK            │  ← the only state-dependent block
├──────────────────────────┤
│  Overview                │
│  Cast          → scrolls │
│  Details                 │
└──────────────────────────┘
```

The hero is the movie twin of `SeriesHero` — same 220px height, same bottom-up gradient, same
translucent 44×44 back and `•••` buttons, same 28px title over a 13px metadata line. A user
arriving from a series page should not feel they changed app.

> **What the status bar really does.** The frames draw an iOS status bar in flow, as the other
> mockups do, so it never covers the screen under review. The installed PWA does *not* behave that
> way: `src/app/layout.tsx` sets `viewportFit: "cover"` and nothing applies
> `env(safe-area-inset-top)`, so the hero runs full-bleed behind the status bar and the `top-2`
> back button sits near the clock. That is already true of the series hero — this page inherits it
> rather than introducing it, and fixing it is an app-wide change, not this issue.

### The action block — one block, three shapes

| Tracking state | Block | Primary action |
| -------------- | ----- | -------------- |
| Not tracked | Two buttons side by side | **Add to Watchlist** / **Mark as Watched** |
| `watched = false` | State card: "In your watchlist" + `Added <date>` | Inline **Watched** pill |
| `watched = true` | State card: "Watched" + `on <date>` | *(none — terminal state)* |

Two deliberate choices here:

**The two add buttons mirror the search result row.** `MoviesSearchSheet` already offers exactly
this pair — outlined-accent "Watchlist" next to filled-green "Watched". The detail page is the
slower, better-informed version of that same decision, so it uses the same two affordances rather
than inventing a hierarchy between them.

**The watched card carries no inline action.** Un-watching and removing are both reversals, both
already live in the `•••` sheet, and both are one tap away there. Giving the terminal state an
inline "Undo" would put the same action in two places on one screen and make the page's most common
view (a film you already watched) read as a to-do. The watchlist card *does* get an inline action
because moving watchlist → watched is the forward step, and it's the reason the user opened the
page.

The state card is the shell of `StoppedBanner`: 36px tinted icon circle, 15px semibold title, 13px
secondary subtitle, optional trailing pill. Reusing it keeps a third card style out of the app.

### Sections

- **Overview** — full TMDB overview, not truncated. Two to five sentences; a "more" toggle would add
  a client island to save ~40px.
- **Cast** — horizontal rail, 64px circular avatars, top 10 billed. Informational only: names are
  **not tappable**, there is no person page, and none is proposed. The rail is deliberately cut off
  at the right edge so the horizontal scroll is discoverable.
- **Details** — grouped list: **Director**, **Writing**, **Release date**. Director is the single
  strongest disambiguator between same-title films, so it leads.

Runtime lives only in the hero metadata line, and the release *year* only there too — the Details
row carries the full date. Nothing is printed twice.

### Empty data is dropped, never stubbed

Screens 6 and 7 are the stress cases. Rules, in order:

1. A section with no data is **not rendered** — no "No overview available" placeholder, no em dash.
   On screen 7, `Overview` and `Cast` disappear entirely.
2. A Details row with no value is **not rendered** (screen 7 has no Writing row). If every row is
   empty, the whole Details block goes.
3. Missing runtime just drops that segment of the metadata line; the year stands alone.
4. **No backdrop → fall back to the poster** (screen 6): `poster_path` at `w780`, `object-cover`
   under the same gradient. TMDB carries a poster far more often than a backdrop. The 2:3 poster
   loses roughly its top and bottom third to the 220px band — screen 6 draws that crop at true
   proportions so the trade is visible: composition is lost, colour and legibility are not, and the
   title is printed over it anyway.
5. Neither backdrop nor poster (screen 7): the hero collapses to **140px** instead of shipping
   220px of empty surface.

### Unreleased

When `release_date` is strictly in the future, the metadata line gains an `accent-orange`
**Unreleased** pill — the same treatment `SeriesHero` gives a returning series, and the same
`isFutureDate` check that already guards marking a movie watched. It explains, in advance, the
"Not released yet" confirm the user gets if they tap **Mark as Watched** anyway.

---

## Entry points

| From | Today | With this page |
| ---- | ----- | -------------- |
| Movie grid tile (`MovieCard`) | Long-press → sheet; corner toggle | **Tap poster → detail.** Long-press and toggle keep working |
| Search result row (`MoviesSearchSheet`) | Two add buttons only | **Tap the poster/title area → detail.** The two buttons still add inline |

Two things that are not free:

> **The grid tile's long press fights the link.** `MovieCard` starts a 500ms timer on `pointerdown`
> and opens the sheet from it — the `pointerup` that ends that same press would fire the link's
> click and navigate straight past the sheet. Wrapping the tile in a `<Link>` therefore has to
> suppress the click when the long press fired (and set `[-webkit-touch-callout:none]`, or iOS
> shows its own link preview on the held anchor). The corner watched-toggle already opts out via
> `data-movie-toggle`; keep that guard.

> **Search loses its query.** The add-movie sheet is component state (`MoviesSearch` holds `open`),
> not a route. Navigating to a detail page from a result unmounts it, so **Back returns to the
> Movies grid with the search closed and the query lost**. The mockups assume that behavior — it's
> one `<Link>` and honest enough for a disambiguation trip that usually ends in an add. Making the
> sheet route-driven (`?add=1&q=…`) so Back restores it is a real improvement and a separate issue;
> don't let it grow this one.

---

## Data

`movies_cache` already stores everything the hero, Overview and Details rows need — `title`,
`overview`, `poster_path`, `backdrop_path`, `release_date`, `runtime` — and `user_movies` carries
`watched`, `watched_at` and `created_at` for the state card.

**Cast and crew are the one gap.** Nothing in the schema holds credits. They come from TMDB's
`/movie/{id}?append_to_response=credits` — the *same request* the page already makes for details,
with one query param added, no second round trip. Recommended for this feature: read credits live
in the Server Component (Next's `fetch` cache handles repeats) and leave the schema alone. Adding a
`movie_credits` cache table is a migration this page does not need and shouldn't carry.

The page must also render for movies the user does **not** track and that may not be in
`movies_cache` at all (screens 1, 2, 6, 7): TMDB is the source of truth for the metadata,
`user_movies` only supplies the tracking state.

## Formats

| Value | Format | Example | Source |
| ----- | ------ | ------- | ------ |
| Runtime | `Nh Nm`, or `Nm` under an hour | `2h 46m`, `94m` | `runtime` (minutes) |
| Release date | `MMM D, YYYY` | `Mar 1, 2024` | matches `formatDate` in `src/lib/series/format.ts` |
| Watched date | `on MMM D, YYYY` | `on Mar 14, 2024` | `user_movies.watched_at` |
| Added date | `Added MMM D, YYYY` | `Added Aug 12, 2026` | `user_movies.created_at` |

`watched_at` can be null on a watched row (imported data). Then the card title stays **Watched** and
the subtitle is omitted — never "Watched on unknown date".

---

## Component mapping → Tailwind

Tokens resolve to the `bg-*`, `text-*`, and `radius-*` theme keys in `globals.css` (`@theme inline`).
The mockup uses plain CSS with the same variables. **No new tokens, no new spacing values.**

> **Radius classes.** `globals.css` overrides the radius scale, so `rounded-sm` = 8px,
> `rounded-md` = 12px, `rounded-lg` = 16px.

### New files

```
src/app/(app)/movies/[id]/page.tsx        Server Component — TMDB details+credits, user_movies state
src/app/(app)/movies/[id]/loading.tsx     skeleton (screen 8)
src/app/(app)/movies/[id]/error.tsx       copy of the series twin
src/components/movies/MovieHero.tsx       hero (server)
src/components/movies/MovieStateCard.tsx  watchlist / watched card (client — the inline action)
src/components/movies/MovieAddActions.tsx untracked pair of buttons (client — addMovie + confirm)
src/components/movies/CastRail.tsx        cast strip (server)
```

### `MovieHero`

```
Wrapper:   relative flex h-[220px] items-end overflow-hidden bg-bg-secondary
             (h-[140px] when there is neither backdrop nor poster)
Image:     next/image fill sizes="430px" object-cover
             src = backdropPath ?? posterPath, at w780
Gradient:  absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/60 to-transparent
Text:      relative z-[2] w-full px-4 pb-4
Title:     text-[28px] font-bold leading-tight tracking-tight text-text-primary
Meta:      mt-2 flex flex-wrap items-center gap-2 text-[13px] text-text-secondary
Separator: <span className="opacity-50">·</span>
Unreleased:inline-flex items-center gap-1 font-semibold text-accent-orange
```

Every one of those title and meta classes is copied from `SeriesHero`, not re-derived.

Back and `•••` buttons are lifted straight from the series hero
(`absolute left-3 top-2 z-[3] flex h-11 w-11 items-center justify-center rounded-full
bg-bg-primary/55 text-text-primary backdrop-blur-md`, `right-3` for the menu). `•••` renders only
when the movie is tracked.

> **`DetailBackButton` needs one prop.** It currently falls back to `/series` when there is no
> internal history. Add `fallbackHref` (default `/series`) and pass `/movies` here, or a movie
> opened from a shared link lands the user on the wrong tab.

### `MovieAddActions` — not tracked

```
Row:        flex gap-3 p-4
Button:     flex-1 inline-flex min-h-11 items-center justify-center gap-1.5
              rounded-md text-[15px] font-semibold disabled:opacity-50
Watchlist:  border border-accent text-accent
Watched:    bg-accent-green text-white
```

Both call the existing `addMovie(tmdbId, 'watchlist' | 'watched')`, and both disable while one is
pending — the same `pendingId` discipline `MoviesSearchSheet` uses. **Mark as Watched** on an
unreleased movie opens the shared `ConfirmDialog` ("Not released yet") exactly as the search sheet
does — same copy, same guard.

> **Known contrast exception.** White on `--accent-green` is ~2.2:1, below AA for 15px text. It is
> what ships today on the search sheet's "Watched" button, so the page matches it rather than
> introducing a second green. If it is ever fixed, fix it in both places at once — that is its own
> issue.

### `MovieStateCard` — tracked

```
Card:      m-4 flex items-center gap-3 rounded-md bg-bg-secondary p-3.5
Icon:      flex h-9 w-9 shrink-0 items-center justify-center rounded-full
             watchlist: bg-accent/[.18] text-accent            (bookmark glyph)
             watched:   bg-accent-green/[.18] text-accent-green (check glyph)
Copy:      min-w-0 flex-1
Title:     text-[15px] font-semibold text-text-primary
Subtitle:  mt-0.5 text-[13px] text-text-secondary
Pill:      inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full
             bg-accent/[.14] px-4 text-[15px] font-semibold text-accent
             disabled:opacity-50
```

Both alphas (`.18` on the icon circle, `.14` on the pill) are `StoppedBanner`'s, unchanged.

**The pill is accent blue, not green.** Green-on-tint is ~1.9:1 in light mode; the accent tint that
`StoppedBanner`'s Resume pill already uses clears AA. The green check glyph inside it carries the
meaning.

The pill calls `toggleMovieWatched(tmdbId)` — the same action as the poster checkmark — and **must
run the same `isFutureDate(releaseDate)` guard first**, opening the "Not released yet"
`ConfirmDialog` on a future release date. `MovieCard` and `MovieActionSheet` both guard it; the
watchlist-add path never confirms, so an unreleased movie can sit in the watchlist and this pill is
where it would otherwise slip through unconfirmed.

### Sections

```
Header:    px-4 pt-4 pb-2 text-[20px] font-semibold tracking-tight text-text-primary
Overview:  px-4 text-[15px] leading-normal text-text-primary
```

The header is character-for-character the "Seasons" header in `series/[id]/page.tsx`.

### `CastRail`

```
Rail:      flex gap-3 overflow-x-auto px-4 pb-2 pt-1 [scrollbar-width:none]
Item:      w-[72px] shrink-0 text-center
Avatar:    mx-auto mb-2 h-16 w-16 overflow-hidden rounded-full bg-bg-secondary
             → next/image w185 profile, object-cover
Name:      text-[13px] font-semibold leading-tight text-text-primary
Character: mt-0.5 text-xs leading-tight text-text-secondary
```

Cast members with no profile photo keep the `bg-bg-secondary` circle — same rule as a missing
poster.

### Details list

```
Card:      mx-4 overflow-hidden rounded-md bg-bg-secondary
Row:       flex min-h-11 items-center justify-between gap-4 px-4 py-3
Key:       shrink-0 text-[15px] text-text-secondary
Value:     text-right text-[15px] text-text-primary
Separator: border-t border-separator ml-4   (inset, as the design system specifies)
```

Non-navigable rows, so **no chevrons**.

### `•••` sheet

`MovieActionSheet` is reused unchanged in appearance — the header shows the title over
`Watched` / `In your watchlist`, then **Mark as watched/unwatched**, **Remove from movies**
(`text-accent-red`), and a detached **Cancel**. Remove keeps its `ConfirmDialog` guard.

> **One behavioural difference from the grid.** From the grid, a successful remove just drops the
> tile. From the detail page it should `router.push('/movies')`, matching what `SeriesActionSheet`
> does after removing a series. That needs a prop (e.g. `redirectOnRemove`) on `MovieActionSheet`;
> its current doc comment ("no navigation, since movies have no detail page") stops being true with
> this issue.

### Loading (screen 8)

Structurally identical to `series/[id]/loading.tsx`: the **real** hero shell
(`relative flex h-[220px] items-end overflow-hidden bg-bg-secondary` + the real gradient + a real
`DetailBackButton`, so Back works while the page loads), with the title and meta lines replaced by
`animate-pulse rounded bg-bg-elevated` bars **inside** the hero — not below it, or everything shifts
~70px when data lands. Below: two button placeholders, three overview lines, four avatar circles,
one details card.

### Accessibility

- Back and `•••` keep their `aria-label`s (`Back`, and the sheet's `aria-label={`Actions for
  ${title}`}`) — icon-only buttons, nothing else names them.
- The cast rail is a scrollable region: `role="region"` + `aria-label="Cast"` and `tabIndex={0}`, so
  keyboard and switch users can reach content past the right edge.
- The inline pill announces the action, not the state: `aria-label="Mark <title> as watched"`. After
  it succeeds the card re-renders as the watched shape — put `aria-live="polite"` on the state card
  so the change is spoken, since the button that triggered it disappears.
- Cast avatars are decorative next to the name they sit above: `alt=""`.
- Every interactive target is ≥44px: buttons and pill `min-h-11`, hero buttons `h-11 w-11`, details
  rows `min-h-11`, sheet rows 57px.

---

## Out of scope

No ratings, no comments, no social features (per the issue). No person pages behind cast names, no
trailers, no similar-movies rail, no genres, no production companies, no rewatch history — none of
it serves "tell these two films apart" or "see and change what I've tracked".
