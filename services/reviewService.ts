import { getCurrentProfessional } from '@/lib/supabase';
import { Review } from '@/types';
import { Appointment, Professional, Service, Client } from '@/types';
import { supabase } from '@/lib/supabase';

export interface ReviewWithDetails extends Review {
  appointment?: {
    start_time: string;
    service?: {
      name: string;
    };
  };
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
}

export async function getProfessionalReviews(): Promise<ReviewWithDetails[]> {
  const { professional } = await getCurrentProfessional();
  if (!professional) throw new Error('No se encontró el profesional actual');

  const { data, error } = await supabase
    .from('reviews')
    .select(`*, appointment:appointments(start_time, service:services(name))`)
    .eq('professional_id', professional.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message || 'Error al cargar reseñas');
  return data || [];
}

export function getProfessionalReviewStats(reviews: ReviewWithDetails[]): ReviewStats {
  const totalReviews = reviews.length;
  if (totalReviews === 0) {
    return {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / totalReviews;
  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((review) => {
    if (review.rating >= 1 && review.rating <= 5) {
      ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
    }
  });
  return {
    totalReviews,
    averageRating,
    ratingDistribution,
  };
}

export type AppointmentWithDetails = Appointment & {
  professional?: Professional;
  service?: Service;
  client?: Client;
};

export interface ReviewFormData {
  clientName: string;
  rating: number;
  comment: string;
}

export async function getAppointmentByReviewToken(token: string): Promise<AppointmentWithDetails | null> {
  const { data, error } = await supabase
    .from('appointments')
    .select(`*, professional:professionals(*), service:services(*), client:clients(*)`)
    .eq('review_token', token)
    .eq('status', 'completed')
    .single();

  if (error || !data) {
    throw new Error('No se encontró la cita o el enlace de reseña es inválido');
  }
  return data;
}

export async function checkExistingReview(appointmentId: number): Promise<boolean> {
  const { data } = await supabase.from('reviews').select('id').eq('appointment_id', appointmentId).single();
  return !!data;
}

export async function submitReview(appointment: AppointmentWithDetails, formData: ReviewFormData): Promise<void> {
  const reviewData = {
    appointment_id: appointment.id,
    professional_id: appointment.professional!.id,
    client_name: formData.clientName.trim(),
    rating: formData.rating,
    comment: formData.comment.trim() || null,
  };

  const { error: submitError } = await supabase.from('reviews').insert(reviewData).select();
  if (submitError) {
    if (submitError.message.includes('duplicate')) {
      throw new Error('Ya has dejado una reseña para esta cita.');
    }
    throw submitError;
  }

  // Invalidar el review_token después de usar
  const { error: updateError } = await supabase
    .from('appointments')
    .update({ review_token: null })
    .eq('id', appointment.id)
    .select();
  if (updateError) {
    console.warn('Error al invalidar token (reseña creada):', updateError);
  }
}
