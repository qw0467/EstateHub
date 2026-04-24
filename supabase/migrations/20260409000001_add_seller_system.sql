-- Add bio column to profiles (used on the public seller profile page)
ALTER TABLE public.profiles ADD COLUMN bio text;

-- Add seller_id FK to properties so users with the seller role can list properties
ALTER TABLE public.properties
  ADD COLUMN seller_id uuid REFERENCES public.profiles(id);

-- SECURITY: Drop the legacy agent_id-based insert/update policies.
-- These create an authorization bypass (OR semantics) alongside the new
-- seller_id ownership model, allowing someone to set agent_id = auth.uid()
-- with an arbitrary seller_id to gain update rights.
DROP POLICY IF EXISTS "Agents can insert properties" ON public.properties;
DROP POLICY IF EXISTS "Agents can update their properties" ON public.properties;

-- Sellers can see ALL of their own listings regardless of status
-- (needed for the seller dashboard to show pending/sold listings)
CREATE POLICY "Owners can view their own properties"
  ON public.properties FOR SELECT
  USING (auth.uid() = seller_id);

-- Any authenticated user can create a listing as long as seller_id = their own id.
-- Role restriction removed: seller_id = auth.uid() already prevents impersonation.
CREATE POLICY "Sellers can create listings"
  ON public.properties FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

-- Owners can update only their own listings
CREATE POLICY "Owners can update their own properties"
  ON public.properties FOR UPDATE
  USING (auth.uid() = seller_id);

-- Owners can delete only their own listings
CREATE POLICY "Owners can delete their own properties"
  ON public.properties FOR DELETE
  USING (auth.uid() = seller_id);

-- NOTE: Apply this migration to the Supabase instance via Dashboard → SQL Editor.
-- To grant a user the seller role: UPDATE profiles SET role = 'seller' WHERE id = '<user-id>';
