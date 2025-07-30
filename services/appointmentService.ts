import { supabase } from '@/lib/supabase';
import { Client } from '@/types';
import { Service } from '@/types';

export type AppointmentWithDetails = import('@/types').Appointment & {
  service?: Service;
  client?: Client;
};

// Obtener conteo total de citas (sin límite)
export async function getTotalAppointmentsCount(professionalId: string): Promise<number> {
  const { count, error } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('professional_id', professionalId);
  if (error) throw error;
  return count || 0;
}

// Obtener conteos por estado
export async function getAppointmentCountsByStatus(professionalId: string): Promise<{
  confirmed: number;
  completed: number;
  cancelledByPro: number;
  cancelledByClient: number;
}> {
  const [confirmedRes, completedRes, cancelledByProRes, cancelledByClientRes] = await Promise.all([
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('professional_id', professionalId)
      .eq('status', 'confirmed'),
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('professional_id', professionalId)
      .eq('status', 'completed'),
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('professional_id', professionalId)
      .eq('status', 'cancelled_by_pro'),
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('professional_id', professionalId)
      .eq('status', 'cancelled_by_client'),
  ]);

  if (confirmedRes.error || completedRes.error || cancelledByProRes.error || cancelledByClientRes.error) {
    throw new Error('Error al obtener conteos por estado');
  }

  return {
    confirmed: confirmedRes.count || 0,
    completed: completedRes.count || 0,
    cancelledByPro: cancelledByProRes.count || 0,
    cancelledByClient: cancelledByClientRes.count || 0,
  };
}

// Obtener citas con filtros aplicados directamente en la base de datos (más eficiente)
export async function getFilteredAppointmentsByProfessionalId(
  professionalId: string,
  filters: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    serviceId?: string;
    limit?: number;
  } = {},
): Promise<AppointmentWithDetails[]> {
  let query = supabase
    .from('appointments')
    .select(`*, service:services(name, price, duration_minutes, description), client:clients(name, email, phone)`)
    .eq('professional_id', professionalId);

  // Aplicar filtros
  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters.dateFrom) {
    query = query.gte('start_time', filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte('start_time', filters.dateTo);
  }

  if (filters.serviceId) {
    query = query.eq('service_id', filters.serviceId);
  }

  // Ordenar y limitar
  query = query.order('start_time', { ascending: false });

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// Obtener citas históricas (antes de hoy) - solo cuando se necesite específicamente
export async function getHistoricalAppointmentsByProfessionalId(
  professionalId: string,
  limit: number = 100,
): Promise<AppointmentWithDetails[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('appointments')
    .select(`*, service:services(name, price, duration_minutes, description), client:clients(name, email, phone)`)
    .eq('professional_id', professionalId)
    .lt('start_time', today.toISOString())
    .order('start_time', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

// Obtener citas de los próximos 7 días
export async function getNext7DaysAppointments(professionalId: string): Promise<AppointmentWithDetails[]> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  sevenDaysFromNow.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('appointments')
    .select(`*, service:services(name, price, duration_minutes, description), client:clients(name, email, phone)`)
    .eq('professional_id', professionalId)
    .gte('start_time', startOfToday)
    .lt('start_time', sevenDaysFromNow.toISOString())
    .order('start_time', { ascending: true });
  if (error) throw error;
  return data || [];
}

// Obtener citas desde hoy hasta los próximos 30 días (por defecto)
export async function getAppointmentsByProfessionalId(
  professionalId: string,
  fromDate?: string,
  toDate?: string,
): Promise<AppointmentWithDetails[]> {
  // Si no se especifican fechas, usar desde hoy hasta 30 días adelante
  if (!fromDate || !toDate) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    thirtyDaysFromNow.setHours(23, 59, 59, 999);
    fromDate = startOfToday;
    toDate = thirtyDaysFromNow.toISOString();
  }

  const { data, error } = await supabase
    .from('appointments')
    .select(`*, service:services(name, price, duration_minutes, description), client:clients(name, email, phone)`)
    .eq('professional_id', professionalId)
    .gte('start_time', fromDate)
    .lt('start_time', toDate)
    .order('start_time', { ascending: true }); // Cambiar a ascendente para ver las próximas primero
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
