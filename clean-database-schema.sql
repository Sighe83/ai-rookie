-- AUTHORITATIVE Database Schema for AI Rookie
-- This is the single source of truth for the database structure
-- Based on what actually works in the codebase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop and recreate tables to ensure consistency
-- WARNING: This will delete all data!

DROP TABLE IF EXISTS public.tutor_availability CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.tutors CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  department TEXT,
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'TUTOR', 'ADMIN')),
  site_mode TEXT NOT NULL DEFAULT 'B2C' CHECK (site_mode IN ('B2B', 'B2C')),
  is_active BOOLEAN DEFAULT TRUE,
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
  base_price INTEGER NOT NULL, -- B2B price in øre/cents
  price INTEGER NOT NULL, -- B2C price in øre/cents
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table (what tutors offer)
CREATE TABLE public.sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tutor_id UUID REFERENCES public.tutors(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  duration INTEGER DEFAULT 60, -- Duration in minutes (matches code expectations)
  price_override INTEGER, -- Optional price override for this session
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
  participants INTEGER DEFAULT 1,
  total_price INTEGER NOT NULL, -- Price in øre/cents
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')),
  site_mode TEXT NOT NULL CHECK (site_mode IN ('B2B', 'B2C')),
  
  -- Contact information
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  company TEXT,
  department TEXT,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
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

-- Indexes for performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_tutors_user_id ON public.tutors(user_id);
CREATE INDEX idx_tutors_is_active ON public.tutors(is_active);
CREATE INDEX idx_sessions_tutor_id ON public.sessions(tutor_id);
CREATE INDEX idx_sessions_is_active ON public.sessions(is_active);
CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_tutor_id ON public.bookings(tutor_id);
CREATE INDEX idx_bookings_session_id ON public.bookings(session_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_availability_tutor_date ON public.tutor_availability(tutor_id, date);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies

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
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
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
DROP TRIGGER IF EXISTS handle_updated_at_users ON public.users;
CREATE TRIGGER handle_updated_at_users BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_tutors ON public.tutors;
CREATE TRIGGER handle_updated_at_tutors BEFORE UPDATE ON public.tutors
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_sessions ON public.sessions;
CREATE TRIGGER handle_updated_at_sessions BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_bookings ON public.bookings;
CREATE TRIGGER handle_updated_at_bookings BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_availability ON public.tutor_availability;
CREATE TRIGGER handle_updated_at_availability BEFORE UPDATE ON public.tutor_availability
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Schema setup complete!
-- 
-- Next steps:
-- 1. Create auth users through Supabase Auth UI
-- 2. Use the create-test-tutor-clean.sql script to add test data