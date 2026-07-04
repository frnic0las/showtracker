# Mockups — Series page + Search sheet (issue #25)

Reference mockups for the `/series` page, the add-series search sheet, and the bottom
navigation. Every screen is rendered at a **390px** viewport, in **light + dark** mode via
`prefers-color-scheme`, with **every state**.

Open `index.html` in a browser and toggle your OS appearance to preview dark mode.

These components were built without a design phase (PRs #23 and #24). This mockup is the
source of truth to **audit and correct** the existing implementation — see the
[Audit checklist](#audit-checklist) at the end.

All tokens mirror `src/app/globals.css`. Tailwind class names below are the arbitrary-value
utilities the project already uses (`text-text-primary`, `bg-bg-elevated`, `rounded-md`, …).

---

## 1. Series page — `/series`

Source: `src/app/(app)/series/page.tsx`

### Page shell

| Element      | Spec                                             | Tailwind                                             |
| ------------ | ------------------------------------------------ | ---------------------------------------------------- |
| Page padding | 16px horizontal, 12px top                        | `px-4 pt-3`                                           |
| Header       | title + trigger, space-between, 8px bottom        | `flex items-center justify-between pb-2`             |
| Page title   | Large Title 34 / Bold                            | `text-[34px] font-bold text-text-primary`            |
| "+" trigger  | 44×44 touch target, 28px glyph, accent           | `flex h-11 w-11 items-center justify-center text-accent` |

### Series card (row)

Grouped list: rounded 12px elevated container, **inset** separators (start after the poster).

| Element          | Spec                                                    | Tailwind                                                        |
| ---------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| List container   | elevated bg, 12px radius, clip                          | `rounded-md bg-bg-elevated overflow-hidden`                    |
| Separators       | inset from poster, hairline                             | `divide-y divide-separator` (inset via left margin / pseudo)  |
| Row              | 12px padding, 12px gap, vertically centered             | `flex items-center gap-3 p-3`                                  |
| Poster           | 60×90, 8px radius, cover, gray placeholder              | `h-[90px] w-[60px] shrink-0 rounded-sm object-cover bg-bg-secondary` |
| Title            | Headline 17 / Semibold, truncate                        | `truncate text-[17px] font-semibold text-text-primary`        |
| Status badge     | see [Status badges](#status-badges)                     | —                                                              |
| Progress label   | `S02 — 6/10`, Footnote 13, secondary, tabular nums      | `text-[13px] text-text-secondary tabular-nums`                |
| Progress bar     | 4px track, rounded-full, accent-orange fill             | track `h-1 rounded-full bg-text-secondary/25`, fill `bg-accent-orange` |
| Chevron          | 20px, tertiary text                                     | `text-text-tertiary`                                          |

**Progress fill color** follows status: `watching`/`stopped` → the status color,
`completed` → `accent-green` (full bar). `watchlist`/not-started → 0% width.

### Status badges

Chip: 20px tall, 8px horizontal padding, 8px radius, Caption 12 / Semibold, tinted background.

| Status      | Text color         | Background tint                | Label       |
| ----------- | ------------------ | ------------------------------ | ----------- |
| `watching`  | `accent-orange`    | `accent-orange/14`             | Watching    |
| `stopped`   | `text-secondary`   | `text-secondary/18`            | Stopped     |
| `watchlist` | `accent`           | `accent/14`                    | Watchlist   |
| `completed` | `accent-green`     | `accent-green/14`              | Completed   |

Tailwind (watching): `inline-flex h-5 items-center rounded-sm px-2 text-[12px] font-semibold
text-accent-orange bg-accent-orange/[0.14]`.

### Empty state

Per design system: 48px muted icon + Headline message + CTA button.

| Element   | Spec                                     | Tailwind                                                    |
| --------- | ---------------------------------------- | ---------------------------------------------------------- |
| Container | column, centered, ~72px vertical padding | `flex flex-col items-center gap-3 py-[72px] text-center`   |
| Icon      | 48px, tertiary                           | `h-12 w-12 text-text-tertiary`                             |
| Title     | Headline 17 / Semibold                   | `text-[17px] font-semibold text-text-primary`             |
| Message   | Subheadline 15, secondary, ~260px max    | `max-w-[260px] text-[15px] text-text-secondary`           |
| CTA       | 44px min height, accent fill, white text | `min-h-11 rounded-md bg-accent px-5 text-[17px] font-semibold text-white` |

The CTA opens the search sheet (same handler as the "+" trigger).

### Error state

Centered Subheadline message + a **Retry** link (`text-accent`). Copy: "Could not load your
series. Please try again."

---

## 2. Search sheet — add a series

Sources: `src/components/ui/Sheet.tsx`, `src/components/ui/SearchBar.tsx`,
`src/components/series/SeriesSearchSheet.tsx`, `src/components/series/SeriesSearch.tsx`

### Sheet chrome

| Element    | Spec                                             | Tailwind                                                      |
| ---------- | ------------------------------------------------ | ------------------------------------------------------------ |
| Backdrop   | black 40%, fade 300ms                            | `bg-black/40 transition-opacity duration-300`                |
| Container  | bottom-anchored, 16px top radius, elevated, ≤90% | `max-h-[90%] w-full rounded-t-lg bg-bg-elevated`             |
| Grabber    | 36×5 bar, tertiary, 8px top pad                  | `h-[5px] w-9 rounded-full bg-text-tertiary` in `pt-2`       |
| Title      | centered Headline 17 / Semibold                  | `text-center text-[17px] font-semibold text-text-primary`   |

### Search bar

| Element     | Spec                                              | Tailwind                                                       |
| ----------- | ------------------------------------------------- | ------------------------------------------------------------- |
| Field wrap  | 10px radius, secondary bg, 12px h-pad, 8px gap    | `flex items-center gap-2 rounded-[10px] bg-bg-secondary px-3` |
| Search icon | 16px, tertiary                                    | `h-4 w-4 text-text-tertiary`                                  |
| Input       | Body 17, 44px min height                          | `min-h-11 w-full bg-transparent text-[17px] text-text-primary` |
| Placeholder | tertiary                                          | `placeholder:text-text-tertiary`                             |
| Clear       | 44×44 touch, 20px filled circle glyph             | `h-11 w-11 text-text-tertiary`                               |
| Debounce    | 300ms before firing `onSearch`                    | —                                                             |

### States (one visible at a time, under the search bar)

| State      | Content                                                        | Notes                                                       |
| ---------- | ------------------------------------------------------------- | ----------------------------------------------------------- |
| **Idle**   | One-line hint: "Start typing to search TMDB for a TV series." | Query empty. Avoids a blank sheet.                          |
| **Loading**| Spinner + "Searching…", centered                              | 15px secondary. Spinner = 15px, 2px ring, `text-secondary`. |
| **Results**| List of result rows (below)                                   | —                                                           |
| **No results** | Centered "No series found."                               | 15px secondary.                                             |
| **Error (search)** | Centered "Could not search right now. Please try again." | 15px secondary.                                       |
| **Error (add)**    | Inline red line below the bar                          | `px-4 pb-2 text-[13px] text-accent-red`.                   |

### Result row & Add states

| Element     | Spec                                             | Tailwind                                                 |
| ----------- | ------------------------------------------------ | -------------------------------------------------------- |
| Row         | 16px h-pad, 8px v-pad, 12px gap, full-width tap  | `flex w-full items-center gap-3 px-4 py-2 text-left`    |
| Poster      | 60×90, 8px radius                                | `h-[90px] w-[60px] rounded-sm object-cover`             |
| Title       | Headline 17 / Semibold, truncate                 | `truncate text-[17px] font-semibold text-text-primary` |
| Year        | Footnote 13, secondary                           | `text-[13px] text-text-secondary`                      |
| Add label   | Subheadline 15 / Semibold                        | `text-[15px] font-semibold`                             |

Add-label states:

- **Add** — tappable, `text-accent`.
- **Adding…** — spinner + muted text, `text-text-secondary`; the whole list is disabled while
  one add is pending (`pendingId !== null`).
- **Added** — `text-accent-green`, non-interactive (already tracked or just added).

---

## 3. Bottom navigation

Source: `src/components/ui/BottomNav.tsx`

| Element      | Spec                                                     | Tailwind                                                                 |
| ------------ | ------------------------------------------------------- | ------------------------------------------------------------------------ |
| Bar          | fixed, 49px + safe area, top border, blurred translucent | `fixed inset-x-0 bottom-0 h-[calc(49px+env(safe-area-inset-bottom))] border-t border-separator bg-bg-primary/80 backdrop-blur-[20px]` |
| Tab          | column, centered, 4px gap, 44px min height              | `flex min-h-11 flex-1 flex-col items-center justify-center gap-1`        |
| Icon         | 24×24                                                    | `h-6 w-6`                                                                |
| Label        | Caption 10                                               | `text-[10px] leading-none`                                              |
| Active       | accent color, `aria-current="page"`                     | `text-accent`                                                           |
| Inactive     | secondary text                                          | `text-text-secondary`                                                   |

Tabs, in order: **Series · Movies · Calendar · Profile**.

---

## Audit checklist

Gaps between this design and the current implementation (for the follow-up frontend correction):

- [ ] **Series card** (`series/page.tsx`): add status badge, `S## — x/y` progress label +
      thin bar, and a trailing chevron. Currently renders only title + release year.
- [ ] **Empty state** (`series/page.tsx`): add the 48px muted icon and the primary CTA button.
      Currently a text-only block.
- [ ] **Error state** (`series/page.tsx`): add a Retry affordance.
- [ ] **Idle sheet** (`SeriesSearchSheet.tsx`): add a one-line hint so the empty sheet isn't
      blank.
- [ ] **Loading sheet** (`SeriesSearchSheet.tsx`): pair "Searching…" with a spinner.
- [ ] Bottom nav, search bar, sheet chrome, and Add/Adding…/Added states already match — no
      changes needed beyond the above.

> Note: the series card badge/progress/chevron depend on per-series watched-episode data that
> isn't fetched yet in `series/page.tsx`. Implementing this design requires a query change
> (episode counts + status), tracked as follow-up frontend work — not part of this design issue.
