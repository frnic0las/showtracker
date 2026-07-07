# Mockups — Series status actions (issue #66)

Adds a way to **stop watching**, **resume**, and **remove** a series from the series detail
page. The `updateSeriesStatus` and `removeSeries` server actions already exist
(ARCHITECTURE.md); this design exposes them in the UI.

Open `index.html` at a **390px-wide viewport** and toggle your OS appearance to preview light
and dark (both driven by `prefers-color-scheme`, matching `src/app/globals.css`). Builds on the
series detail page from issue #29 (`docs/mockups/series-tab/`) — same hero, continue card, and
season accordions.

## The interaction

**Entry point.** A single `•••` (ellipsis / "more") button in the hero's **top-right corner**,
mirroring the existing Back button top-left. It's the standard iOS "more actions" affordance and
keeps the hero uncluttered — one control for every status transition.

**Action sheet.** Tapping `•••` opens a **contextual iOS action sheet** rising from the bottom
over a dimmed backdrop (the Sheet Modal family in DESIGN_SYSTEM.md). The actions shown depend on
the current status:

| Current status        | Sheet actions (top → bottom)                              |
| --------------------- | --------------------------------------------------------- |
| `watching`            | **Stop watching** · Remove from library (red) · Cancel    |
| `stopped`             | **Resume watching** · Remove from library (red) · Cancel  |
| `watchlist`           | **Start watching** · Remove from library (red) · Cancel   |
| `completed` (computed)| Remove from library (red) · Cancel                        |

- **Stop / Resume / Start** are reversible → they apply **immediately** on tap, no confirmation.
  The sheet closes and the page re-renders in the new state.
- **Remove** is destructive (deletes the row and all watch progress) → it opens a **centered
  destructive confirmation alert** (`Cancel` / `Remove` in red) before calling `removeSeries`.
  On confirm, navigate back to the series list.

**Stopped state on the page.** When a series is `stopped`, the detail page changes so the state
is legible without opening the menu (frame 3):

1. The hero meta line shows a muted **"Stopped" pill** instead of the airing status.
2. The **continue-watching card is replaced by a "Stopped" banner** carrying an inline
   **Resume** button — so recovery is one tap, discoverable, and doesn't require the `•••` menu.
3. Season accordions and per-episode toggles are unchanged (a stopped series keeps its progress).

## Screens covered

| # | Screen | State |
| - | ------ | ----- |
| 1 | Series detail — watching | New `•••` more button in the hero |
| 2 | Action sheet — watching  | Stop watching · Remove · Cancel |
| 3 | Series detail — stopped  | "Stopped" pill + banner + inline Resume |
| 4 | Action sheet — stopped   | Resume watching · Remove · Cancel |
| 5 | Remove — confirmation    | Destructive alert before `removeSeries` |

The `watchlist` and `completed` sheet variants are described in the matrix above but not drawn —
they reuse the same sheet component with a different action list.

---

## Component mapping → Tailwind

Tokens resolve to the `bg-*`, `text-*`, `accent*`, `separator`, and `radius-*` theme keys in
`globals.css` (`@theme inline`). The mockup uses plain CSS with the same variables; the Tailwind
equivalents below are what the React components should use.

> **Radius classes.** `globals.css` overrides the radius scale, so `rounded-sm` = **8px**,
> `rounded-md` = **12px**, `rounded-lg` = **16px**. `rounded-full` is the pill.

### Hero "more" button — extend `src/components/series/SeriesHero.tsx`

Sits alongside the existing `DetailBackButton`, positioned top-right instead of top-left. Same
translucent-circle treatment. Opens the action sheet (client state), so the trigger is a small
client island (like `DetailBackButton`).

```
absolute top-2 right-3 flex h-11 w-11 items-center justify-center rounded-full
  bg-bg-primary/55 text-text-primary backdrop-blur-md z-[3]
```

Icon: 3 filled dots, 20×20 (`circle` r=2 at x=5/12/19). `aria-label="More actions"`.

### Status action sheet — new `src/components/series/SeriesActionSheet.tsx` (client)

The `•••` button, the sheet, and the confirm alert are one client island driven by the series'
current `status`. Suggested props: `{ tmdbSeriesId: number; title: string; status: 'watching' | 'stopped' | 'watchlist'; completed: boolean; nextLabel?: string }`.

