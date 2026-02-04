-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'patient';

-- Try to add constraint (will silently fail if it already exists in PostgreSQL 9.5+)
DO $$
BEGIN
  ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('patient', 'doctor', 'admin'));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Create index on role for faster queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Update existing users to have patient role if not set
UPDATE users SET role = 'patient' WHERE role IS NULL;

-- Update doctors table to link to users
-- (This assumes doctors table already has user_id column)
-- If not, uncomment the next line:
-- ALTER TABLE doctors ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Ensure doctors table has required columns
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS email TEXT;

-- Add unique constraint on license number
CREATE UNIQUE INDEX IF NOT EXISTS idx_doctors_license_number ON doctors(license_number);

-- Ensure appointments table has user_id column (patient link)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'appointments'
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.appointments ADD COLUMN user_id UUID;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'appointments'
        AND column_name = 'patient_id'
    ) THEN
      UPDATE public.appointments
      SET user_id = patient_id
      WHERE user_id IS NULL;
    END IF;

    BEGIN
      ALTER TABLE public.appointments
        ADD CONSTRAINT appointments_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);
