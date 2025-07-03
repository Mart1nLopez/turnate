export interface Professional {
  id: string;
  name: string;
  slug: string;
  email: string;
  rut: string;
  phone: string;
  bio?: string;
  profile_image?: string; // URL to the profile image
  social_links?: {
    instagram?: string;
    whatsapp?: string;
    facebook?: string;
  };
  carrusel_images?: {
    url: string;
    alt: string;
  }[];
  location?: string;
  map_embed_url?: string;
  created_at: string;
}

export interface Service {
  id: string;
  professional_id: string;
  name: string;
  description?: string;
  price: number;
  duration_minutes: number;
  image_url?: string;
  created_at: string;
}

export interface Client {
  id: string;
  email: string;
  name: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  professional_id: string;
  service_id?: string;
  client_id?: string;
  start_time: string;
  end_time: string;
  status: 'confirmed' | 'completed' | 'cancelled_by_pro' | 'cancelled_by_client';
  notes?: string;
  cancellation_token?: string;
  review_token?: string;
  created_at: string;
  service?: Service;
  client?: Client;
}

export interface TimeBlock {
  start_time: string;
  end_time: string;
}

export interface Availability {
  id: string;
  professional_id: string;
  day_of_week: number; // 0 = domingo, 1 = lunes, etc.
  start_time?: string; // HH:MM format (mantenido para retrocompatibilidad)
  end_time?: string; // HH:MM format (mantenido para retrocompatibilidad)
  time_blocks?: TimeBlock[]; // Nuevos bloques de tiempo
  is_available?: boolean;
  break_minutes: number;
  advance_hours: number;
  cancel_hours: number;
  created_at?: string;
}

export interface Review {
  id: string;
  appointment_id: string;
  professional_id: string;
  client_name: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface BookingFormData {
  name: string;
  email: string;
  phone: string;
  service_id: string;
  date: string;
  time: string;
}

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    name?: string;
  };
}

export interface UnavailableDate {
  id: string;
  professional_id: string;
  date: string; // YYYY-MM-DD format
  reason?: string;
  created_at: string;
}
