# Mockups — Series tab (TV Time model, issue #29)

Redesigns the Series tab around a single question: **what do I need to watch?**
Open `index.html` at a **390px-wide viewport** and toggle your OS appearance to preview
light and dark (both driven by `prefers-color-scheme`, matching `src/app/globals.css`).

Supersedes the status-management design in the closed #27/#28 (Watching / Stopped /
Watchlist / Completed sections with per-card progress bars). This version replaces that
with two sub-tabs, a poster grid, and a proper series detail page.

## Screens & states covered

| #  | Screen | State |
| -- | ------ | ----- |
| 1  | Series › To watch | Populated — continue-watching grid + watchlist + archive link |
| 2  | Series › To watch | Caught up — inline "all caught up" state, watchlist still shown |
| 3  | Series › To watch | Empty (first run) — no series tracked, CTA |
| 4  | Series › To watch | Loading — skeleton poster grid |
| 5  | Series › To watch | Error — Supabase load failed, retry |
| 6  | Series › Upcoming | Populated — grouped Today / Tomorrow / This week / Later, countdown |
| 7  | Series › Upcoming | Empty — no scheduled episodes |
| 8  | Series detail | In progress — backdrop, continue-watching card, season accordions |
| 9  | Series detail | Completed — all watched, "finished" state, no continue card |
| 10 | Series detail | Loading — backdrop + skeleton accordions |
| 11 | Series detail | Error — TMDB details failed, retry |

## What changes vs. the current implementation

The shipped list (`src/app/(app)/series/page.tsx`) is a flat poster+title+year list.
This design reframes the tab entirely:

1. **Two sub-tabs** (segmented control): **To watch** (default) and **Upcoming**.
2. **Continue watching** — a **poster grid** (not a list) of started series with unwatched
   episodes, each poster carrying an unwatched-count badge and a "Next: S_ E_" caption.
3. **Watchlist** — saved-but-not-started series, as a second poster grid below.
4. **Stopped & completed** are removed from the main flow — reachable only via a discreet
   archive link (not built here; out of scope per the issue).
5. **Upcoming** — next air dates for **started series only** (watchlist excluded), grouped
   by proximity with a day countdown.
6. **Series detail page** — backdrop hero, a highlighted next-unwatched "Continue watching"
   card, and season accordions with per-season progress (`8/8`, green check when complete).

The bottom nav is unchanged (Series / Movies / Calendar / Profile). The **Calendar** tab
and the in-Series **Upcoming** sub-tab are deliberately separate surfaces.

---

## Component mapping → Tailwind

Tokens resolve to the `bg-*`, `text-*`, `accent*`, `separator`, and `radius-*` theme keys
already defined in `globals.css` (`@theme inline`). The mockup uses plain CSS with the same
variables; the Tailwind equivalents below are what the React components should use.

> **Radius classes.** `globals.css` overrides the radius scale via `@theme`, so in this
> project `rounded-sm` = **8px**, `rounded-md` = **12px**, `rounded-lg` = **16px** (not the
> vanilla Tailwind defaults). The `radius-full` pill is `rounded-full`. Classes below use
> these project tokens; the `rounded-[6px]` on the segmented pill is an intentional off-scale
> nested inset.

### Page header — `src/app/(app)/series/page.tsx`

Already implemented, keep as-is:

```
<header class="flex items-center justify-between px-4 pt-3 pb-1.5">
  <h1 class="text-[34px] font-bold tracking-tight text-text-primary">Series</h1>
  <SeriesSearch … />   // 44×44 "+" button, text-accent
</header>
```

### Sub-tab segmented control (new) — `components/ui/SegmentedControl.tsx`

Client component (holds active-tab state; drives which sub-view renders).

```
<div class="mx-4 mt-1 mb-2 flex gap-0.5 rounded-sm bg-bg-secondary p-0.5">
  <button class="min-h-10 flex-1 rounded-[6px] py-2 text-[13px] font-semibold
                 bg-bg-elevated text-text-primary shadow-sm">To watch</button>
  <button class="min-h-10 flex-1 rounded-[6px] py-2 text-[13px] font-semibold
                 text-text-primary">Upcoming</button>
</div>
```

