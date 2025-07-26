import { supabase } from '@/lib/supabase';
import { UnavailableDate } from '@/types';

export async function getUnavailableDatesByProfessionalId(professionalId: string): Promise<UnavailableDate[]> {
  const { data, error } = await supabase
    .from('unavailable_dates')
    .select('*')
    .eq('professional_id', professionalId)
    .order('date', { ascending: true });
  if (error) throw new Error('No se pudieron cargar los días libres');
  return data || [];
}

export async function createUnavailableDates(
  dates: { professional_id: string; date: string; reason: string }[],
): Promise<UnavailableDate[]> {
  const { data, error } = await supabase.from('unavailable_dates').insert(dates).select();
  if (error) throw new Error('No se pudieron crear los días libres');
  return data || [];
}

export async function updateUnavailableDates(ids: string[], update: Partial<UnavailableDate>): Promise<void> {
  const { error } = await supabase.from('unavailable_dates').update(update).in('id', ids);
  if (error) throw new Error('No se pudo actualizar el motivo de los días libres');
}

export async function updateUnavailableDate(id: string, update: Partial<UnavailableDate>): Promise<void> {
  const { error } = await supabase.from('unavailable_dates').update(update).eq('id', id);
  if (error) throw new Error('No se pudo actualizar el día libre');
}

export async function deleteUnavailableDates(ids: string[]): Promise<void> {
  const { error } = await supabase.from('unavailable_dates').delete().in('id', ids);
  if (error) throw new Error('No se pudieron eliminar los días libres');
}
