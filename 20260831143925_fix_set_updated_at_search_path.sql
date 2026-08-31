/*
# Fix set_updated_at function search_path security warning

The database linter flagged that the set_updated_at trigger function has a mutable search_path.
This migration recreates the function with an explicit, secure search_path to resolve the warning.
*/

DROP TRIGGER IF EXISTS bookings_updated_at ON bookings;
DROP FUNCTION IF EXISTS public.set_updated_at();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();