Active pill = `bg-bg-elevated` + subtle shadow. In light mode elevated == primary (both
white), so keep a hairline shadow so the pill stays visible. Buttons are `min-h-10` (40px)
inside a `p-0.5` track → the control clears the 44px touch minimum.

### Section title (new)

```
<h2 class="px-4 pt-4 pb-2 text-[20px] font-semibold tracking-tight text-text-primary">
  Continue watching
</h2>
```

`Watchlist · 3` uses a trailing `<span class="font-semibold text-text-secondary">· 3</span>`.

### Poster grid + grid item (new) — `components/series/PosterGrid.tsx` + `SeriesPosterCard.tsx`

```
<div class="grid grid-cols-3 gap-x-3 gap-y-4 px-4">
  <a class="min-w-0">
    <div class="relative aspect-[2/3] overflow-hidden rounded-md bg-bg-secondary">
      <Image … class="object-cover" />
      <span class="absolute right-2 top-2 flex h-[22px] min-w-[22px]
                   items-center justify-center rounded-full bg-accent px-1.5
                   text-xs font-bold text-white shadow">7</span>   {/* unwatched count */}
    </div>
    <p class="mt-2 truncate text-[13px] font-semibold text-text-primary">Severance</p>
    <p class="truncate text-xs text-text-secondary">Next: S2 E3</p>
  </a>
</div>
```

- Poster `aspect-[2/3]`, `rounded-md` (12px). TMDB `w185`.
- **Count badge** = `bg-accent` pill, `min-w-[22px] h-[22px]`, only when unwatched > 0.
- Watchlist items reuse the same card **without** the badge; subcaption shows total episode
  count (`8 episodes`).
- The whole card is the ≥44px tap target → series detail.

### Inline "caught up" state (new)

Sits under the "Continue watching" title when there's nothing to catch up on, but the
watchlist section still renders below it.

```
<div class="flex flex-col items-center gap-2 px-10 pb-2 pt-7 text-center">
  <CheckCircleIcon class="h-10 w-10 text-accent-green" />
  <p class="text-[17px] font-semibold text-text-primary">You're all caught up</p>
  <p class="max-w-[240px] text-[15px] leading-snug text-text-secondary">No unwatched
     episodes on the shows you're following.</p>
</div>
```

### Archive link (new) — discreet entry to stopped + completed

```
<a class="mx-4 mt-6 mb-1 flex min-h-[44px] items-center justify-between rounded-md
          bg-bg-elevated px-4 py-3 text-[15px] text-text-primary">
  <span>Stopped &amp; completed
    <span class="mt-0.5 block text-[13px] text-text-secondary">Shows you finished or set aside</span>
  </span>
  <ChevronRightIcon class="h-4 w-2.5 shrink-0 text-text-tertiary" />
</a>
```

The archive screen itself is out of scope for this issue (flagged below).

### Upcoming — grouped list (new) — `components/series/UpcomingList.tsx`

```
<h3 class="px-4 pb-2 pt-4 text-[13px] uppercase tracking-wide text-text-secondary">Tomorrow</h3>
<div class="mx-4 overflow-hidden rounded-md bg-bg-elevated">
  <a class="relative flex items-center gap-3 px-3 py-2">
    <div class="h-[78px] w-[52px] shrink-0 overflow-hidden rounded-sm bg-bg-secondary">
      <Image … class="object-cover" />
    </div>
    <div class="min-w-0 flex-1">
      <p class="truncate text-[17px] font-semibold text-text-primary">Severance</p>
      <p class="truncate text-[13px] text-text-secondary">S2 E4 · Woe's Hollow</p>
    </div>
    <div class="min-w-[52px] shrink-0 text-center">
      <p class="text-[22px] font-bold leading-none text-accent-orange">1</p>
      <p class="mt-0.5 text-[11px] uppercase tracking-wide text-text-secondary">day</p>
    </div>
  </a>
</div>
```

- Groups: **Today** / **Tomorrow** / **This week** / **Later**. Bucket by days-until-air;
  hide empty groups. Countdown label pluralises (`day` / `days`).
- **Today** rows drop the numeric countdown for a single `text-accent-orange` "Today" label
  (`text-[15px] font-bold`) in the same right-hand column — see frame 6.
