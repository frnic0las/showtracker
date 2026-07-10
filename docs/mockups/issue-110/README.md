# Mockups — Profile watch time stats (issue #110)

Adds **total watch time**, split by medium, to the Profile page's stats block. The existing three
count tiles (Series / Episodes / Movies) are unchanged; a **second row of two wider tiles** carries
`Series time` and `Movies time`.

Open `index.html` at a **390px-wide viewport** and toggle your OS appearance to preview light and
dark (both driven by `prefers-color-scheme`, matching `src/app/globals.css`). Screen 4 renders at
375px, the narrowest supported width.

## The layout

**3 + 2 tile grid.** The stats block becomes two rows sharing one tile shell:

```
┌─────┐ ┌─────┐ ┌─────┐     grid-cols-3
│ 42  │ │ 918 │ │ 63  │     counts (unchanged)
└─────┘ └─────┘ └─────┘
┌───────────┐ ┌───────────┐ grid-cols-2
│  27d 6h   │ │  4d 22h   │ watch time (new)
└───────────┘ └───────────┘
```

Reusing the tile shell is the whole point: the two rows read as **one stats block**, not as a widget
bolted onto a widget. The second row gets two columns because two data points at 28px need the
width — a 2-up tile is 173px wide at 390px, comfortable for the longest realistic string.

There is deliberately **no total tile and no series-vs-movies ratio bar**. The issue asks for time
spent on series and time spent on movies; a total is the sum of two numbers already on screen, and a
ratio is a different question than the one asked.

## Number format — a two-unit ladder

Watch time arrives as an integer count of minutes. Render the **largest two units**, dropping the
remainder:

| Range              | Format   | Example    |
| ------------------ | -------- | ---------- |
| ≥ 1 day            | `Nd Nh`  | `27d 6h`   |
| ≥ 1 hour, < 1 day  | `Nh Nm`  | `5h 12m`   |
| < 1 hour           | `Nm`     | `48m`      |
| zero               | `0m`     | `0m`       |

Rules that fall out of this:

- A zero-valued larger unit is **omitted**, never padded: `0d 6h` is wrong, `6h 0m` is right.
- A zero-valued smaller unit **is kept** when a larger one is present (`27d 0h`), so the tile doesn't
  visibly change shape as the minutes tick over.
- Zero renders `0m`, never a blank or an em dash. A new user sees a real number.
- "Day" here means **24 hours of screen time**, not a calendar day. This is the same convention TV
  Time and Trakt use, so the figure is comparable to what users have seen elsewhere.

**Unit suffixes are typographically demoted** — 17px semibold `text-secondary` against the 28px bold
numeral. This is the iOS Health / Fitness treatment, and it's what lets a five-character string like
`27d 6h` sit in the same visual row as a bare `918` without the time tiles shouting. Numerals use
`font-variant-numeric: tabular-nums` so the figures don't jitter on re-render.

## Screens covered

| # | Screen | State |
| - | ------ | ----- |
| 1 | Profile — typical | Established library; both time tiles in the `Nd Nh` band |
| 2 | Profile — new user | All counts zero, both time tiles `0m` |
| 3 | Profile — light usage | Sub-day ladder: `5h 12m` and `48m` |
| 4 | Profile — heavy library @ 375px | Widest realistic strings at the narrowest width; no wrap, no truncation |

---

## Component mapping → Tailwind

Tokens resolve to the `bg-*`, `text-*`, and `radius-*` theme keys in `globals.css`
(`@theme inline`). The mockup uses plain CSS with the same variables.

> **Radius classes.** `globals.css` overrides the radius scale, so `rounded-md` = **12px**.

### Tile surface — one change to the existing `StatTile`

Today's tile is `bg-bg-elevated`. In **light mode** `--bg-elevated` and `--bg-primary` are both
`#ffffff`, and `(app)/layout.tsx` paints the page `bg-bg-primary` — so the tiles currently have **no
visible boundary in light mode**. With one row this passes as a minimal look; with two rows and five
tiles it reads as broken alignment.

The mockup switches the tile surface to **`bg-bg-secondary`** (`#f2f2f7` light / `#1c1c1e` dark).
Both modes get a visible, distinct surface, no new tokens, and it matches how every other mockup in
`docs/mockups/` insets a surface on a `bg-primary` page.

> **The `Account` / `About` cards must change with it.** Those two grouped cards on the same page
> have the identical `bg-bg-elevated`-on-`bg-bg-primary` problem. If only the tiles are fixed, light
> mode ships **half-corrected** — bounded tiles sitting above still-invisible cards — and dark mode
> shows two different surfaces side by side (`#1c1c1e` tiles, `#2c2c2e` cards). That reads as a bug,
> and it is strictly worse than today's uniformly-flat page. The mockup draws all four surfaces
> corrected because that is what should ship.
>
> So: swap `bg-bg-elevated` → `bg-bg-secondary` on the two `.group-card` divs in
> `src/app/(app)/profile/page.tsx` **in the same PR** as the tiles. It is a two-line change confined
> to this page. The broader question — every other grouped card in the app has the same latent
> problem — is a genuinely separate ticket and should not be pulled in here.

