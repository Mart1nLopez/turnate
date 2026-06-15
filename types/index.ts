export interface Professional {
  id: string;
  name: string;
  slug: string;
  email: string;
  rut: string;
  phone: string;
  bio?: string;
  profile_image?: string; // bucket url (professional-images/{professional_id}/{perfil}/image.jpg)
  social_links?: {
    instagram?: string;
    whatsapp?: string;
    facebook?: string;
    tiktok?: string;
    twitter?: string;
    youtube?: string;
  };
  carrusel_images?: {
    url: string; // bucket url (professional-images/{professional_id}/{carrusel}/image.jpg)
    alt: string;
  }[];
  location?: string;
  map_embed_url?: string;
  created_at: string;
  google_refresh_token?: string | null;
  hide_reviews?: boolean;
  is_approved?: boolean;
  theme?: ThemeId;
}

export interface Service {
  id: string;
  professional_id: string;
  name: string;
  description?: string;
  price: number;
  duration_minutes: number;
  image_url?: string; // bucket url (professional-images/{professional_id}/{servicios}/image.jpg)
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
  google_calendar_event_id?: string | null;
  google_calendar_id?: string | null;
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

// ─── Barbershops ──────────────────────────────────────────────────────────────

/**
 * Visual theme identifier for a barbershop's public page.
 * 'custom' is reserved for future per-barbershop color overrides.
 * Validated in application code — no DB CHECK constraint — so new themes
 * can be added without a migration.
 */
export type ThemeId =
  | 'luxury-gold'
  | 'minimal-white'
  | 'urban-neon'
  | 'vintage-barber'
  | 'black-red'
  | 'custom';

export type BarbershopMemberRole   = 'owner' | 'barber';
export type BarbershopMemberStatus = 'active' | 'inactive' | 'pending';
export type InvitationStatus       = 'pending' | 'accepted' | 'expired' | 'cancelled';

// Un ítem de la galería pública de la barbería.
// Almacenado como JSONB array — extensible: permite caption, title, is_featured sin migración.
export interface GalleryImage {
  url: string;
  order: number;
}

export interface Barbershop {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  phone?: string;
  social_links?: {
    instagram?: string;
    whatsapp?: string;
    facebook?: string;
    tiktok?: string;
    twitter?: string;
    youtube?: string;
  };
  company_rut?: string;
  address?: string;
  city?: string;
  region?: string;
  location?: string;
  map_embed_url?: string;
  // Personalización de la página pública (Sprint 3: barbershop_customization)
  cover_image_url?: string | null;
  primary_color?: string;
  secondary_color?: string;
  gallery_images?: GalleryImage[];
  // Tema visual (Sprint 4: barbershop_theme)
  // Si theme === 'custom', primary_color y secondary_color actúan como overrides.
  theme?: ThemeId;
  is_active: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface BarbershopMember {
  id: string;
  barbershop_id: string;
  professional_id: string;
  role: BarbershopMemberRole;
  status: BarbershopMemberStatus;
  joined_at: string;
  created_at: string;
  updated_at: string;
  // Embeds opcionales cuando se hace JOIN en la query
  professional?: Pick<Professional, 'id' | 'name' | 'slug' | 'profile_image' | 'email'>;
  barbershop?: Barbershop;
}

export interface BarbershopInvitation {
  id: string;
  barbershop_id: string;
  email: string;
  token: string;
  role: BarbershopMemberRole;
  status: InvitationStatus;
  invited_by: string;
  expires_at: string;
  created_at: string;
}

// Devuelta por get_invitation_preview(token) — campos seguros para /invitacion/[token]
export interface InvitationPreview {
  barbershop_id: string;
  barbershop_name: string;
  barbershop_logo?: string;
  role: BarbershopMemberRole;
  expires_at: string;
  is_valid: boolean;
}

// Invitación recibida por el professional (perspectiva de invitado).
// El campo barbershop se obtiene via JOIN en la query — puede ser undefined si la
// barbería está inactiva (RLS barbershops_select_public filtra is_active = false).
export interface ReceivedInvitation extends BarbershopInvitation {
  barbershop?: Pick<Barbershop, 'id' | 'name' | 'logo_url' | 'slug'>;
}

// ─── Barbershop pública ───────────────────────────────────────────────────────

// Subset de Barbershop expuesto en /barberia/[slug].
// Excluye campos administrativos (owner_id, company_rut, is_active, is_approved).
export interface BarbershopPublicProfile {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  phone?: string;
  social_links?: {
    instagram?: string;
    whatsapp?: string;
    facebook?: string;
    tiktok?: string;
    twitter?: string;
    youtube?: string;
  };
  address?: string;
  city?: string;
  region?: string;
  location?: string;
  map_embed_url?: string;
  // Personalización de la página pública (Sprint 3: barbershop_customization)
  cover_image_url?: string | null;
  primary_color?: string;
  secondary_color?: string;
  gallery_images?: GalleryImage[];
  // Tema visual (Sprint 4)
  theme?: ThemeId;
}

// Formulario de personalización de la página pública — usado en /dashboard/barberia/personalizar.
// Separado de Barbershop para delimitar qué campos puede editar el owner desde ese panel.
export interface BarbershopCustomizationForm {
  description: string;
  logo_url?: string | null;
  cover_image_url?: string | null;
  primary_color: string;
  secondary_color: string;
  gallery_images: GalleryImage[];
  // Sprint 4: tema visual. 'custom' usa primary_color/secondary_color como overrides.
  theme: ThemeId;
}

// Miembro del equipo para la página pública /barberia/[slug].
// Los datos del profesional son los mínimos para mostrar la tarjeta y navegar a su perfil.
export interface TeamMember {
  memberId: string;
  role: BarbershopMemberRole;
  joinedAt: string;
  professional: {
    id: string;
    name: string;
    slug: string;
    profileImage?: string;
    bio?: string;
  };
}

// ─── Analíticas de Barbería ───────────────────────────────────────────────────

/** Rango de fechas para el filtro global de analíticas */
export type AnalyticsDateRange = 'today' | '7d' | '30d' | '90d' | 'year' | 'custom';

/** Resultado de get_barbershop_stats() — estadísticas globales de la barbería */
export interface BarbershopGlobalStats {
  total_members: number;
  completed_appointments: number;
  upcoming_appointments: number;
  cancelled_appointments: number;
  unique_clients: number;
  avg_rating: number;
  total_reviews: number;
  total_revenue: number;
}

/** Resultado de get_barbershop_member_stats() — estadísticas por barbero */
export interface BarbershopMemberStatsRow {
  professional_id: string;
  professional_name: string;
  professional_slug: string;
  profile_image: string | null;
  role: BarbershopMemberRole;
  completed_appointments: number;
  cancelled_appointments: number;
  avg_rating: number;
  total_revenue: number;
  unique_clients: number;
  avg_ticket: number;
  booked_hours: number;
  available_hours: number;
}

/** Resultado de get_barbershop_monthly_trend() — tendencia mensual */
export interface BarbershopMonthlyTrendRow {
  period_start: string;
  month_label: string;
  appointments: number;
  revenue: number;
  unique_clients: number;
}

/** Resultado de get_barbershop_service_stats() — servicios más vendidos/rentables */
export interface BarbershopServiceStatRow {
  service_id: string;
  service_name: string;
  bookings: number;
  revenue: number;
}

/** Resultado de get_barbershop_retention() — retención de clientes */
export interface BarbershopRetentionStats {
  unique_clients: number;
  recurring_clients: number;
  return_rate: number;
}

/** Resultado de get_barbershop_top_clients() — top clientes */
export interface BarbershopTopClient {
  client_name: string;
  client_email: string;
  visit_count: number;
  total_spent: number;
  last_visit: string;
}