- Rows use the inset separator (`left-[76px]`) between siblings — same pattern as the
  existing series cards.
- **Watchlist series are excluded** — Upcoming is started-series only, per the issue.

### Series detail page (new) — `src/app/(app)/series/[id]/page.tsx`

Server Component for the shell + data; the accordions and check toggles are client islands.

**Hero / backdrop**

```
<div class="relative flex h-[220px] items-end overflow-hidden bg-bg-secondary">
  <Image … class="object-cover" />                              {/* TMDB w780 backdrop */}
  <div class="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/60 to-transparent" />
  <button class="absolute left-3 top-2 flex h-11 w-11 items-center justify-center
                 rounded-full bg-bg-primary/55 text-text-primary backdrop-blur-md"
          aria-label="Back">…</button>
  <div class="relative z-[2] w-full px-4 pb-4">
    <h1 class="text-[28px] font-bold tracking-tight text-text-primary">Severance</h1>
    <p class="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-text-secondary">
      <span>2 seasons</span><span class="opacity-50">·</span>
      <span class="inline-flex items-center gap-1 font-semibold text-accent-orange">
        <DotIcon/>Returning</span><span class="opacity-50">·</span>
      <span>Apple TV+</span>
    </p>
  </div>
</div>
```

Metadata: seasons count · status (`Returning` = accent-orange, `Ended` = text-secondary) ·
network.

**Continue watching card** (next unwatched episode)

Sits **directly beneath the hero — no section title.** The `Next up` kicker labels the card,
so a separate "Continue watching" header would be redundant; the card is the prominent first
element on the page.

```
<div class="m-4 flex items-center gap-3 rounded-md border border-separator bg-bg-elevated p-3">
  <div class="h-[60px] w-[104px] shrink-0 overflow-hidden rounded-sm bg-bg-secondary">
    <Image … class="object-cover" />                            {/* episode still, 16:9 */}
  </div>
  <div class="min-w-0 flex-1">
    <p class="text-[11px] font-bold uppercase tracking-wide text-accent">Next up</p>
    <p class="mt-0.5 truncate text-[15px] font-semibold text-text-primary">S2 E3 · Who Is Alive?</p>
    <p class="mt-0.5 text-xs text-text-secondary">Aired Feb 7, 2025</p>
  </div>
  <WatchToggle … />                                              {/* round check, 44px hit area */}
</div>
```

Hidden entirely on a completed series (screen 9) → replaced by a "You finished this series"
inline state. The `Seasons` header below keeps its section title.

**Season accordions** — `components/series/SeasonAccordion.tsx` (client)

```
<div class="mb-2 overflow-hidden rounded-md bg-bg-elevated">
  <button class="flex min-h-[52px] w-full items-center gap-2 px-3">
    <span class="flex-1 text-left text-[17px] font-semibold text-text-primary">Season 2</span>
    <span class="text-[15px] font-semibold tabular-nums text-text-secondary">2/10</span>
    {/* when complete: text-accent-green + a CheckCircle icon */}
    <ChevronRightIcon class="h-4 w-2.5 text-text-tertiary transition-transform data-[open]:rotate-90" />
  </button>
  <div class="border-t border-separator">…episode rows…</div>
</div>
```

Season header progress: `watched/total`. When `watched === total`, colour it
`text-accent-green` **and** show a green `CheckCircle`.

**Episode row** — `components/series/EpisodeRow.tsx`

```
<div class="relative flex items-center gap-3 px-3 py-2">
  <span class="w-6 shrink-0 text-[13px] font-semibold tabular-nums text-text-secondary">E3</span>
  <div class="min-w-0 flex-1">
    <p class="truncate text-[17px] text-text-primary [.unwatched]:font-semibold">Who Is Alive?</p>
    <p class="mt-0.5 text-[13px] text-text-secondary">Jan 31, 2025</p>   {/* air date; upcoming → text-accent-orange */}
  </div>
  <WatchToggle watched={false} />
</div>
```

Inset separators (`left-3 right-3`) between rows. Unwatched episode titles are bolded so the
eye lands on what's left; future/unaired air dates use `text-accent-orange` ("Airs tomorrow").

### Watch toggle (round check) — `components/ui/WatchToggle.tsx` (client)

