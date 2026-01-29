-- Quick SQL commands to set up the database
-- Run these in psql or pgAdmin

-- 1. Create the database (run as postgres user)
CREATE DATABASE symptom_detect;

-- 2. Connect to the database
\c symptom_detect;

-- 3. Verify the database is empty
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- After running npm run db:migrate, verify tables were created:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- To reset the database (WARNING: Deletes all data):
-- DROP DATABASE symptom_detect;
-- CREATE DATABASE symptom_detect;
