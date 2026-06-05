import { supabase } from '@/lib/supabase';
import { Professional, Service, Review } from '@/types';

export interface ReviewWithClient extends Review {
  appointment?: {
    service?: {
      name: string;
    };
  };
}

export async function getProfessionalBySlug(slug: string): Promise<Professional> {
  const { data, error } = await supabase.from('professionals').select('*').eq('slug', slug).single();
  if (error || !data) throw new Error('Profesional no encontrado');
  return data;
}

export async function getServicesByProfessionalId(professionalId: string): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('professional_id', professionalId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getReviewsByProfessionalId(professionalId: string, limit = 10): Promise<ReviewWithClient[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(`*, appointment:appointments(service:services(name))`)
    .eq('professional_id', professionalId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

// Retorna la barbería activa del profesional para mostrar "Trabaja en [Barbería]"
// en su perfil público. Devuelve null si es profesional independiente.
// Funciona con anon (RLS bm_select_public_active + barbershops_select_public).
export async function getActiveBarbershopByProfessionalId(
  professionalId: string,
): Promise<{ name: string; slug: string } | null> {
  const { data, error } = await supabase
    .from('barbershop_members')
    .select('barbershop:barbershops(name, slug)')
    .eq('professional_id', professionalId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) throw error;
  return (data?.barbershop as { name: string; slug: string } | undefined) ?? null;
}
