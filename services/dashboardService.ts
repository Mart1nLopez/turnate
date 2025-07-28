import { supabase } from '@/lib/supabase';
import { Appointment, Service } from '@/types';

export interface DashboardStats {
  todayAppointments: number;
  weeklyAppointments: number;
  monthlyRevenue: number;
  totalClients: number;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  conversionRate: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  appointments: number;
}

export interface ServiceStats {
  name: string;
  appointments: number;
  revenue: number;
  percentage: number;
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
  if (todayError) throw new Error(todayError.message || 'Error al obtener las citas de hoy');

  // Citas de esta semana
  const { count: weeklyCount, error: weekError } = await supabase
    .from('appointments')
    .select('*', { count: 'exact' })
    .eq('professional_id', professionalId)
    .eq('status', 'confirmed')
    .gte('start_time', startOfWeek.toISOString());
  if (weekError) throw new Error(weekError.message || 'Error al obtener las citas de la semana');

  // Total de citas del profesional (conteo real, sin límite)
  const { count: totalAppointments, error: totalError } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('professional_id', professionalId);
  if (totalError) throw new Error(totalError.message || 'Error al obtener el total de citas');

  // Citas completadas
  const { count: completedAppointments, error: completedError } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('professional_id', professionalId)
    .eq('status', 'completed');
  if (completedError) throw new Error(completedError.message || 'Error al obtener las citas completadas');

  // Citas canceladas
  const { count: cancelledAppointments, error: cancelledError } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('professional_id', professionalId)
    .in('status', ['cancelled_by_pro', 'cancelled_by_client']);
  if (cancelledError) throw new Error(cancelledError.message || 'Error al obtener las citas canceladas');

  const conversionRate =
    totalAppointments && completedAppointments ? (completedAppointments / totalAppointments) * 100 : 0;

  // Ingresos del mes (estimados)
  const { data: monthlyAppointments, error: monthError } = await supabase
    .from('appointments')
    .select('*, service:services(price)')
    .eq('professional_id', professionalId)
    .eq('status', 'completed')
    .gte('start_time', startOfMonth.toISOString());
  if (monthError) throw new Error(monthError.message || 'Error al obtener los ingresos del mes');

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
  if (clientsError) throw new Error(clientsError.message || 'Error al obtener los clientes');

  const uniqueClients = new Set(clients?.map((c) => c.client_id)).size;

  return {
    todayAppointments: todayCount || 0,
    weeklyAppointments: weeklyCount || 0,
    monthlyRevenue,
    totalClients: uniqueClients,
    totalAppointments: totalAppointments || 0,
    completedAppointments: completedAppointments || 0,
    cancelledAppointments: cancelledAppointments || 0,
    conversionRate,
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
  if (error) throw new Error(error.message || 'Error al obtener las citas de hoy');
  return appointments || [];
}

export async function getMonthlyRevenue(professionalId: string): Promise<MonthlyRevenue[]> {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1); // Incluye el mes actual y 5 anteriores

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('start_time, service:services(price)')
    .eq('professional_id', professionalId)
    .eq('status', 'completed')
    .gte('start_time', sixMonthsAgo.toISOString())
    .order('start_time', { ascending: true })
    .limit(10000);

  if (error) throw new Error(error.message || 'Error al obtener los ingresos mensuales');

  const monthlyData: { [key: string]: { revenue: number; appointments: number } } = {};

  appointments?.forEach((appointment: { start_time: string; service?: { price?: number }[] | { price?: number } }) => {
    const date = new Date(appointment.start_time);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { revenue: 0, appointments: 0 };
    }

    // Soporta service como array o como objeto
    let price = 0;
    if (Array.isArray(appointment.service)) {
      price = appointment.service[0]?.price || 0;
    } else if (appointment.service && typeof appointment.service === 'object') {
      price = appointment.service.price || 0;
    }
    monthlyData[monthKey].revenue += price;
    monthlyData[monthKey].appointments += 1;
  });

  // Asegura que siempre se devuelvan los últimos 6 meses aunque no haya datos
  const result: MonthlyRevenue[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    result.push({
      month: key,
      revenue: monthlyData[key]?.revenue || 0,
      appointments: monthlyData[key]?.appointments || 0,
    });
  }
  return result;
}

export async function getMonthlyAppointments(professionalId: string): Promise<{
  total: number;
  completed: number;
  cancelled: number;
  conversionRate: number;
}> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Total de citas del mes actual (todas las citas programadas)
  const { count: totalMonthly, error: totalError } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('professional_id', professionalId)
    .gte('start_time', startOfMonth.toISOString())
    .lte('start_time', endOfMonth.toISOString());

  if (totalError) throw new Error(totalError.message || 'Error al obtener las citas del mes');

  // Citas completadas del mes
  const { count: completedMonthly, error: completedError } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('professional_id', professionalId)
    .eq('status', 'completed')
    .gte('start_time', startOfMonth.toISOString())
    .lte('start_time', endOfMonth.toISOString());

  if (completedError) throw new Error(completedError.message || 'Error al obtener las citas completadas del mes');

  // Citas canceladas del mes
  const { count: cancelledMonthly, error: cancelledError } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('professional_id', professionalId)
    .in('status', ['cancelled_by_pro', 'cancelled_by_client'])
    .gte('start_time', startOfMonth.toISOString())
    .lte('start_time', endOfMonth.toISOString());

  if (cancelledError) throw new Error(cancelledError.message || 'Error al obtener las citas canceladas del mes');

  const conversionRate = totalMonthly && completedMonthly ? (completedMonthly / totalMonthly) * 100 : 0;

  return {
    total: totalMonthly || 0,
    completed: completedMonthly || 0,
    cancelled: cancelledMonthly || 0,
    conversionRate,
  };
}

export async function getServiceStats(professionalId: string): Promise<ServiceStats[]> {
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('service:services(name, price)')
    .eq('professional_id', professionalId)
    .eq('status', 'completed')
    .not('service_id', 'is', null)
    .limit(10000);

  if (error) throw new Error(error.message || 'Error al obtener las estadísticas de servicios');

  const serviceData: { [key: string]: { appointments: number; revenue: number } } = {};
  let totalAppointments = 0;

  appointments?.forEach(
    (appointment: { service?: { name?: string; price?: number }[] | { name?: string; price?: number } }) => {
      let service: { name?: string; price?: number } | undefined;
      if (Array.isArray(appointment.service)) {
        service = appointment.service[0];
      } else if (appointment.service && typeof appointment.service === 'object') {
        service = appointment.service;
      }
      if (service?.name) {
        const serviceName = service.name;
        if (!serviceData[serviceName]) {
          serviceData[serviceName] = { appointments: 0, revenue: 0 };
        }
        serviceData[serviceName].appointments += 1;
        serviceData[serviceName].revenue += service.price || 0;
        totalAppointments += 1;
      }
    },
  );

  return Object.entries(serviceData).map(([name, data]) => ({
    name,
    appointments: data.appointments,
    revenue: data.revenue,
    percentage: totalAppointments > 0 ? (data.appointments / totalAppointments) * 100 : 0,
  }));
}