### `src/components/profile/StatsSummary.tsx`

```
Wrapper:      flex flex-col gap-3 px-4        (was: grid grid-cols-3 gap-3 px-4)
Counts row:   grid grid-cols-3 gap-3
Times row:    grid grid-cols-2 gap-3
```

`StatTile` keeps its shape; only the surface class changes:

```
Tile:   flex flex-col items-center justify-center gap-0.5
          rounded-md bg-bg-secondary py-4
Value:  text-[28px] font-bold text-text-primary tabular-nums whitespace-nowrap
Label:  text-[13px] text-text-secondary
```

A sibling `TimeTile` (same file) renders the formatted parts:

```
Value:  text-[28px] font-bold text-text-primary tabular-nums whitespace-nowrap
Unit:   text-[17px] font-semibold text-text-secondary   (inline <span>, ml-px)
Part gap: the second part gets ml-1
```

The tile keeps `py-4` with **no horizontal padding**. The 3-up counts row needs the full track: at
375px each track is ~106px, and a five-digit `12480` at 28px bold is ~84px. Adding `px-2` would cut
the margin to ~6px and risk blowing the track out (a `1fr` track has `min-width: auto`, so
`whitespace-nowrap` content overflows the column rather than clipping).

Suggested props: `{ minutes: number; label: string }`, with the ladder applied by a
`formatWatchTime(minutes: number): string` helper in `src/lib/utils.ts` (pure, trivially unit
testable — it's the piece most worth a test).

### Accessibility

Each time tile is visually two numerals and two demoted letters; a screen reader should hear one
phrase. Give the tile an `aria-label` carrying the expanded form and mark the visual value
`aria-hidden`:

```
aria-label="Series time: 27 days 6 hours"
```

Counts are already self-describing and need nothing.

## Data / backend notes

Out of scope for this design deliverable — noted for the implementer (agent-backend follow-up).

- `UserStats` (`src/types/stats.ts`) gains `seriesMinutes: number` and `moviesMinutes: number`.
- Runtime already exists: `episodes_cache.runtime` and `movies_cache.runtime`, both
  **nullable `smallint`** (minutes).
- `getUserStats` (`src/lib/stats/queries.ts`) adds two aggregate reads alongside its three existing
  head-only counts, joining `user_episodes` → `episodes_cache` and (watched) `user_movies` →
  `movies_cache`. Keep them inside the existing `Promise.all` — they're independent — and keep the
  per-result `error` check; do not let a failed aggregate silently become `0`.
- **Unknown runtimes are excluded from the total and not surfaced in the UI.** A `NULL` runtime
  contributes nothing (`coalesce(sum(runtime), 0)` — SQL `sum` already skips `NULL`). This is a
  deliberate product call: the figure shown is the *known* total, and the design says nothing about
  the gap. Worth knowing that the displayed number is therefore a lower bound, and that the size of
  the gap is invisible to both the user and us; if TMDB coverage turns out to be poor for episodes,
  revisit whether to surface it.
- Reads stay on the RLS-scoped client, so the aggregates only ever see the caller's rows.

## Alternatives considered

- **Hero watch-time card + count row.** A full-width card leading with the combined total and a
  split bar for the series/movies proportion. Strong visual, and the ratio is genuinely interesting —
  but it promotes watch time above the counts, introduces a card pattern the page doesn't otherwise
  have, and answers a question (the ratio) the issue didn't ask.
- **Grouped list section (`WATCH TIME`: Series / Movies / Total).** The most iOS-native option and
  the cheapest to build. Rejected because it buries the new data below the fold on a page whose whole
  top half is a stats block, and it makes watch time feel like a setting rather than a stat.
- **Five tiles in one wrapping grid.** A `grid-cols-3` with five children leaves a ragged orphan tile
  on the second row. A `grid-cols-2` with five leaves the orphan on row three. Neither is acceptable.
- **Enriching the existing tiles with a secondary time line.** Series and Movies tiles could each
  carry their time as a subtitle. But the Episodes tile has no natural time to show, so the row would
  be asymmetric — and a 3-line tile at 28px doesn't fit the 4px rhythm.

## Notes for implementation

- `formatWatchTime` is the only new logic and it is pure — test the four rungs of the ladder plus the
  `27d 0h` / `6h 0m` boundary cases before wiring the query.
- No new tokens, no new radius, no motion. The tiles inherit the page's existing staggered fade-in.
- `whitespace-nowrap` on the value is load-bearing: without it `412d 18h` wraps at 375px.
