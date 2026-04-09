# EstateHub

A proof-of-concept real estate platform for property listings, user memberships, and booking requests.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend/Database**: Supabase (PostgreSQL, Auth, Storage)
- **Package Manager**: npm
- **Routing**: React Router Dom v6
- **Data Fetching**: TanStack Query v5

## Project Structure

- `src/` - Main application source
  - `components/` - Reusable UI components (including `ui/` for shadcn)
  - `hooks/` - Custom React hooks
  - `integrations/supabase/` - Supabase client and generated types
  - `lib/` - Utility functions
  - `pages/` - Top-level page components
  - `App.tsx` - Root component with routing
  - `main.tsx` - Entry point
- `supabase/` - Database migrations and config
- `public/` - Static assets

## Environment Variables

The following secrets are required:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Your Supabase anon/public key

## Development

```bash
npm install
npm run dev
```

The dev server runs on port 5000 at `0.0.0.0`.

## Deployment

Configured as a static site deployment:
- Build command: `npm run build`
- Public directory: `dist`
