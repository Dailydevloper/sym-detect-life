-- Cleanup script to remove duplicate entries
-- Run this to clean up any existing duplicates in the database

-- Remove duplicate doctors (keep the one with the highest ID)
DELETE FROM public.doctors a USING public.doctors b
WHERE a.id < b.id 
AND a.full_name = b.full_name 
AND a.specialty = b.specialty;

-- Remove duplicate medicines (keep the one with the highest ID)
DELETE FROM public.medicines a USING public.medicines b
WHERE a.id < b.id 
AND a.name = b.name 
AND a.manufacturer = b.manufacturer;

-- Add unique constraints if they don't exist
ALTER TABLE public.medicines ADD CONSTRAINT IF NOT EXISTS unique_medicine_name_manufacturer UNIQUE (name, manufacturer);
ALTER TABLE public.doctors ADD CONSTRAINT IF NOT EXISTS unique_doctor_fullname_specialty UNIQUE (full_name, specialty);

-- Verify no duplicates remain
SELECT full_name, specialty, COUNT(*) as count 
FROM public.doctors 
GROUP BY full_name, specialty 
HAVING COUNT(*) > 1;

SELECT name, manufacturer, COUNT(*) as count 
FROM public.medicines 
GROUP BY name, manufacturer 
HAVING COUNT(*) > 1;