```
<button class="-m-2 mr-[-8px] flex h-11 w-11 items-center justify-center" aria-label="Mark watched">
  <span class="flex h-7 w-7 items-center justify-center rounded-full border-2
               border-text-tertiary text-transparent
               data-[watched]:border-accent-green data-[watched]:bg-accent-green data-[watched]:text-white">
    <CheckIcon class="h-[15px] w-[15px]" />
  </span>
</button>
```

- Visual circle 28px; the button provides the **44×44 touch target** (negative margin keeps
  layout tight).
- Watched = filled `accent-green`; unwatched = 2px `text-tertiary` outline.
- Toggling calls the watch/unwatch Server Action; DESIGN_SYSTEM motion spec = scale bounce
  200ms + colour fill.

### Bottom nav — `components/ui/BottomNav.tsx`

Unchanged. Series tab active (`text-accent`), others `text-text-secondary`.

---

## Design tokens used

| Element | Token |
| ------- | ----- |
| Screen / grid poster bg | `bg-primary`, `bg-secondary` |
| Cards, sheets, accordions, active pill | `bg-elevated` |
| Titles / body | `text-primary` |
| Metadata / captions / countdown label | `text-secondary` |
| Air dates, poster placeholder text, outline check | `text-tertiary` |
| Count badge, "Next up" kicker, back button | `accent` |
| Countdown number, "Returning" status, upcoming air date | `accent-orange` |
| Watched check, complete-season progress + check | `accent-green` |
| Error icon | `text-tertiary` (icon) / `accent-red` (reserved for inline errors) |
| Card / list radius | `radius-md` (12px) |
| Small poster / still radius | `radius-sm` (8px) |
| Separators (inset) | `separator` |

## Touch targets

- Segmented-control buttons: 40px buttons + 2px track padding → 44px control.
- Poster grid item: whole card is the link, well over 44px.
- Watch toggle: 28px visual circle inside a 44×44 button (`.check-hit`).
- Back button: 44×44 (translucent 44px circle over the backdrop).
- Accordion header: `min-h-[52px]`. Upcoming rows / archive link: `min-h-[44px]`.

## Notes & follow-ups (reconcile before implementation)

1. **`prefers-color-scheme` only.** Mockup follows the system theme like the shipped app.
   No in-app theme toggle exists yet — out of scope here.
2. **Archive screen not designed.** The "Stopped & completed" link is a placeholder; the
   destination screen is explicitly out of scope for #29 ("not a priority") and needs its
   own issue.
3. **Backend dependencies.** Continue-watching (unwatched count + next episode), season
   progress, and Upcoming countdowns all need episode-level watch state and TMDB air dates.
   Those queries aren't in the current list-page data path — same gap flagged in the closed
   #27/#28. Needs a backend task before this can be wired.
4. **Upcoming vs. Calendar tab.** They overlap conceptually. This issue keeps them separate
   (Upcoming = started series only, inside Series; Calendar = full bottom-nav surface).
   Worth confirming the Calendar tab's distinct scope when it's designed.
5. **Upcoming loading / error states** are not drawn as separate frames — they reuse the
   To-watch treatments: the skeleton (rendered as list rows instead of grid cells) and the
   same full-screen error state + retry. Only Upcoming's distinct *empty* state (frame 7) is
   shown. Flagged so the implementer wires the shared components rather than assuming bespoke ones.
6. **Light-mode orange contrast.** `accent-orange` (#FF9500) is the design-system colour for
   "in progress / continuing", used here for the "Returning" status, the upcoming air-date
   line, and the countdown number. At small sizes on white it is below WCAG AA (~2.2:1) — the
   same tension #28 flagged for the `stopped` badge. It is always paired with an icon, bold
   weight, or a large numeral to compensate, but a token-level fix (darker orange for text, or
   restricting orange to fills/large numerals) is a system-wide decision worth making once.
7. **Placeholders.** Posters/backdrops/stills are gray design-system fallbacks in this
   self-contained file; the app loads real TMDB images (`w185` posters, `w780` backdrops).
   The Upcoming poster is 52×78 (2:3 at a list scale — the height is geometrically fixed by
   the width, not a grid value).

Reviewed by the ui-designer agent for design-system coherence.
