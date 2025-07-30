-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret-here';

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  department TEXT,
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'TUTOR', 'ADMIN')),
  site_mode TEXT NOT NULL DEFAULT 'B2B' CHECK (site_mode IN ('B2B', 'B2C')),
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tutors table
CREATE TABLE public.tutors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  title TEXT NOT NULL,
  specialty TEXT NOT NULL,
  experience TEXT,
  value_prop TEXT,
  img TEXT,
  base_price INTEGER NOT NULL, -- Price in øre/cents
  price INTEGER, -- B2C price
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table
CREATE TABLE public.sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tutor_id UUID REFERENCES public.tutors(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  duration INTEGER DEFAULT 60, -- minutes
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings table
CREATE TABLE public.bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  tutor_id UUID REFERENCES public.tutors(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  
  -- Booking details
  format TEXT NOT NULL CHECK (format IN ('INDIVIDUAL', 'TEAM', 'PROGRAM', 'GROUP')),
  selected_date_time TIMESTAMPTZ NOT NULL,
  participants INTEGER,
  total_price INTEGER NOT NULL, -- Price in øre/cents
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')),
  site_mode TEXT NOT NULL CHECK (site_mode IN ('B2B', 'B2C')),
  
  -- Contact information
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  company TEXT,
  department TEXT,
  
  -- Payment information
  payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
  payment_intent_id TEXT,
  paid_at TIMESTAMPTZ,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- Tutor availability table
CREATE TABLE public.tutor_availability (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tutor_id UUID REFERENCES public.tutors(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  time_slots JSONB NOT NULL, -- JSON array of time slots
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tutor_id, date)
);

-- System settings table
CREATE TABLE public.system_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users only" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Tutors policies
CREATE POLICY "Anyone can view active tutors" ON public.tutors
  FOR SELECT USING (is_active = true);

CREATE POLICY "Tutors can update their own profile" ON public.tutors
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create tutor profiles" ON public.tutors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Sessions policies
CREATE POLICY "Anyone can view active sessions" ON public.sessions
  FOR SELECT USING (is_active = true);

CREATE POLICY "Tutors can manage their own sessions" ON public.sessions
  FOR ALL USING (auth.uid() IN (
    SELECT user_id FROM public.tutors WHERE id = tutor_id
  ));

-- Bookings policies
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Tutors can view bookings for their sessions" ON public.bookings
  FOR SELECT USING (auth.uid() IN (
    SELECT user_id FROM public.tutors WHERE id = tutor_id
  ));

CREATE POLICY "Authenticated users can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Tutors can update bookings for their sessions" ON public.bookings
  FOR UPDATE USING (auth.uid() IN (
    SELECT user_id FROM public.tutors WHERE id = tutor_id
  ));

-- Tutor availability policies
CREATE POLICY "Anyone can view tutor availability" ON public.tutor_availability
  FOR SELECT USING (true);

CREATE POLICY "Tutors can manage their own availability" ON public.tutor_availability
  FOR ALL USING (auth.uid() IN (
    SELECT user_id FROM public.tutors WHERE id = tutor_id
  ));

-- System settings policies (admin only)
CREATE POLICY "Only admins can manage system settings" ON public.system_settings
  FOR ALL USING (auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'ADMIN'
  ));

-- Functions and triggers

-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile when auth user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.tutors
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.tutor_availability
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for better performance
CREATE INDEX idx_tutors_user_id ON public.tutors(user_id);
CREATE INDEX idx_tutors_specialty ON public.tutors(specialty);
CREATE INDEX idx_tutors_is_active ON public.tutors(is_active);

CREATE INDEX idx_sessions_tutor_id ON public.sessions(tutor_id);
CREATE INDEX idx_sessions_is_active ON public.sessions(is_active);

CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_tutor_id ON public.bookings(tutor_id);
CREATE INDEX idx_bookings_session_id ON public.bookings(session_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_selected_date_time ON public.bookings(selected_date_time);

CREATE INDEX idx_tutor_availability_tutor_id ON public.tutor_availability(tutor_id);
CREATE INDEX idx_tutor_availability_date ON public.tutor_availability(date);

-- Storage setup
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('uploads', 'uploads', true),
  ('avatars', 'avatars', true),
  ('documents', 'documents', false);

-- Storage policies
CREATE POLICY "Anyone can view public uploads" ON storage.objects
  FOR SELECT USING (bucket_id = 'uploads');

CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN ('uploads', 'avatars') AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own files" ON storage.objects
  FOR UPDATE USING (
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own files" ON storage.objects
  FOR DELETE USING (
    auth.uid()::text = (storage.foldername(name))[1]
  );