ALTER TABLE IF EXISTS veterans
  ADD COLUMN IF NOT EXISTS gender VARCHAR(10);

ALTER TABLE IF EXISTS veterans
  ADD CONSTRAINT veterans_gender_check CHECK (gender IN ('Male', 'Female') OR gender IS NULL);