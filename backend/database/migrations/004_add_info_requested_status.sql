-- Adds an 'info_requested' verification status for veterans, plus columns
-- to store the admin's extra-info message and review metadata.

-- 1. Drop the existing status check constraint (name looked up dynamically
--    in case it differs from the default Postgres naming convention).
DO $$
DECLARE
  cname text;
BEGIN
  SELECT con.conname INTO cname
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  WHERE rel.relname = 'veterans'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%verification_status%';

  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE veterans DROP CONSTRAINT %I', cname);
  END IF;
END $$;

-- 2. Re-add the constraint including the new 'info_requested' value.
ALTER TABLE veterans
  ADD CONSTRAINT veterans_verification_status_check
  CHECK (verification_status IN ('pending', 'approved', 'rejected', 'info_requested'));

-- 3. Add columns to store the admin's extra-info message and review metadata.
ALTER TABLE veterans ADD COLUMN IF NOT EXISTS info_request_message TEXT;
ALTER TABLE veterans ADD COLUMN IF NOT EXISTS reviewed_by BIGINT REFERENCES admins(id);
ALTER TABLE veterans ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;