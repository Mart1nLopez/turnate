import { supabase } from '@/lib/supabase';
import { Professional } from '@/types';

export async function getProfessionalProfile(): Promise<Professional> {
  const { professional, error } = await (await import('@/lib/supabase')).getCurrentProfessional();
  if (error || !professional) throw error || new Error('No se encontró el profesional');
  return professional;
}

export async function updateProfessionalProfile(id: string, updateData: Partial<Professional>): Promise<void> {
  const { error } = await supabase.from('professionals').update(updateData).eq('id', id);
  if (error) throw error;
}

export async function removeProfileImage(id: string): Promise<void> {
  const { error } = await supabase.from('professionals').update({ profile_image: null }).eq('id', id);
  if (error) throw error;
}

export async function checkSlugAvailability(slug: string, currentProfessionalId?: string): Promise<boolean> {
  if (!slug || slug.trim() === '') return false;
  const { data, error } = await supabase.from('professionals').select('id').eq('slug', slug).single();
  if (error && error.code === 'PGRST116') {
    // No se encontró ningún registro, el slug está disponible
    return true;
  }
  if (error) {
    console.error('Error checking slug:', error);
    return false;
  }
  // Si se encontró un registro, el slug ya existe, pero si es el mismo profesional, es válido
  if (data && currentProfessionalId && data.id === currentProfessionalId) return true;
  return false;
}
