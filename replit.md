# EstateHub Qatar

A comprehensive real estate platform for the Qatari property market.

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite (port 5000, host 0.0.0.0)
- **Styling**: Tailwind CSS + shadcn/ui (Radix UI primitives)
- **Backend/Database**: Supabase (PostgreSQL + GoTrue Auth + PostgREST)
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **Package Manager**: npm

## Project Structure

- `src/` - Core application code
  - `components/` - UI components (includes `ui/` for shadcn/ui)
  - `contexts/` - React Contexts (AuthContext for auth/roles/membership)
  - `hooks/` - Custom React hooks
  - `integrations/supabase/` - Supabase client and TypeScript types
  - `lib/` - Utility functions
  - `pages/` - Route-level components
- `supabase/` - Database migrations and config
- `public/` - Static assets

## Key Features

- Property listings with filtering and search
- Role-based access: Free, Member, Seller, Admin
- Exclusive listings for Premium members (QAR 360/mo)
- Viewing appointment booking
- Purchase offer submission
- Seller dashboard for listing management
- Admin dashboard at `/admin`

## Environment Variables

- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase publishable key
- `VITE_SUPABASE_PROJECT_ID` - Supabase project ID

## Development

```bash
npm install
npm run dev
```

App runs on port 5000.
