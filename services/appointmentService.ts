import { Service } from '@/types';

export type AppointmentWithDetails = import('@/types').Appointment & {
  service?: Service;
  client?: Client;
};

export async function getAppointmentsByProfessionalId(professionalId: string): Promise<AppointmentWithDetails[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select(`*, service:services(name, price, duration_minutes, description), client:clients(name, email, phone)`)
    .eq('professional_id', professionalId)
    .order('start_time', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getAppointmentById(
  appointmentId: string,
  professionalId: string,
): Promise<AppointmentWithDetails | null> {
  const { data, error } = await supabase
    .from('appointments')
    .select(`*, service:services(name, price, duration_minutes, description), client:clients(name, email, phone)`)
    .eq('id', appointmentId)
    .eq('professional_id', professionalId)
    .single();
  if (error) throw error;
  return data || null;
}

export async function updateAppointmentStatus(appointmentId: string, status: string): Promise<void> {
  const { error } = await supabase.from('appointments').update({ status }).eq('id', appointmentId);
  if (error) throw error;
}

export async function cancelAppointmentByProfessional(appointmentId: string): Promise<void> {
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'cancelled_by_pro', cancellation_token: null })
    .eq('id', appointmentId);
  if (error) throw error;
}

export async function completeAppointment(appointmentId: string): Promise<void> {
  const { error } = await supabase.from('appointments').update({ status: 'completed' }).eq('id', appointmentId);
  if (error) throw error;
}
import { supabase } from '@/lib/supabase';
import { Client } from '@/types';

export async function getProfessionalBySlug(slug: string) {
  const { data, error } = await supabase.from('professionals').select('*').eq('slug', slug).single();
  if (error || !data) throw new Error('No se encontró el profesional');
  return data;
}

export async function getServicesByProfessionalId(professionalId: string) {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('professional_id', professionalId)
    .order('created_at', { ascending: true });
  if (error) throw new Error('No se pudieron cargar los servicios');
  return data || [];
}

export async function getAvailabilityByProfessionalId(professionalId: string) {
  const { data, error } = await supabase.from('availability').select('*').eq('professional_id', professionalId);
  if (error) throw new Error('No se pudo cargar la disponibilidad');
  return data || [];
}

export async function getUnavailableDatesByProfessionalId(professionalId: string) {
  const { data, error } = await supabase.from('unavailable_dates').select('*').eq('professional_id', professionalId);
  if (error) throw new Error('No se pudieron cargar los días no disponibles');
  return data || [];
}

export async function getExistingAppointmentsForDay(professionalId: string, dateString: string) {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('professional_id', professionalId)
    .gte('start_time', `${dateString}T00:00:00`)
    .lt('start_time', `${dateString}T23:59:59`)
    .eq('status', 'confirmed');
  if (error) throw new Error('No se pudieron cargar las citas existentes');
  return data || [];
}

export async function getClientByEmail(email: string): Promise<Client | null> {
  const { data, error } = await supabase.from('clients').select('*').eq('email', email).single();
  if (error && error.code !== 'PGRST116') throw new Error('Error al buscar cliente');
  return data || null;
}

export async function updateClient(clientId: string, name: string, phone: string): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .update({ name, phone, updated_at: new Date().toISOString() })
    .eq('id', clientId)
    .select()
    .single();
  if (error) throw new Error('Error al actualizar cliente');
  return data;
}

export async function createClient(name: string, email: string, phone: string): Promise<Client> {
  const { data, error } = await supabase.from('clients').insert({ name, email, phone }).select().single();
  if (error) throw new Error('Error al crear cliente');
  return data;
}

export async function createAppointment({
  professionalId,
  serviceId,
  clientId,
  startTime,
  endTime,
  cancellationToken,
  reviewToken,
}: {
  professionalId: string;
  serviceId: string;
  clientId: string;
  startTime: string;
  endTime: string;
  cancellationToken: string;
  reviewToken: string;
}): Promise<void> {
  const { error } = await supabase
    .from('appointments')
    .insert({
      professional_id: professionalId,
      service_id: serviceId,
      client_id: clientId,
      start_time: startTime,
      end_time: endTime,
      status: 'confirmed',
      cancellation_token: cancellationToken,
      review_token: reviewToken,
    })
    .select()
    .single();
  if (error) throw new Error('Error al crear la cita');
}
