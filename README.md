# ShowTracker

Mobile-first PWA to track TV series (episode by episode) and movies. Built as a replacement for TV Time, focused on two things: what you've watched, and what's coming next.

## Stack

- **Next.js 15** (App Router) on **Vercel**
- **Supabase** (PostgreSQL + Auth + RLS)
- **TMDB API** for series/movie metadata
- **Tailwind CSS** with iOS-native design

## Getting Started

```bash
# Clone
git clone git@github.com:frnic0las/showtracker.git
cd showtracker

# Install
pnpm install

# Configure
cp .env.local.example .env.local
# Fill in Supabase and TMDB credentials

# Run Supabase migrations
# (paste SQL from docs/DATABASE.md into Supabase SQL editor)

# Dev
pnpm dev
```

## Import from TV Time

See [docs/IMPORT.md](docs/IMPORT.md) for the migration guide.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for decisions and API routes.

## Design System

See [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) for UI tokens and patterns.

## License

AGPL-3.0
