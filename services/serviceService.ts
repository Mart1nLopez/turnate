import { supabase } from '@/lib/supabase';
import { Service } from '@/types';

export type ServiceInput = {
  name: string;
  description?: string;
  price: number;
  duration_minutes: number;
  image_url?: string;
  professional_id: string;
};

export async function getServicesByProfessionalId(professionalId: string): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('professional_id', professionalId)
    .order('created_at', { ascending: false });
  if (error) throw new Error('No se pudieron cargar los servicios');
  return data || [];
}

export async function createService(serviceData: ServiceInput): Promise<Service> {
  const { data, error } = await supabase.from('services').insert([serviceData]).select().single();
  if (error) throw new Error('No se pudo crear el servicio');
  return data;
}

export async function updateService(serviceId: string, serviceData: Partial<Service>): Promise<void> {
  const { error } = await supabase.from('services').update(serviceData).eq('id', serviceId);
  if (error) throw new Error('No se pudo actualizar el servicio');
}

export async function deleteService(serviceId: string): Promise<void> {
  const { error } = await supabase.from('services').delete().eq('id', serviceId);
  if (error) throw new Error('No se pudo eliminar el servicio');
}
