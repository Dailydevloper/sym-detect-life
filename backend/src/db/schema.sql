-- Migration script to create local database schema
-- This recreates the Supabase schema for local PostgreSQL

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users table (replacing Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT, -- NULL for OAuth users
  full_name TEXT,
  avatar_url TEXT,
  google_id TEXT UNIQUE, -- For Google OAuth
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user profiles table to store additional user information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Create medicines table for the pharmacy store
CREATE TABLE IF NOT EXISTS public.medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  manufacturer TEXT,
  requires_prescription BOOLEAN DEFAULT false,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create shopping cart table
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  medicine_id UUID REFERENCES public.medicines(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, medicine_id)
);

-- Create orders table for purchases
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  shipping_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create order items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  medicine_id UUID REFERENCES public.medicines(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create doctors table
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  experience_years INTEGER,
  rating DECIMAL(3,2) DEFAULT 0,
  bio TEXT,
  consultation_fee DECIMAL(10,2),
  avatar_url TEXT,
  available_days TEXT[], -- Array of weekdays
  available_hours TEXT, -- e.g., "09:00-17:00"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create health records table
CREATE TABLE IF NOT EXISTS public.health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL, -- 'symptom_check', 'prescription', 'lab_result', 'consultation'
  title TEXT NOT NULL,
  description TEXT,
  data JSONB, -- Store flexible health data
  file_url TEXT, -- For uploaded documents
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create symptom checks table
CREATE TABLE IF NOT EXISTS public.symptom_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  symptoms TEXT[] NOT NULL,
  ai_diagnosis TEXT,
  recommendations TEXT,
  severity_level TEXT, -- 'low', 'medium', 'high'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- 'info', 'warning', 'success', 'error'
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_health_records_user_id ON public.health_records(user_id);
CREATE INDEX IF NOT EXISTS idx_symptom_checks_user_id ON public.symptom_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- Create video calls table for storing call records
CREATE TABLE IF NOT EXISTS public.video_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  initiator_id UUID REFERENCES public.users(id),
  status TEXT DEFAULT 'pending', -- 'pending', 'active', 'ended', 'missed'
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  recording_url TEXT, -- URL to stored recording if available
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_video_calls_appointment_id ON public.video_calls(appointment_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_initiator_id ON public.video_calls(initiator_id);

-- Insert sample medicines data
INSERT INTO public.medicines (name, description, price, stock_quantity, category, manufacturer, requires_prescription, image_url) VALUES
('Paracetamol 500mg', 'Pain reliever and fever reducer', 5.99, 100, 'Pain Relief', 'HealthCorp', false, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400'),
('Ibuprofen 400mg', 'Anti-inflammatory pain reliever', 8.99, 80, 'Pain Relief', 'MediPharm', false, 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400'),
('Amoxicillin 250mg', 'Antibiotic for bacterial infections', 15.99, 50, 'Antibiotics', 'BioMed', true, 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400'),
('Vitamin D3 1000IU', 'Essential vitamin supplement', 12.99, 120, 'Vitamins', 'NutriHealth', false, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400'),
('Omeprazole 20mg', 'Acid reflux and heartburn treatment', 18.99, 60, 'Digestive', 'GastroMed', true, 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400')
ON CONFLICT DO NOTHING;

-- Insert sample doctors data
INSERT INTO public.doctors (name, specialty, experience_years, rating, bio, consultation_fee, avatar_url, available_days, available_hours) VALUES
('Dr. Sarah Johnson', 'General Practice', 10, 4.8, 'Experienced family doctor specializing in preventive care and general health.', 80.00, 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400', ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], '09:00-17:00'),
('Dr. Michael Chen', 'Cardiology', 15, 4.9, 'Heart specialist with expertise in cardiovascular diseases and preventive cardiology.', 150.00, 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400', ARRAY['Monday', 'Wednesday', 'Friday'], '10:00-16:00'),
('Dr. Emily Rodriguez', 'Dermatology', 8, 4.7, 'Skin care specialist treating various dermatological conditions.', 120.00, 'https://images.unsplash.com/photo-1594824691439-021b3df5a2bb?w=400', ARRAY['Tuesday', 'Thursday', 'Saturday'], '08:00-14:00'),
('Dr. James Wilson', 'Orthopedics', 12, 4.6, 'Bone and joint specialist with focus on sports medicine.', 130.00, 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400', ARRAY['Monday', 'Tuesday', 'Thursday', 'Friday'], '11:00-18:00')
ON CONFLICT DO NOTHING;
