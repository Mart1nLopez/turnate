import { supabase } from '@/lib/supabase';
import { Appointment, Service } from '@/types';

export interface DashboardStats {
  todayAppointments: number;
  weeklyAppointments: number;
  monthlyRevenue: number;
  totalClients: number;
}

export async function getDashboardStats(professionalId: string): Promise<DashboardStats> {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Citas de hoy
  const { count: todayCount, error: todayError } = await supabase
    .from('appointments')
    .select('*', { count: 'exact' })
    .eq('professional_id', professionalId)
    .eq('status', 'confirmed')
    .gte('start_time', startOfDay)
    .lte('start_time', endOfDay);
  if (todayError) throw todayError;

  // Citas de esta semana
  const { count: weeklyCount, error: weekError } = await supabase
    .from('appointments')
    .select('*', { count: 'exact' })
    .eq('professional_id', professionalId)
    .eq('status', 'confirmed')
    .gte('start_time', startOfWeek.toISOString());
  if (weekError) throw weekError;

  // Ingresos del mes (estimados)
  const { data: monthlyAppointments, error: monthError } = await supabase
    .from('appointments')
    .select('*, service:services(price)')
    .eq('professional_id', professionalId)
    .eq('status', 'confirmed')
    .gte('start_time', startOfMonth.toISOString());
  if (monthError) throw monthError;

  const monthlyRevenue =
    monthlyAppointments?.reduce((total, apt) => {
      return total + (apt.service?.price || 0);
    }, 0) || 0;

  // Total clientes únicos
  const { data: clients, error: clientsError } = await supabase
    .from('appointments')
    .select('client_id')
    .eq('professional_id', professionalId)
    .not('client_id', 'is', null);
  if (clientsError) throw clientsError;

  const uniqueClients = new Set(clients?.map((c) => c.client_id)).size;

  return {
    todayAppointments: todayCount || 0,
    weeklyAppointments: weeklyCount || 0,
    monthlyRevenue,
    totalClients: uniqueClients,
  };
}

export async function getTodayAppointments(
  professionalId: string,
): Promise<(Appointment & { service?: Service; client?: { name: string } })[]> {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('*, service:services(name, duration_minutes), client:clients(name)')
    .eq('professional_id', professionalId)
    .eq('status', 'confirmed')
    .gte('start_time', startOfDay)
    .lte('start_time', endOfDay)
    .order('start_time', { ascending: true });
  if (error) throw error;
  return appointments || [];
}
