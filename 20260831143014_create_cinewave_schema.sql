/*
# CineWave Entertainment - Movie Ticket Booking Management Schema

This migration creates the complete data model for the CineWave movie ticket booking application.

## 1. New Tables

### movies
The reusable Movie data object. Stores movie master data that can be referenced by multiple shows and booking requests.
- id (uuid, primary key)
- movie_name (text, not null)
- genre (text)
- language (text)
- duration (integer, in minutes)
- description (text)
- created_at (timestamp)

### shows
The reusable Show data object. Each show references a movie and tracks seat availability per screening.
- id (uuid, primary key)
- movie_id (uuid, foreign key to movies)
- movie_name (text, denormalized for quick reference)
- show_date (date)
- show_time (time)
- show_type (text: Premium | Standard)
- theatre_name (text)
- screen_name (text)
- seat_capacity (integer, total seats)
- available_seats_count (integer, remaining seats)
- ticket_price (numeric, per-ticket price)
- created_at (timestamp)

### bookings
The Movie Ticket Request case table. Each row represents a case moving through the four-stage lifecycle:
Initial Stage -> Availability -> Approval -> Booking Execution -> Resolved.
Tracks the full case state including customer info, availability status, total cost, seat allocation,
booking confirmation status, SLA urgency, and work queue assignment.
- id (uuid, primary key) - acts as Case ID
- customer_name (text)
- customer_email (text)
- customer_phone (text)
- movie_id (uuid, foreign key to movies)
- movie_name (text)
- genre (text)
- show_id (uuid, foreign key to shows)
- show_date (date)
- show_time (time)
- show_type (text: Premium | Standard)
- number_of_tickets (integer)
- seat_availability_status (text: Available | Not Available)
- available_seats_count (integer)
- ticket_price (numeric)
- total_cost (numeric, calculated = ticket_price * number_of_tickets)
- seat_numbers (text, comma-separated allocated seat numbers)
- ticket_id (text, unique generated ticket id)
- booking_confirmation_status (text: Pending | Confirmed | Cancelled)
- work_queue (text: PremiumShowQueue | StandardShowQueue)
- stage (text: Initial | Availability | Approval | Booking Execution | Resolved)
- resolution_status (text: Confirmed | Cancelled | null)
- urgency (integer, default 0 - increases on SLA goal/deadline miss)
- sla_goal_at (timestamp, creation + 1 day)
- sla_deadline_at (timestamp, creation + 2 days)
- customer_confirmed (boolean)
- customer_confirmed_at (timestamp)
- email_sent (boolean)
- created_at (timestamp)
- updated_at (timestamp)

### correspondence
Log of automated booking confirmation emails dispatched after successful case resolution.
- id (uuid, primary key)
- booking_id (uuid, foreign key to bookings)
- case_id (text, human-readable case id)
- customer_name (text)
- customer_email (text)
- subject (text)
- body (text)
- sent_at (timestamp)

## 2. Security
- RLS enabled on all tables.
- Policies allow anon + authenticated CRUD because this is a no-auth application (single-tenant, shared data).
*/

-- ===== MOVIES =====
CREATE TABLE IF NOT EXISTS movies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_name text NOT NULL,
  genre text,
  language text,
  duration integer,
  description text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_movies" ON movies;
CREATE POLICY "anon_select_movies" ON movies FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_movies" ON movies;
CREATE POLICY "anon_insert_movies" ON movies FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_movies" ON movies;
CREATE POLICY "anon_update_movies" ON movies FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_movies" ON movies;
CREATE POLICY "anon_delete_movies" ON movies FOR DELETE TO anon, authenticated USING (true);

-- ===== SHOWS =====
CREATE TABLE IF NOT EXISTS shows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id uuid REFERENCES movies(id) ON DELETE CASCADE,
  movie_name text,
  show_date date NOT NULL,
  show_time time NOT NULL,
  show_type text NOT NULL CHECK (show_type IN ('Premium','Standard')),
  theatre_name text,
  screen_name text,
  seat_capacity integer NOT NULL DEFAULT 120,
  available_seats_count integer NOT NULL DEFAULT 120,
  ticket_price numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_shows" ON shows;
CREATE POLICY "anon_select_shows" ON shows FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_shows" ON shows;
CREATE POLICY "anon_insert_shows" ON shows FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_shows" ON shows;
CREATE POLICY "anon_update_shows" ON shows FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_shows" ON shows;
CREATE POLICY "anon_delete_shows" ON shows FOR DELETE TO anon, authenticated USING (true);

-- ===== BOOKINGS =====
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text,
  customer_email text,
  customer_phone text,
  movie_id uuid REFERENCES movies(id) ON DELETE SET NULL,
  movie_name text,
  genre text,
  show_id uuid REFERENCES shows(id) ON DELETE SET NULL,
  show_date date,
  show_time time,
  show_type text CHECK (show_type IN ('Premium','Standard')),
  number_of_tickets integer DEFAULT 0,
  seat_availability_status text CHECK (seat_availability_status IN ('Available','Not Available')),
  available_seats_count integer DEFAULT 0,
  ticket_price numeric(10,2) DEFAULT 0,
  total_cost numeric(10,2) DEFAULT 0,
  seat_numbers text,
  ticket_id text,
  booking_confirmation_status text DEFAULT 'Pending' CHECK (booking_confirmation_status IN ('Pending','Confirmed','Cancelled')),
  work_queue text,
  stage text DEFAULT 'Initial' CHECK (stage IN ('Initial','Availability','Approval','Booking Execution','Resolved')),
  resolution_status text CHECK (resolution_status IN ('Confirmed','Cancelled')),
  urgency integer DEFAULT 0,
  sla_goal_at timestamptz,
  sla_deadline_at timestamptz,
  customer_confirmed boolean DEFAULT false,
  customer_confirmed_at timestamptz,
  email_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_bookings" ON bookings;
CREATE POLICY "anon_select_bookings" ON bookings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_bookings" ON bookings;
CREATE POLICY "anon_insert_bookings" ON bookings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_bookings" ON bookings;
CREATE POLICY "anon_update_bookings" ON bookings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_bookings" ON bookings;
CREATE POLICY "anon_delete_bookings" ON bookings FOR DELETE TO anon, authenticated USING (true);

-- ===== CORRESPONDENCE =====
CREATE TABLE IF NOT EXISTS correspondence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  case_id text,
  customer_name text,
  customer_email text,
  subject text,
  body text,
  sent_at timestamptz DEFAULT now()
);
ALTER TABLE correspondence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_correspondence" ON correspondence;
CREATE POLICY "anon_select_correspondence" ON correspondence FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_correspondence" ON correspondence;
CREATE POLICY "anon_insert_correspondence" ON correspondence FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_correspondence" ON correspondence;
CREATE POLICY "anon_update_correspondence" ON correspondence FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_correspondence" ON correspondence;
CREATE POLICY "anon_delete_correspondence" ON correspondence FOR DELETE TO anon, authenticated USING (true);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bookings_stage ON bookings(stage);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(booking_confirmation_status);
CREATE INDEX IF NOT EXISTS idx_bookings_work_queue ON bookings(work_queue);
CREATE INDEX IF NOT EXISTS idx_bookings_show_type ON bookings(show_type);
CREATE INDEX IF NOT EXISTS idx_shows_movie ON shows(movie_id);
CREATE INDEX IF NOT EXISTS idx_correspondence_booking ON correspondence(booking_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bookings_updated_at ON bookings;
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION set_updated_at();