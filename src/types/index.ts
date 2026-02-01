export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  email_verified: boolean;
  role?: "patient" | "doctor" | "admin";
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  created_at: string;
  updated_at: string;
}

export interface Medicine {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock_quantity: number;
  category?: string;
  manufacturer?: string;
  prescription_required: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  medicine_id: string;
  quantity: number;
  medicine?: Medicine;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  shipping_address: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  medicine_id: string;
  quantity: number;
  price: number;
  medicine?: Medicine;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  qualification: string;
  experience_years: number;
  consultation_fee: number;
  avatar_url?: string;
  bio?: string;
  available_days?: string[];
  available_time_start?: string;
  available_time_end?: string;
  rating?: number;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  reason: string;
  notes?: string;
  doctor?: Doctor;
  created_at: string;
  updated_at: string;
}

export interface HealthRecord {
  id: string;
  user_id: string;
  record_type: string;
  title: string;
  description?: string;
  record_date: string;
  attachment_url?: string;
  created_at: string;
  updated_at: string;
}

export interface SymptomCheck {
  id: string;
  user_id: string;
  symptoms: string[];
  severity: string;
  duration: string;
  additional_info?: string;
  ai_response?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}
