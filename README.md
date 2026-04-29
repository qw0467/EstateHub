# EstateHub Qatar

**Software Programming – Group Project**

EstateHub is a real estate platform for the Qatari property market, covering property discovery, membership-gated exclusive listings, a booking and offer system, a seller portal, and a full admin dashboard.

Built with React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, and Supabase.

---

## Features

### Buyers, Visitors & Sellers
- Browse property listings with filters for price, type, location, bedrooms, and bathrooms
- View detailed property pages with gallery, features, and contact options
- Book property viewings by selecting available date and time slots
- Submit purchase offers on properties
- Save favourite properties to a personal wishlist
- Defaults all users to Buyers and Sellers
- Create, edit, and delete property listings from the Profile dashboard
- View and manage incoming viewing enquiries from buyers
- Mark listings as available, under offer, or sold

### Membership Tiers

| Plan | Price | Benefits |
|---|---|---|
| Free | QAR 0 | Browse public listings, basic enquiries |
| Monthly Premium | QAR 360 / month | Exclusive listings, priority support, VIP previews, market insights, concierge services |
| Yearly Premium | QAR 3,640 / year | All Monthly benefits at a discounted rate |

Premium members unlock the **Exclusive Listings** portal — high-end properties not visible to free users. Membership gates update immediately after purchase without requiring re-login.


### Admin Panel (`/admin`)
- Manage users: view roles, suspend accounts
- Manage properties: approve or remove listings
- Monitor all bookings and memberships across the platform

### Test Accounts 
- Admin : *****@gmail.com / Password: *****123 
- Sample (Basic Account): sample@gmail.com / Password: Sample123

---

## Pages

| Route | Page |
|---|---|
| `/` | Landing page with hero and featured listings |
| `/properties` | Search and browse all properties |
| `/property/:id` | Property detail view |
| `/exclusive` | Members-only luxury listings |
| `/booking/:id` | Viewing and offer booking engine |
| `/membership` | Pricing table and subscription management |
| `/profile` | User dashboard — appointments, listings, enquiries |
| `/admin` | Admin panel (admin role required) |
| `/auth` | Login and sign-up |
| `/terms` | Terms and conditions |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS + shadcn/ui (Radix UI) |
| Backend / DB | Supabase (PostgreSQL + GoTrue Auth + PostgREST) |
| Data fetching | TanStack Query (React Query) |
| Forms | React Hook Form + Zod |
| Date handling | date-fns |
| Icons | Lucide React |
| Email support | EmailJS |

---

## Project Structure

```
src/
├── components/
│   ├── ui/               # shadcn/ui primitives (Button, Card, Dialog, etc.)
│   ├── ListingForm.tsx   # Add / edit property form for sellers
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── PaymentModal.tsx  # Simulated card payment with Luhn validation
│   ├── PropertyCard.tsx
│   └── ProtectedRoute.tsx
├── contexts/
│   └── AuthContext.tsx   # Global auth state, role gates, membership state
├── lib/
│   └── utils.ts          # Shared helpers: formatPrice, statusVariant, cn
├── pages/
│   ├── Index.tsx
│   ├── Properties.tsx
│   ├── PropertyDetail.tsx
│   ├── Exclusive.tsx
│   ├── Booking.tsx
│   ├── Membership.tsx
│   ├── Profile.tsx
│   ├── Admin.tsx
│   ├── Auth.tsx
│   └── Terms.tsx
supabase/
└── migrations/           # SQL migration files
```

---

## Database Schema

| Table | Purpose |
|---|---|
| `profiles` | Extends auth users with display name, bio, phone, role |
| `properties` | Listings: price, location, type, status, exclusive flag |
| `memberships` | User subscription tier and expiry date |
| `bookings` | Viewing requests and purchase offers |

### Security
- RLS policies on all tables — users can only read and write their own data
- `unique_property_slot` constraint prevents double-booking the same property at the same time slot
- `unique_user_membership` constraint enforces one active membership record per user
- Admin role is stored in Supabase `app_metadata` (JWT-embedded) — it cannot be self-assigned by a user or overwritten by a database trigger
- RLS admin policies read from the JWT, not the `profiles` table

---

## Getting Started

### Prerequisites

Node.js v18 or higher — download from https://nodejs.org/

Verify installation:
```bash
node -v
npm -v
```

### Install dependencies

```bash
npm install
```

### Configure environment variables

Create a `.env` file at the project root:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
VITE_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
```

Never commit `.env` to version control.

### Run the development server

```bash
npm run dev
```

---

## Database Setup (Supabase)

1. Open the Supabase Dashboard and go to the SQL Editor
2. Run each `.sql` file from `supabase/migrations/` in order
3. This creates all tables, RLS policies, and constraints

---

## Roles & Access

| Role | How it is set | Access level |
|---|---|---|
| `free` | Default on sign-up | Public listings, basic booking |
| `member` | Membership purchase | + Exclusive listings and premium features |
| `seller` | Admin assignment | + Create and manage property listings |
| `admin` | Supabase `app_metadata` | Full admin panel |

---

## Known Limitations

- **Payment is simulated.** The payment modal validates card numbers using the Luhn algorithm but does not connect to a real payment processor. Membership is written to the database client-side after the card check. A production build should replace this with a server-side Supabase Edge Function and a real provider such as Stripe.
- The `seller` role must be assigned manually by an admin through the admin panel or Supabase dashboard.
- EmailJS credentials must be configured in environment variables for the support contact form to send emails in production.

---

## Team

**Group 2**

- Muhammad Qasim
- Amir Radwani
- Faisal
- Assad

Support email: estatehubqa@gmail.com

---

Academic submission – not licensed for commercial use.