Backdrop + sheet container:

```
Backdrop:  fixed inset-0 z-[8] flex flex-col justify-end bg-black/40
Sheet pad: px-2 pb-2
Group:     overflow-hidden rounded-lg bg-bg-elevated/95 backdrop-blur-xl
Caption:   px-4 pt-3.5 pb-3 text-center text-[13px] text-text-secondary
             border-b border-separator   (title in text-primary font-semibold)
Action:    flex min-h-[57px] w-full items-center justify-center gap-2 text-[20px]
             text-accent   (+ font-semibold for the primary action)
             borders between actions: border-t border-separator
Destructive: text-accent-red
Cancel:    mt-2 min-h-[57px] w-full rounded-lg bg-bg-elevated/95 backdrop-blur-xl
             text-[20px] font-semibold text-accent
```

Actions call server actions and close the sheet:
- **Stop watching** → `updateSeriesStatus(tmdbSeriesId, 'stopped')`
- **Resume / Start watching** → `updateSeriesStatus(tmdbSeriesId, 'watching')`
- **Remove from library** → opens the confirm alert (below)

### Remove confirmation alert — same client island

Centered iOS alert, 270px wide, over the same dimmed backdrop.

```
Backdrop:  fixed inset-0 z-[8] flex items-center justify-center bg-black/40
Dialog:    w-[270px] overflow-hidden rounded-[14px] bg-bg-elevated/95 backdrop-blur-xl text-center
Body:      px-4 pt-5 pb-4.5
Title:     text-[17px] font-semibold text-text-primary
Message:   mt-1 text-[13px] leading-snug text-text-primary
Actions:   flex border-t border-separator
Button:    min-h-[44px] flex-1 text-[17px] text-accent   (divider: border-l border-separator)
Remove:    text-accent-red font-semibold
```

On confirm → `removeSeries(tmdbSeriesId)`, then `router.push('/series')` (or back).

### Stopped state — `src/app/(app)/series/[id]/page.tsx` + new banner

When `detail.status === 'stopped'`, render the **stopped banner in place of**
`ContinueWatchingCard`, and pass a `stopped` flag to `SeriesHero` so the meta line renders the
muted pill instead of the airing status.

Stopped banner (new `src/components/series/StoppedBanner.tsx`, or inline):

```
Container: m-4 flex items-center gap-3 rounded-md bg-bg-secondary p-3.5
Icon dot:  h-9 w-9 shrink-0 rounded-full bg-text-secondary/[.18] text-text-secondary
             flex items-center justify-center   (16×16 square glyph)
Body:      flex-1 min-w-0
Title:     text-[15px] font-semibold text-text-primary   ("You stopped watching")
Sub:       mt-0.5 text-[13px] text-text-secondary   ("Paused on S2 E3. Resume any time.")
Resume:    shrink-0 inline-flex items-center gap-1.5 rounded-full min-h-11 px-4
             text-[15px] font-semibold text-accent bg-accent/[.14]   (≥44px touch target)
             → updateSeriesStatus(tmdbSeriesId, 'watching')
```

Hero "Stopped" pill (in `SeriesHero`, when `stopped`):

```
inline-flex items-center gap-1 rounded-full bg-bg-secondary px-2 py-0.5
  text-[12px] font-semibold text-text-secondary   (11×11 square glyph)
```

## Status colors

Matches DESIGN_SYSTEM.md "Status Badges": `stopped` uses `text-tertiary`/`text-secondary` (muted,
no color), consistent with the pill and banner here. Destructive actions use `accent-red`. The
Resume/Start affordances use `accent`.

## Motion (per DESIGN_SYSTEM.md)

- Action sheet: slide up + spring ease (~300ms); backdrop fades in.
- Alert: quick fade + subtle scale-in.
- On Stop/Resume: the continue card ↔ stopped banner swap can cross-fade.

## Notes for implementation

- The three transitions (`updateSeriesStatus` ×2, `removeSeries`) are all existing server
  actions — no new backend. Wrap calls with the existing error handling; on failure keep the
  sheet open and surface the error (do not optimistically leave a wrong state).
- Keep the sheet trigger + sheet + alert in a single client component; the rest of the detail
  page stays a Server Component.
- No new statuses introduced. `completed` remains computed, not stored.
