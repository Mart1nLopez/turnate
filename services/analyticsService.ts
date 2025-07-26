import { supabase } from '@/lib/supabase';
import { Service, Appointment, Review } from '@/types';

export interface AdvancedStats {
  totalAppointments: number;
  totalClients: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
  currentMonthAppointments: number;
  previousMonthAppointments: number;
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  topServices: Array<{
    service: Service;
    count: number;
    revenue: number;
  }>;
  averageSessionDuration: number;
  peakHours: Array<{
    hour: number;
    count: number;
  }>;
  weeklyTrend: Array<{
    week: string;
    appointments: number;
    revenue: number;
  }>;
  ratingDistribution: Array<{
    rating: number;
    count: number;
  }>;
  upcomingAppointments: number;
  todayAppointments: number;
}

export async function getAnalyticsStats(professionalId: string): Promise<AdvancedStats> {
  // Calcular fechas para comparación
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  // Obtener todas las citas
  const { data: allAppointments, error: appointmentsError } = await supabase
    .from('appointments')
    .select(`*, service:services(*), client:clients(*)`)
    .eq('professional_id', professionalId)
    .order('start_time', { ascending: false });
  if (appointmentsError) throw appointmentsError;

  // Obtener todas las reseñas
  const { data: allReviews, error: reviewsError } = await supabase
    .from('reviews')
    .select('*')
    .eq('professional_id', professionalId);
  if (reviewsError) throw reviewsError;

  if (!allAppointments || !allReviews) throw new Error('No se pudieron cargar los datos');

  // Filtrar citas confirmadas
  const confirmedAppointments = (allAppointments as Appointment[]).filter((apt) => apt.status === 'confirmed');

  // Estadísticas básicas
  const totalAppointments = confirmedAppointments.length;
  const uniqueClients = new Set(confirmedAppointments.map((apt) => apt.client_id)).size;
  const totalRevenue = confirmedAppointments.reduce((sum, apt) => sum + (apt.service?.price || 0), 0);
  const averageRating =
    allReviews.length > 0 ?
      (allReviews as Review[]).reduce((sum, review) => sum + review.rating, 0) / allReviews.length
    : 0;

  // Estadísticas del mes actual vs anterior
  const currentMonthAppointments = confirmedAppointments.filter((apt) => new Date(apt.start_time) >= currentMonthStart);
  const previousMonthAppointments = confirmedAppointments.filter((apt) => {
    const aptDate = new Date(apt.start_time);
    return aptDate >= previousMonthStart && aptDate <= previousMonthEnd;
  });

  const currentMonthRevenue = currentMonthAppointments.reduce((sum, apt) => sum + (apt.service?.price || 0), 0);
  const previousMonthRevenue = previousMonthAppointments.reduce((sum, apt) => sum + (apt.service?.price || 0), 0);

  // Top servicios
  const serviceStats = new Map<string, { service: Service; count: number; revenue: number }>();
  confirmedAppointments.forEach((apt) => {
    if (apt.service) {
      const key = apt.service.id;
      const existing = serviceStats.get(key);
      if (existing) {
        existing.count++;
        existing.revenue += apt.service.price;
      } else {
        serviceStats.set(key, {
          service: apt.service,
          count: 1,
          revenue: apt.service.price,
        });
      }
    }
  });
  const topServices = Array.from(serviceStats.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Horas pico
  const hourStats = new Map<number, number>();
  confirmedAppointments.forEach((apt) => {
    const hour = new Date(apt.start_time).getHours();
    hourStats.set(hour, (hourStats.get(hour) || 0) + 1);
  });
  const peakHours = Array.from(hourStats.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Tendencia semanal (últimas 8 semanas)
  const weeklyTrend = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - i * 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekAppointments = confirmedAppointments.filter((apt) => {
      const aptDate = new Date(apt.start_time);
      return aptDate >= weekStart && aptDate <= weekEnd;
    });

    const weekRevenue = weekAppointments.reduce((sum, apt) => sum + (apt.service?.price || 0), 0);

    weeklyTrend.push({
      week: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
      appointments: weekAppointments.length,
      revenue: weekRevenue,
    });
  }

  // Distribución de calificaciones
  const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => ({
    rating,
    count: (allReviews as Review[]).filter((review) => review.rating === rating).length,
  }));

  // Citas de hoy y próximas
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayAppointments = confirmedAppointments.filter((apt) => {
    const aptDate = new Date(apt.start_time);
    return aptDate >= today && aptDate < tomorrow;
  }).length;

  const upcomingAppointments = confirmedAppointments.filter((apt) => new Date(apt.start_time) > now).length;

  // Duración promedio de sesión (en minutos)
  const averageSessionDuration =
    confirmedAppointments.length > 0 ?
      confirmedAppointments.reduce((sum, apt) => sum + (apt.service?.duration_minutes || 0), 0) /
      confirmedAppointments.length
    : 0;

  return {
    totalAppointments,
    totalClients: uniqueClients,
    totalRevenue,
    averageRating,
    totalReviews: allReviews.length,
    currentMonthAppointments: currentMonthAppointments.length,
    previousMonthAppointments: previousMonthAppointments.length,
    currentMonthRevenue,
    previousMonthRevenue,
    topServices,
    averageSessionDuration,
    peakHours,
    weeklyTrend,
    ratingDistribution,
    upcomingAppointments,
    todayAppointments,
  };
}
