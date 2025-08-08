-- Fix database schema for Stripe payment integration
-- This SQL adds the missing payment_expires_at field to the bookings table

-- Add payment_expires_at column to bookings table
ALTER TABLE "public"."bookings" 
ADD COLUMN IF NOT EXISTS "payment_expires_at" TIMESTAMPTZ;

-- Add index on payment_expires_at for better performance on cleanup queries
CREATE INDEX IF NOT EXISTS "idx_bookings_payment_expires_at" 
ON "public"."bookings"("payment_expires_at");

-- Add composite index for cleanup service queries
CREATE INDEX IF NOT EXISTS "idx_bookings_payment_cleanup" 
ON "public"."bookings"("status", "payment_status", "payment_expires_at");

-- Verify the column was added successfully
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name = 'payment_expires_at';

-- Show all columns in bookings table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' 
ORDER BY ordinal_position;