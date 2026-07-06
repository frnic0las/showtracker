# Design System — iOS Native Aesthetic

## Platform

Mobile-only PWA. Target viewport: 375–430px width. No desktop layout.

## Color Palette

### Light Mode

| Token              | Value     | Usage                              |
| ------------------ | --------- | ---------------------------------- |
| `--bg-primary`     | `#FFFFFF` | Main background                    |
| `--bg-secondary`   | `#F2F2F7` | Grouped section background         |
| `--bg-elevated`    | `#FFFFFF` | Cards, modals, sheets              |
| `--text-primary`   | `#000000` | Headlines, body text               |
| `--text-secondary` | `#3C3C43` | Subtitles, metadata (60% opacity)  |
| `--text-tertiary`  | `#3C3C43` | Placeholders (30% opacity)         |
| `--separator`      | `#3C3C43` | List separators (12% opacity)      |
| `--accent`         | `#007AFF` | Interactive elements, links        |
| `--accent-green`   | `#34C759` | Watched, completed                 |
| `--accent-red`     | `#FF3B30` | Destructive actions                |
| `--accent-orange`  | `#FF9500` | In progress, continuing            |

### Dark Mode

| Token              | Value     | Usage                              |
| ------------------ | --------- | ---------------------------------- |
| `--bg-primary`     | `#000000` | Main background                    |
| `--bg-secondary`   | `#1C1C1E` | Grouped section background         |
| `--bg-elevated`    | `#2C2C2E` | Cards, modals, sheets              |
| `--text-primary`   | `#FFFFFF` | Headlines, body text               |
| `--text-secondary` | `#EBEBF5` | Subtitles, metadata (60% opacity)  |
| `--text-tertiary`  | `#EBEBF5` | Placeholders (30% opacity)         |
| `--separator`      | `#545458` | List separators (65% opacity)      |
| `--accent`         | `#0A84FF` | Interactive elements, links        |
| `--accent-green`   | `#30D158` | Watched, completed                 |
| `--accent-red`     | `#FF453A` | Destructive actions                |
| `--accent-orange`  | `#FF9F0A` | In progress, continuing            |

## Typography

Use system font stack: `-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', system-ui, sans-serif`

| Style        | Size   | Weight   | Usage                          |
| ------------ | ------ | -------- | ------------------------------ |
| Large Title  | 34px   | Bold     | Page titles (Series, Movies)   |
| Title 1      | 28px   | Bold     | Section headers                |
| Title 2      | 22px   | Bold     | Card titles                    |
| Title 3      | 20px   | Semibold | Subsection headers             |
| Headline     | 17px   | Semibold | List item titles               |
| Body         | 17px   | Regular  | Default text                   |
| Callout      | 16px   | Regular  | Supporting text                |
| Subheadline  | 15px   | Regular  | Metadata, secondary info       |
| Footnote     | 13px   | Regular  | Timestamps, tertiary info      |
| Caption 1    | 12px   | Regular  | Badges, tab labels             |
| Caption 2    | 11px   | Regular  | Minimal annotations            |

## Spacing

4px grid system. All spacing values are multiples of 4.

| Token | Value | Usage                         |
| ----- | ----- | ----------------------------- |
| xs    | 4px   | Inline spacing, icon gaps     |
| sm    | 8px   | Compact element spacing       |
| md    | 12px  | Default element spacing       |
| base  | 16px  | Section padding, card padding |
| lg    | 20px  | Between sections              |
| xl    | 24px  | Page margins (horizontal)     |
| 2xl   | 32px  | Between major sections        |
| 3xl   | 40px  | Top/bottom page padding       |

## Border Radius

| Token   | Value | Usage                          |
| ------- | ----- | ------------------------------ |
| sm      | 8px   | Small elements (badges, chips) |
| md      | 12px  | Cards, grouped sections        |
| lg      | 16px  | Modals, sheets                 |
| full    | 9999px| Circular avatars, pills        |

## Component Patterns

### Bottom Navigation

- 3 tabs: Series, Movies, Profile
- Fixed at bottom, 49px height + safe area
- Icons: 24×24px, centered above 10px caption label
- Active tab: accent color. Inactive: secondary text color.
- Subtle top border separator
- `backdrop-filter: blur(20px)` with semi-transparent background

### Grouped List Section (iOS Settings style)

- Rounded container (12px radius) with elevated background
- Section header: footnote style, uppercase, secondary text, left-aligned with 16px padding
- Items: headline text, full-width, 44px minimum height
- Separators: inset from left (16px margin-left), not full-width
- Chevron (›) on right for navigable items

### Series Card

- Poster image (2:3 ratio) on the left, 60×90px
- Title (headline), status badge, progress bar on the right
- Progress: "S02 — 3/8" with a thin bar below
- Tap → series detail page

### Episode Row

- Episode number (caption, muted), episode name (body), air date (footnote)
- Checkmark icon on the right: filled green = watched, outline = unwatched
- Tap checkmark to toggle watched status
- Swipe left for quick actions

### Sheet Modal

- Rises from bottom with spring animation
- Drag handle: 36×5px centered bar, rounded, secondary color
- Dimmed backdrop (black 40% opacity)
- Max height: 90% of viewport
- Used for: search, episode detail, settings panels

### Search Bar

- iOS-style: rounded rect (10px radius), gray background, search icon left, placeholder text
- Sticky at top when scrolling
- Cancel button appears on focus
- Debounce input: 300ms before triggering search

## Touch Targets

- Minimum interactive size: 44×44px (Apple HIG)
- Buttons: 44px height minimum, full-width for primary actions
- List items: 44px minimum height
- Icon buttons: 44×44px touch area (visual icon can be smaller)

## Motion

- Page transitions: horizontal slide (push/pop navigation)
- Sheet open: slide up + spring ease (300ms)
- Toggle watched: scale bounce (200ms) + color fill
- List item appear: staggered fade-in (50ms delay per item, max 10 items)
- Pull-to-refresh: native scroll behavior

## Images

- TMDB poster sizes: `w92`, `w154`, `w185`, `w342`, `w500`, `w780`, `original`
- Use `w185` for list thumbnails, `w342` for detail posters, `w780` for backdrops
- Base URL: `https://image.tmdb.org/t/p/{size}{path}`
- Always use `next/image` with proper width/height for layout stability
- Placeholder: solid gray background matching the image dimensions

### List Thumbnail (canonical)

- **Single canonical size for every poster shown inline in a list row: 60×90px** (2:3 ratio).
- Applies to: series/movie search results, upcoming episode rows, and any future list row
  with a poster. Do not introduce alternate list-thumbnail sizes.
- Source image: `w185`. Radius: `radius-sm` (8px). Missing/loading state: gray
  `bg-bg-secondary` block at the same 60×90 dimensions.
- Detail-page posters (`w342`) and full-bleed grids (`PosterGrid`) are separate concepts and
  are not governed by this size.

## Status Badges

| Status     | Color         | Label       |
| ---------- | ------------- | ----------- |
| watching   | accent-orange | Watching    |
| stopped    | text-tertiary | Stopped     |
| watchlist  | accent        | Watchlist   |
| completed  | accent-green  | Completed   |

A series is "completed" when all episodes of a finished series are watched. This is computed, not stored.

## Empty States

Every list view must have an empty state with:

- Relevant icon (muted, 48px)
- Short message (headline style)
- CTA button if applicable ("Search for a series", "Browse movies")
