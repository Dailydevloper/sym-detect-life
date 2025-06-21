
-- Create medicines table for the pharmacy store
CREATE TABLE public.medicines (
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
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  medicine_id UUID REFERENCES public.medicines(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, medicine_id)
);

-- Create orders table for purchases
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  shipping_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create order items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  medicine_id UUID REFERENCES public.medicines(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create doctors table
CREATE TABLE public.doctors (
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
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create health records table
CREATE TABLE public.health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL, -- 'symptom_check', 'prescription', 'lab_result', 'consultation'
  title TEXT NOT NULL,
  description TEXT,
  data JSONB, -- Store flexible health data
  file_url TEXT, -- For uploaded documents
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create symptom checks table
CREATE TABLE public.symptom_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  symptoms TEXT[] NOT NULL,
  ai_diagnosis TEXT,
  recommendations TEXT,
  severity_level TEXT, -- 'low', 'medium', 'high'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- 'info', 'warning', 'success', 'error'
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptom_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for medicines (public read access)
CREATE POLICY "Anyone can view medicines" ON public.medicines FOR SELECT USING (true);

-- RLS policies for cart_items
CREATE POLICY "Users can manage their cart" ON public.cart_items FOR ALL USING (auth.uid() = user_id);

-- RLS policies for orders
CREATE POLICY "Users can view their orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their orders" ON public.orders FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for order_items
CREATE POLICY "Users can view their order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Users can create order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);

-- RLS policies for doctors (public read access)
CREATE POLICY "Anyone can view doctors" ON public.doctors FOR SELECT USING (true);

-- RLS policies for appointments
CREATE POLICY "Users can manage their appointments" ON public.appointments FOR ALL USING (auth.uid() = user_id);

-- RLS policies for health records
CREATE POLICY "Users can manage their health records" ON public.health_records FOR ALL USING (auth.uid() = user_id);

-- RLS policies for symptom checks
CREATE POLICY "Users can manage their symptom checks" ON public.symptom_checks FOR ALL USING (auth.uid() = user_id);

-- RLS policies for notifications
CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Insert sample medicines data
INSERT INTO public.medicines (name, description, price, stock_quantity, category, manufacturer, requires_prescription, image_url) VALUES
('Paracetamol 500mg', 'Pain reliever and fever reducer', 5.99, 100, 'Pain Relief', 'HealthCorp', false, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400'),
('Ibuprofen 400mg', 'Anti-inflammatory pain reliever', 8.99, 80, 'Pain Relief', 'MediPharm', false, 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400'),
('Amoxicillin 250mg', 'Antibiotic for bacterial infections', 15.99, 50, 'Antibiotics', 'BioMed', true, 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400'),
('Vitamin D3 1000IU', 'Essential vitamin supplement', 12.99, 120, 'Vitamins', 'NutriHealth', false, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400'),
('Omeprazole 20mg', 'Acid reflux and heartburn treatment', 18.99, 60, 'Digestive', 'GastroMed', true, 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400');

-- Insert sample doctors data
INSERT INTO public.doctors (name, specialty, experience_years, rating, bio, consultation_fee, avatar_url, available_days, available_hours) VALUES
('Dr. Sarah Johnson', 'General Practice', 10, 4.8, 'Experienced family doctor specializing in preventive care and general health.', 80.00, 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400', ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], '09:00-17:00'),
('Dr. Michael Chen', 'Cardiology', 15, 4.9, 'Heart specialist with expertise in cardiovascular diseases and preventive cardiology.', 150.00, 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400', ARRAY['Monday', 'Wednesday', 'Friday'], '10:00-16:00'),
('Dr. Emily Rodriguez', 'Dermatology', 8, 4.7, 'Skin care specialist treating various dermatological conditions.', 120.00, 'https://images.unsplash.com/photo-1594824691439-021b3df5a2bb?w=400', ARRAY['Tuesday', 'Thursday', 'Saturday'], '08:00-14:00'),
('Dr. James Wilson', 'Orthopedics', 12, 4.6, 'Bone and joint specialist with focus on sports medicine.', 130.00, 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400', ARRAY['Monday', 'Tuesday', 'Thursday', 'Friday'], '11:00-18:00');
