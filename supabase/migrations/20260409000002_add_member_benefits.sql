-- Add is_vip_preview and listed_at columns to properties
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS is_vip_preview boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS listed_at timestamptz DEFAULT now();

-- Backfill listed_at from created_at for existing rows
UPDATE public.properties SET listed_at = created_at WHERE listed_at IS NULL;

-- Add is_priority flag to bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS is_priority boolean DEFAULT false;

-- -----------------------------------------------------------------------
-- Helper: has_yearly_membership() — used in yearly-only RLS policies
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_yearly_membership()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memberships
    WHERE user_id = auth.uid()
    AND tier = 'yearly'
    AND status = 'active'
    AND (end_date IS NULL OR end_date > now())
  )
$$;

-- -----------------------------------------------------------------------
-- Early-access listing visibility enforcement
-- Replace the open "anyone can view" policy with tier-aware policies so
-- that listings added within the past 7 days are only visible to members.
-- -----------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view non-exclusive available properties" ON public.properties;
DROP POLICY IF EXISTS "Monthly members can view exclusive non-VIP properties" ON public.properties;
DROP POLICY IF EXISTS "Yearly members can view VIP preview properties" ON public.properties;

-- Public users and free-tier see non-exclusive, non-VIP, available properties
-- that were listed MORE THAN 7 days ago (no early access).
CREATE POLICY "Public can view non-exclusive available properties"
  ON public.properties FOR SELECT
  USING (
    (
      status = 'available'
      AND is_exclusive = false
      AND (is_vip_preview = false OR is_vip_preview IS NULL)
      AND (listed_at IS NULL OR listed_at <= now() - interval '7 days')
    )
    OR auth.uid() = agent_id
    OR auth.uid() = seller_id
  );

-- Monthly+ members get early access to all non-exclusive, non-VIP available properties.
CREATE POLICY "Members can view all non-exclusive non-VIP available properties"
  ON public.properties FOR SELECT
  USING (
    status = 'available'
    AND is_exclusive = false
    AND (is_vip_preview = false OR is_vip_preview IS NULL)
    AND EXISTS (
      SELECT 1 FROM public.memberships
      WHERE user_id = auth.uid()
      AND tier IN ('monthly', 'yearly')
      AND status = 'active'
      AND (end_date IS NULL OR end_date > now())
    )
  );

-- Replace the existing "Members can view exclusive properties" policy to
-- restrict monthly members to non-VIP exclusive properties only.
DROP POLICY IF EXISTS "Members can view exclusive properties" ON public.properties;

CREATE POLICY "Monthly members can view exclusive non-VIP properties"
  ON public.properties FOR SELECT
  USING (
    is_exclusive = true
    AND status = 'available'
    AND EXISTS (
      SELECT 1 FROM public.memberships
      WHERE user_id = auth.uid()
      AND tier IN ('monthly', 'yearly')
      AND status = 'active'
      AND (end_date IS NULL OR end_date > now())
    )
  );

CREATE POLICY "Yearly members can view VIP preview properties"
  ON public.properties FOR SELECT
  USING (
    is_vip_preview = true
    AND status = 'available'
    AND public.has_yearly_membership()
  );

-- -----------------------------------------------------------------------
-- Priority booking enforcement via trigger
-- Any user can schedule a regular viewing, but is_priority = true requires
-- an active monthly or yearly membership — enforced at the database level.
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_priority_booking_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_priority = true THEN
    IF NOT public.has_active_membership(NEW.user_id) THEN
      RAISE EXCEPTION 'Priority bookings require an active monthly or yearly membership';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_priority_booking_membership
  BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.check_priority_booking_membership();

-- -----------------------------------------------------------------------
-- concierge_bookings table (yearly-tier feature)
-- INSERT, SELECT, and UPDATE are enforced at the DB level:
-- only yearly members may create or modify concierge bookings.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.concierge_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  scheduled_at timestamptz NOT NULL,
  notes text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.concierge_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Yearly members can view their own concierge bookings"
  ON public.concierge_bookings FOR SELECT
  USING (auth.uid() = user_id AND public.has_yearly_membership());

