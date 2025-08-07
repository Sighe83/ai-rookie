-- Migration: Move from tutor_availability to tutor_time_slots
-- This creates a normalized time slots table replacing the JSONB structure

-- Drop existing tutor_time_slots table if it exists
DROP TABLE IF EXISTS public.tutor_time_slots CASCADE;

-- Create the new tutor_time_slots table
CREATE TABLE public.tutor_time_slots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tutor_id UUID REFERENCES public.tutors(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE NOT NULL,
  is_booked BOOLEAN DEFAULT FALSE NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  client_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT no_overlapping_slots UNIQUE (tutor_id, date, start_time, end_time)
);

-- Create indexes for better performance
CREATE INDEX idx_tutor_time_slots_tutor_id ON public.tutor_time_slots(tutor_id);
CREATE INDEX idx_tutor_time_slots_date ON public.tutor_time_slots(date);
CREATE INDEX idx_tutor_time_slots_tutor_date ON public.tutor_time_slots(tutor_id, date);
CREATE INDEX idx_tutor_time_slots_available ON public.tutor_time_slots(is_available, is_booked);
CREATE INDEX idx_tutor_time_slots_booking_id ON public.tutor_time_slots(booking_id);

-- Enable Row Level Security
ALTER TABLE public.tutor_time_slots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tutor_time_slots table
CREATE POLICY "Anyone can view available time slots" ON public.tutor_time_slots
  FOR SELECT USING (is_available = true);

CREATE POLICY "Tutors can manage their own time slots" ON public.tutor_time_slots
  FOR ALL USING (auth.uid() IN (
    SELECT user_id FROM public.tutors WHERE id = tutor_id
  ));

-- Add updated_at trigger
CREATE TRIGGER handle_updated_at_tutor_time_slots BEFORE UPDATE ON public.tutor_time_slots
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Data migration from tutor_availability to tutor_time_slots
-- This will convert the JSONB time_slots to individual records
INSERT INTO public.tutor_time_slots (
  tutor_id, 
  date, 
  start_time, 
  end_time, 
  is_available, 
  is_booked, 
  client_name
)
SELECT 
  ta.tutor_id,
  ta.date,
  (slot->>'time')::TIME AS start_time,
  ((slot->>'time')::TIME + INTERVAL '1 hour') AS end_time,
  COALESCE((slot->>'available')::BOOLEAN, true) AS is_available,
  COALESCE((slot->>'booked')::BOOLEAN, false) AS is_booked,
  slot->>'clientName' AS client_name
FROM public.tutor_availability ta,
     jsonb_array_elements(ta.time_slots) AS slot
WHERE slot->>'time' IS NOT NULL
  AND slot->>'time' ~ '^[0-9]{2}:[0-9]{2}$'; -- Validate time format

-- Update Prisma schema model (for reference)
-- model TutorTimeSlot {
--   id          String    @id @default(uuid()) @db.Uuid
--   tutorId     String    @map("tutor_id") @db.Uuid
--   date        DateTime  @db.Date
--   startTime   DateTime  @map("start_time") @db.Time
--   endTime     DateTime  @map("end_time") @db.Time
--   isAvailable Boolean   @default(true) @map("is_available")
--   isBooked    Boolean   @default(false) @map("is_booked")
--   bookingId   String?   @map("booking_id") @db.Uuid
--   clientName  String?   @map("client_name")
--   notes       String?
--   createdAt   DateTime  @default(now()) @map("created_at")
--   updatedAt   DateTime  @updatedAt @map("updated_at")
--   tutor       Tutor     @relation(fields: [tutorId], references: [id], onDelete: Cascade)
--   booking     Booking?  @relation(fields: [bookingId], references: [id], onDelete: SetNull)
--
--   @@unique([tutorId, date, startTime, endTime], name: "no_overlapping_slots")
--   @@index([tutorId])
--   @@index([date])
--   @@index([tutorId, date])
--   @@index([isAvailable, isBooked])
--   @@map("tutor_time_slots")
-- }

-- Verification query to check migration success
-- SELECT 
--   COUNT(*) as old_records,
--   (SELECT COUNT(*) FROM public.tutor_time_slots) as new_records,
--   (SELECT COUNT(DISTINCT tutor_id || date::text) FROM public.tutor_availability) as unique_old_dates,
--   (SELECT COUNT(DISTINCT tutor_id || date::text) FROM public.tutor_time_slots) as unique_new_dates
-- FROM public.tutor_availability;