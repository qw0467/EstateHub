DO $$ BEGIN
  CREATE TYPE property_type AS ENUM ('house', 'apartment', 'condo', 'villa', 'penthouse');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE property_status AS ENUM ('available', 'pending', 'sold');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  phone text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create properties table
CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  price numeric NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip_code text,
  bedrooms integer NOT NULL,
  bathrooms integer NOT NULL,
  sqft integer NOT NULL,
  property_type property_type NOT NULL,
  status property_status DEFAULT 'available',
  image_url text,
  gallery_images text[] DEFAULT '{}',
  features text[] DEFAULT '{}',
  agent_id uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on properties
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Properties policies - everyone can view available properties
CREATE POLICY "Anyone can view available properties"
  ON public.properties FOR SELECT
  USING (status = 'available' OR auth.uid() = agent_id);

CREATE POLICY "Agents can insert properties"
  ON public.properties FOR INSERT
  WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Agents can update their properties"
  ON public.properties FOR UPDATE
  USING (auth.uid() = agent_id);

-- Create bookings/purchases table
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  booking_date timestamptz DEFAULT now() NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_amount numeric NOT NULL,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Bookings policies
CREATE POLICY "Users can view their own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = user_id);

-- Create favorites table
CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, property_id)
);

-- Enable RLS on favorites
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Favorites policies
CREATE POLICY "Users can view their own favorites"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

--Function to handle profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


INSERT INTO public.properties (title, description, price, address, city, state, zip_code, bedrooms, bathrooms, sqft, property_type, image_url, gallery_images, features)
VALUES
('Modern Downtown Loft', 'Stunning contemporary loft in West Bay Financial District with floor-to-ceiling windows and premium finishes throughout.', 2500000, 'Tower 12, West Bay', 'Doha', 'Ad Dawhah', '00000', 2, 2, 1200, 'condo', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop', 
   ARRAY['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop'],
   ARRAY['Marble Floors', 'Premium Kitchen Appliances', 'Maid Room', 'Covered Parking', 'Gym Access']),
  
('Luxury Family Villa', 'Spacious 4-bedroom villa with modern amenities, private garden, and close to international schools.', 4200000, 'Villa 42, Al Waab Street', 'Doha', 'Ad Dawhah', '00000', 4, 3, 2800, 'house',
   'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&auto=format&fit=crop',
   ARRAY['https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop'],
   ARRAY['Chef Kitchen', 'Private Pool', 'Smart Home', 'Solar Panels', 'Driver Room']),
  
('Beachfront Villa', 'Exclusive waterfront property at Porto Arabia with panoramic views, private beach access, and luxury finishes.', 8500000, 'Villa 7, Porto Arabia', 'Doha', 'Ad Dawhah', '00000', 5, 4, 3500, 'villa',
   'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop',
   ARRAY['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop'],
   ARRAY['Sea View', 'Infinity Pool', 'Wine Storage', 'Home Cinema', 'Private Berth']),
  
('Cozy Studio Apartment', 'Perfect starter home in Diplomatic Area with modern finishes and excellent location near metro.', 850000, 'Apartment 304, Diplomatic District', 'Doha', 'Ad Dawhah', '00000', 1, 1, 650, 'apartment',
   'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop',
   ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop'],
   ARRAY['Fitted Kitchen', 'Balcony', 'Furnished', 'Storage Room']),
  
('Desert Oasis Villa', 'Serene villa in Al Rayyan with breathtaking garden views, perfect for families seeking tranquility.', 3800000, 'Villa 88, Al Rayyan Gardens', 'Al Rayyan', 'Doha', '00974', 3, 2, 2100, 'house',
   'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&auto=format&fit=crop',
   ARRAY['https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&auto=format&fit=crop'],
   ARRAY['Garden Views', 'Majlis Room', 'Outdoor Terrace', 'Jacuzzi', 'BBQ Area']),
  
('Luxury Penthouse', 'Spectacular penthouse in Lusail with 360-degree city and sea views with premium amenities.', 6500000, 'Sky Villa, Lusail Marina', 'Lusail', 'Doha', '00974', 3, 3, 2400, 'penthouse',
   'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop',
   ARRAY['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop'],
   ARRAY['Rooftop Terrace', '24/7 Concierge', 'Private Elevator', 'Floor-to-Ceiling Windows', 'Italian Marble']);