CREATE POLICY "Yearly members can insert their own concierge bookings"
  ON public.concierge_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.has_yearly_membership());

CREATE POLICY "Yearly members can update their own concierge bookings"
  ON public.concierge_bookings FOR UPDATE
  USING (auth.uid() = user_id AND public.has_yearly_membership())
  WITH CHECK (auth.uid() = user_id AND public.has_yearly_membership());

CREATE POLICY "Admins can manage all concierge bookings"
  ON public.concierge_bookings FOR ALL
  USING (public.is_admin());

CREATE TRIGGER update_concierge_bookings_updated_at
  BEFORE UPDATE ON public.concierge_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- -----------------------------------------------------------------------
-- support_requests table (monthly+ feature)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  full_name text NOT NULL,
  query text NOT NULL,
  contact_method text NOT NULL CHECK (contact_method IN ('email', 'phone', 'whatsapp')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their own support requests"
  ON public.support_requests FOR SELECT
  USING (auth.uid() = user_id AND public.has_active_membership(auth.uid()));

CREATE POLICY "Members can insert their own support requests"
  ON public.support_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.has_active_membership(auth.uid()));

CREATE POLICY "Admins can manage all support requests"
  ON public.support_requests FOR ALL
  USING (public.is_admin());

-- -----------------------------------------------------------------------
-- events table (yearly-tier only visibility)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  location text,
  event_date timestamptz NOT NULL,
  max_attendees integer,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Only yearly members (and admins) can see events
CREATE POLICY "Yearly members can view events"
  ON public.events FOR SELECT
  USING (public.has_yearly_membership());

CREATE POLICY "Admins can manage events"
  ON public.events FOR ALL
  USING (public.is_admin());

-- -----------------------------------------------------------------------
-- event_registrations table (yearly-tier only)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Yearly members can view their own event registrations"
  ON public.event_registrations FOR SELECT
  USING (auth.uid() = user_id AND public.has_yearly_membership());

CREATE POLICY "Yearly members can insert their own event registrations"
  ON public.event_registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.has_yearly_membership());

CREATE POLICY "Yearly members can delete their own event registrations"
  ON public.event_registrations FOR DELETE
  USING (auth.uid() = user_id AND public.has_yearly_membership());

-- -----------------------------------------------------------------------
-- Flag existing exclusive properties as VIP preview
-- -----------------------------------------------------------------------
UPDATE public.properties SET is_vip_preview = true WHERE is_exclusive = true;

-- -----------------------------------------------------------------------
-- Sample networking events
-- -----------------------------------------------------------------------
INSERT INTO public.events (title, description, location, event_date, max_attendees)
VALUES
  (
    'Luxury Property Networking Evening',
    'An exclusive evening for yearly members to connect with top real estate professionals, developers, and high-net-worth investors over a curated fine-dining experience.',
    'Grand Hyatt Doha, Pearl Ballroom',
    now() + interval '14 days',
    80
  ),
  (
    'Real Estate Investment Masterclass',
    'Learn advanced investment strategies for the Qatari and GCC property markets from industry-leading economists and portfolio managers.',
    'Four Seasons Hotel, Doha',
    now() + interval '28 days',
    50
  ),
  (
    'VIP New Development Launch',
    'Be the first to preview and reserve units in our newest ultra-luxury residential development before it opens to the public.',
    'EstateHub Premium Showroom, West Bay',
    now() + interval '42 days',
    40
  ),
  (
    'Off-Plan Opportunities Summit',
    'Explore curated off-plan investment opportunities across Doha, Lusail, and The Pearl with exclusive member pricing.',
    'St. Regis Hotel, Doha',
    now() + interval '60 days',
    100
  );
