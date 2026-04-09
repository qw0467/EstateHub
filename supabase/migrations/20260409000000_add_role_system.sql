-- Create user_role enum
CREATE TYPE user_role AS ENUM ('free', 'seller', 'member', 'admin');

-- Add role and is_suspended columns to profiles
ALTER TABLE public.profiles
ADD COLUMN role user_role DEFAULT 'free' NOT NULL,
ADD COLUMN is_suspended boolean DEFAULT false NOT NULL;

-- Function to get the current user's role (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    'free'::user_role
  )
$$;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT get_current_user_role() = 'admin'
$$;

-- Admins can update any profile (role, suspension, etc.)
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (is_admin());

-- Admins can view all bookings
CREATE POLICY "Admins can view all bookings"
  ON public.bookings FOR SELECT
  USING (is_admin());

-- Admins can update all bookings
CREATE POLICY "Admins can update all bookings"
  ON public.bookings FOR UPDATE
  USING (is_admin());

-- Admins can view all memberships
CREATE POLICY "Admins can view all memberships"
  ON public.memberships FOR SELECT
  USING (is_admin());

-- Admins can update all memberships
CREATE POLICY "Admins can update all memberships"
  ON public.memberships FOR UPDATE
  USING (is_admin());

-- Admins can view all properties (including pending/sold and exclusive)
CREATE POLICY "Admins can view all properties"
  ON public.properties FOR SELECT
  USING (is_admin());

-- Admins can update any property
CREATE POLICY "Admins can update all properties"
  ON public.properties FOR UPDATE
  USING (is_admin());

-- Admins can delete any property
CREATE POLICY "Admins can delete any property"
  ON public.properties FOR DELETE
  USING (is_admin());
