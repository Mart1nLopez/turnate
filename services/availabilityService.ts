import { supabase } from '@/lib/supabase';
import { Availability } from '@/types';

export async function getAvailabilityByProfessionalId(professionalId: string): Promise<Availability[]> {
  const { data, error } = await supabase
    .from('availability')
    .select('*')
    .eq('professional_id', professionalId)
    .eq('is_available', true)
    .order('day_of_week', { ascending: true });
  if (error) throw error;
  // Asegurar que day_of_week sea número
  return (data || []).map((item) => ({
    ...item,
    day_of_week: typeof item.day_of_week === 'string' ? parseInt(item.day_of_week) : item.day_of_week,
  }));
}

export async function createAvailability(data: Omit<Availability, 'id' | 'created_at'>): Promise<Availability> {
  const { data: created, error } = await supabase.from('availability').insert([data]).select().single();
  if (error) throw error;
  return created;
}

export async function updateAvailability(id: string, data: Partial<Availability>): Promise<Availability> {
  const { data: updated, error } = await supabase.from('availability').update(data).eq('id', id).select().single();
  if (error) throw error;
  return updated;
}

export async function deleteAvailability(id: string): Promise<void> {
  const { error } = await supabase.from('availability').delete().eq('id', id);
  if (error) throw error;
}
