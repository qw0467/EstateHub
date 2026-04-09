-- Add bio column to profiles for seller public profiles
ALTER TABLE public.profiles ADD COLUMN bio text;

-- Add seller_id FK to properties (distinct from the legacy agent_id column)
ALTER TABLE public.properties
  ADD COLUMN seller_id uuid REFERENCES public.profiles(id);

-- Sellers can view all of their own properties regardless of status
-- (needed for the seller dashboard to show pending/sold listings)
CREATE POLICY "Sellers can view their own properties"
  ON public.properties FOR SELECT
  USING (auth.uid() = seller_id);

-- Sellers can insert new properties (they must set seller_id = themselves)
CREATE POLICY "Sellers can insert their own properties"
  ON public.properties FOR INSERT
  WITH CHECK (
    auth.uid() = seller_id
    AND get_current_user_role() IN ('seller', 'admin')
  );

-- Sellers can update their own properties
CREATE POLICY "Sellers can update their own properties"
  ON public.properties FOR UPDATE
  USING (
    auth.uid() = seller_id
    AND get_current_user_role() IN ('seller', 'admin')
  );

-- Sellers can delete their own properties
CREATE POLICY "Sellers can delete their own properties"
  ON public.properties FOR DELETE
  USING (
    auth.uid() = seller_id
    AND get_current_user_role() IN ('seller', 'admin')
  );

-- NOTE: Apply this migration to the Supabase instance via Dashboard → SQL Editor.
-- Sellers are users with role = 'seller' (set by an admin in the Admin Panel).
