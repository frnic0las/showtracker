# Mockups — Remove movie interaction (issue #80)

Adds a way to **remove a movie** from the user's list, plus a labelled **Mark as watched /
unwatched** action, from the movies poster grid. The `removeMovie` and `toggleMovieWatched`
server actions are the backing (`removeMovie` is documented in ARCHITECTURE.md but not yet
implemented — see "Backend").

Open `index.html` at a **390px-wide viewport** and toggle your OS appearance to preview light and
dark (both driven by `prefers-color-scheme`, matching `src/app/globals.css`). Builds on the
Movies tab (issue #73, `src/components/movies/MoviesList.tsx`) and the movies archive
(`src/app/(app)/movies/archive/page.tsx`).

## The interaction

**The problem.** Series expose status/remove actions from a `•••` button in their **detail-page
hero** (issue #66). Movies have **no detail page** — they live only as posters in a 3-column
grid, and the poster's top-right corner is already occupied by the one-tap watched toggle. So the
removal trigger has to come from the tile itself without adding competing chrome.

**Entry point — long-press.** Touch-and-hold any poster (~0.5 s) opens a **contextual iOS action
sheet**. This is the canonical iOS gesture for acting on a thumbnail (Home Screen icons, Photos,
App Library), so it needs no persistent affordance and keeps the grid clean. The pressed poster
**lifts and stays lit above the dimmed backdrop** (the iOS "peek") so the user sees exactly which
movie they're acting on; the sheet caption names it as well.

**Action sheet.** Rises from the bottom over a dimmed backdrop — the same Sheet Modal family as
issue #66. Actions depend on the movie's current section:

| Section (current state) | Sheet actions (top → bottom)                         |
| ----------------------- | ---------------------------------------------------- |
| Watchlist (`unwatched`) | **Mark as watched** · Remove from movies (red) · Cancel |
| Watched (`watched`)     | **Mark as unwatched** · Remove from movies (red) · Cancel |

- **Mark as watched / unwatched** is reversible → it applies **immediately** on tap, no
  confirmation. It calls the same `toggleMovieWatched` already wired to the poster checkmark, so
  the movie moves between the Watchlist grid and the Watched archive. The sheet is a discoverable,
  labelled twin of the small checkmark — not a new capability.
- **Remove from movies** is destructive (deletes the `user_movies` row) → it opens a **centered
  destructive confirmation alert** (`Cancel` / `Remove` in red) before calling `removeMovie`. On
  confirm, the movie disappears from the grid (revalidate; no navigation — unlike series, there's
  no detail page to leave).

**Discoverability.** Because long-press has no built-in visual cue, each grid carries a one-line
muted **hint** ("Touch and hold a poster to mark it or remove it.") below the fold of the first
screenful. It's advisory chrome, not a control.

## Screens covered

| # | Screen | State |
| - | ------ | ----- |
| 1 | Movies tab — Watchlist grid | Rest state + long-press hint |
| 2 | Long-press (Watchlist) → action sheet | Mark as watched · Remove · Cancel; pressed poster lit |
| 3 | Watched archive — grid | Rest state on `/movies/archive` |
| 4 | Long-press (Watched) → action sheet | Primary flips to Mark as unwatched |
| 5 | Remove — confirmation | Destructive alert before `removeMovie` |

---

## Component mapping → Tailwind

Tokens resolve to the `bg-*`, `text-*`, `accent*`, `separator`, and `radius-*` theme keys in
`globals.css` (`@theme inline`). The mockup uses plain CSS with the same variables; the Tailwind
equivalents below are what the React components should use.

> **Radius classes.** `globals.css` overrides the radius scale, so `rounded-sm` = **8px**,
> `rounded-md` = **12px**, `rounded-lg` = **16px**. `rounded-full` is the pill. The poster keeps
> its existing `rounded-md`; the sheet group / cancel use `rounded-lg`; the alert uses the iOS
> `rounded-[14px]`.

### Poster tile — extend `src/components/movies/MovieCard.tsx`

`MovieCard` is already a client component (it owns the optimistic checkmark toggle), so the
long-press handler lives here. Add a press-and-hold detector on the poster wrapper that opens a
shared action-sheet island. Keep the checkmark button as-is — it intercepts its own taps, so the
quick toggle survives.

- **Long-press detection.** On `pointerdown` start a ~500 ms timer; open the sheet on fire.
  Cancel the timer on `pointerup` / `pointermove` beyond a small slop / `pointercancel`. Call
  `event.preventDefault()` and suppress the browser context menu (`onContextMenu`) so the native
  menu and text selection don't interfere. Add a light haptic (`navigator.vibrate?.(10)`) on
  fire where supported.
- **Pressed poster (lit state)** — while the sheet is open for this card:

  ```
  relative z-[9]                      (tile lifts above the backdrop)
  poster: scale-[1.06] shadow-2xl outline outline-[3px] outline-accent/70 outline-offset-2
  transition-transform duration-200
  ```

The poster and checkmark markup themselves are unchanged from the current component:

```
Poster:   relative aspect-[2/3] overflow-hidden rounded-md bg-bg-secondary
Toggle:   absolute right-1 top-1 flex h-11 w-11 items-center justify-center   (44px hit area)
Dot:      h-7 w-7 rounded-full border-2 border-white bg-black/35 backdrop-blur-sm
            data-[watched]:border-accent-green data-[watched]:bg-accent-green data-[watched]:text-white
Title:    mt-2 truncate text-[13px] font-semibold text-text-primary
Year:     truncate text-xs text-text-secondary
```

### Movie action sheet — new `src/components/movies/MovieActionSheet.tsx` (client)

Structurally the twin of `SeriesActionSheet.tsx` — reuse its enter/exit transition, body-scroll
lock, Escape-to-close, and `useTransition` error handling. Suggested props:
`{ tmdbId: number; title: string; watched: boolean }`.

Backdrop + sheet container (identical classes to the series sheet):

```
Backdrop:  fixed inset-0 z-50 flex flex-col justify-end bg-black/40  (+ justify-center in confirm mode)
Sheet pad: w-full max-w-[430px] px-2 pb-[calc(8px+env(safe-area-inset-bottom))]
Group:     overflow-hidden rounded-lg bg-bg-elevated/95 backdrop-blur-xl
Caption:   border-b border-separator px-4 pb-3 pt-3.5 text-center text-[13px] text-text-secondary
             (title in font-semibold text-text-primary; second line = "In your watchlist" / "Watched")
Action:    flex min-h-[57px] w-full items-center justify-center gap-2 text-[20px] text-accent
             (+ font-semibold for the primary action; border-t border-separator between actions)
Destructive: text-accent-red
Cancel:    mt-2 min-h-[57px] w-full rounded-lg bg-bg-elevated/95 backdrop-blur-xl text-[20px] font-semibold text-accent
```

Actions:
- **Mark as watched / unwatched** → `toggleMovieWatched(tmdbId)`, then close the sheet. Label +
  icon derive from `watched` (check glyph when unwatched → "Mark as watched"; open circle when
  watched → "Mark as unwatched"), mirroring `SeriesActionSheet`'s `primaryAction`.
- **Remove from movies** → opens the confirm alert (below).

On error, keep the sheet open and surface the message (`text-accent-red` line under the group);
no optimistic state — same contract as `SeriesActionSheet`.

### Remove confirmation alert — same client island

Centered iOS alert, 270px wide, over the same dimmed backdrop — reuse the series markup verbatim:

```
Backdrop:  fixed inset-0 z-50 flex items-center justify-center bg-black/40
Dialog:    w-[270px] overflow-hidden rounded-[14px] bg-bg-elevated/95 backdrop-blur-xl text-center
Body:      px-4 pb-[18px] pt-5
Title:     text-[17px] font-semibold text-text-primary   ("Remove “{title}”?")
Message:   mt-1 text-[13px] leading-snug text-text-primary
             ("This removes the movie from your list. This can’t be undone.")
Actions:   flex border-t border-separator
Button:    min-h-[44px] flex-1 text-[17px] text-accent   (divider: border-l border-separator)
Remove:    text-accent-red font-semibold
```

On confirm → `removeMovie(tmdbId)`. No navigation — the grid revalidates and the tile drops out.

### Discoverability hint — `MoviesList.tsx` + archive page

A single muted line under the grid on both surfaces (Watchlist grid and the Watched archive):

```
mx-4 mt-1 flex items-center gap-2 px-3 py-2 text-[13px] text-text-secondary
  (leading info glyph in text-tertiary)
```

Copy: "Touch and hold a poster to mark it or remove it." (Watched variant: "…to mark as unwatched
or remove.")

## Status colors

Matches DESIGN_SYSTEM.md "Status Badges" and the issue #66 sheet: the primary reversible action
uses `accent`; the destructive action and confirm button use `accent-red`. The watched checkmark
keeps `accent-green`.

## Motion (per DESIGN_SYSTEM.md)

- Long-press: poster scales to ~1.06 with a spring; light haptic on trigger.
- Action sheet: slide up + spring ease (~300ms); backdrop fades in.
- Alert: quick fade + subtle scale-in (~200ms).
- On remove: the tile fades/collapses out of the grid as it revalidates.

## Backend

- **`toggleMovieWatched`** already exists (`src/actions/movies.ts`) — no change.
- **`removeMovie`** is documented in ARCHITECTURE.md but **not implemented**. It needs to be added
  before this UI can ship: delete the `user_movies` row for `(user.id, tmdbId)` under RLS, guard
  the id, return the `{ ok } | { ok: false, error }` shape used by the other movie actions, and
  `revalidatePath('/movies')` (also `/movies/archive`). That's a small backend follow-up
  (agent-backend), out of scope for this design deliverable.

## Notes for implementation

- Keep the long-press trigger + sheet + confirm alert in a single client island reused by every
  `MovieCard`; the pages stay Server Components.
- The same `MovieActionSheet` serves both the Watchlist grid and the Watched archive — only
  `watched` differs, which flips the caption and the primary action.
- No new statuses. Movies remain a binary `watched` / `watchlist`.

## Alternatives considered

- **`•••` badge on each poster** — always visible and consistent with the series `•••`, but a
  second control competing with the checkmark on a ~120px-wide tile crowds the art and doubles the
  chrome on every poster.
- **Tap poster → sheet** — highly discoverable and reuses the currently-dead tap area, but on iOS
  tapping a poster reads as "open detail"; hijacking it for a menu would surprise users and
  foreclose a future movie detail page.
- **Swipe-to-delete** — the canonical list gesture, but it doesn't map to a 3-column poster grid
  (no full-width rows to swipe).

Long-press was chosen: it's the native gesture for a thumbnail grid, adds zero persistent chrome,
preserves the one-tap checkmark, and leaves a future tap-to-detail interaction open.
