-- Add bio column to profiles (used on the public profile page)
ALTER TABLE public.profiles ADD COLUMN bio text;

-- Add seller_id FK to properties so any user can list a property they own
ALTER TABLE public.properties
  ADD COLUMN seller_id uuid REFERENCES public.profiles(id);

-- Sellers can view ALL of their own properties regardless of status
-- (needed for the dashboard to show pending/sold listings too)
CREATE POLICY "Owners can view their own properties"
  ON public.properties FOR SELECT
  USING (auth.uid() = seller_id);

-- Any authenticated user can create a listing (seller_id must match themselves)
CREATE POLICY "Authenticated users can create listings"
  ON public.properties FOR INSERT
  WITH CHECK (auth.uid() = seller_id AND auth.uid() IS NOT NULL);

-- Owners can update their own listings
CREATE POLICY "Owners can update their own properties"
  ON public.properties FOR UPDATE
  USING (auth.uid() = seller_id);

-- Owners can delete their own listings
CREATE POLICY "Owners can delete their own properties"
  ON public.properties FOR DELETE
  USING (auth.uid() = seller_id);

-- NOTE: Apply this migration to the Supabase instance via Dashboard → SQL Editor.
