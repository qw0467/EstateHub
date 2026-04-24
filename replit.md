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
    - `Navbar.tsx` - Shared sticky nav; shows "My Profile" for logged-in users; "Admin" for admins
    - `ProtectedRoute.tsx` - Route guard accepting a `roles: UserRole[]` array
    - `ListingForm.tsx` - Create/edit property listing form (used in Profile page)
  - `contexts/AuthContext.tsx` - Global auth context (user, role, membership, loading)
  - `hooks/` - Custom React hooks
  - `integrations/supabase/` - Supabase client and generated types
  - `lib/` - Utility functions
  - `pages/` - Top-level page components
    - `Admin.tsx` - Admin dashboard (Users/Properties/Bookings/Memberships tabs)
    - `Auth.tsx` - Sign-in / Sign-up with: "Forgot password?" flow (Supabase resetPasswordForEmail), T&C scroll-to-accept on sign-up
    - `ResetPassword.tsx` - Handles Supabase password-reset email link; lets user set new password
    - `Terms.tsx` - Full EstateHub Terms & Conditions page (14 sections, governed by English law)
    - `Contact.tsx` - Contact Us page with form (name, email, subject dropdown, message) + office details
    - `Profile.tsx` - User profile with two tabs: My Purchases + My Listings (create/edit/delete)
    - `Members.tsx` - Member benefits portal (7 tabs; requires monthly/yearly membership)
    - `Footer.tsx` component - Site-wide dark footer (Explore, Support, Account columns; T&C + Contact links)
  - `App.tsx` - Root component with routing
  - `main.tsx` - Entry point
- `supabase/migrations/` - Database migration SQL files
- `public/` - Static assets

## Routes

| Path | Access | Description |
|---|---|---|
| `/` | Public | Home page |
| `/properties` | Public | Property listings |
| `/property/:id` | Public | Property detail |
| `/exclusive` | Public | Exclusive listings (members see full; others see teaser) |
| `/membership` | Public | Membership plans |
| `/auth` | Public | Sign in / sign up |
| `/booking/:id` | Auth | Book a property |
| `/profile` | Auth (any) | User profile – purchases + listings management |
| `/admin` | Admin only | Admin dashboard |

## Database Migrations

All 6 migrations in `supabase/migrations/` must be applied via Supabase Dashboard → SQL Editor
in filename order. The first 3 (2025-10 dates) were applied at project creation. The remaining
3 must be applied manually:

1. `20260409000000_add_role_system.sql` — user_role enum, role/is_suspended on profiles,
   get_current_user_role() / is_admin() RPCs, privilege-escalation trigger, admin RLS policies.
2. `20260409000001_add_seller_system.sql` — bio on profiles, seller_id on properties,
   RLS INSERT policy allows any authenticated user (seller_id = auth.uid()).
3. `20260409000002_add_member_benefits.sql` — is_vip_preview/listed_at on properties,
   has_yearly_membership() function, concierge_bookings, support_requests, events,
   event_registrations tables with RLS, sample events.

After applying all migrations, set the first admin user:
```sql
UPDATE profiles SET role = 'admin' WHERE id = '<your-user-id>';
```

**Known RLS fix**: If the "Sellers can create listings" policy was applied with a role restriction,
run this to fix it so any authenticated user can create listings:
```sql
DROP POLICY IF EXISTS "Sellers can create listings" ON public.properties;
CREATE POLICY "Sellers can create listings"
  ON public.properties FOR INSERT
  WITH CHECK (auth.uid() = seller_id);
```

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
