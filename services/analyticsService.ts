import { supabase } from '@/lib/supabase';
import { Service, Review } from '@/types';
import { AnalyticsDateRange } from '@/types';

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

function getAnalyticsDateRange(
  range: AnalyticsDateRange,
  customDates?: { start: string; end: string },
): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);

  if (range === 'custom' && customDates?.start && customDates?.end) {
    // T00:00:00 y T23:59:59 evitan problemas de timezone con Date('YYYY-MM-DD')
    const start = new Date(customDates.start + 'T00:00:00');
    const customEnd = new Date(customDates.end + 'T23:59:59');
    return { start, end: customEnd };
  }

  switch (range) {
    case 'today': {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case '7d': {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      return { start, end };
    }
    case '30d': {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      return { start, end };
    }
    case '90d': {
      const start = new Date(now);
      start.setDate(start.getDate() - 90);
      return { start, end };
    }
    case 'year': {
      const start = new Date(now.getFullYear(), 0, 1);
      return { start, end };
    }
    default:
      return { start: new Date('2000-01-01'), end };
  }
}

export async function getAnalyticsStats(
  professionalId: string,
  dateRange: AnalyticsDateRange = 'year',
  customDates?: { start: string; end: string },
): Promise<AdvancedStats> {
  const now = new Date();
  const { start: rangeStart, end: rangeEnd } = getAnalyticsDateRange(dateRange, customDates);

  const currentMonthStart  = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0);

  // Carga solo citas dentro del rango seleccionado (fix bug #3: antes cargaba TODO sin límite)
  const { data: rangeAppointments, error: appointmentsError } = await supabase
    .from('appointments')
    .select('*, service:services(*), client:clients(*)')
    .eq('professional_id', professionalId)
    .gte('start_time', rangeStart.toISOString())
    .lte('start_time', rangeEnd.toISOString())
    .order('start_time', { ascending: false });
  if (appointmentsError) throw appointmentsError;

  // Para citas de hoy y próximas siempre consultamos sin filtro de rango
  const { data: allAppointments, error: allApptError } = await supabase
    .from('appointments')
    .select('id, start_time, status, service_id')
    .eq('professional_id', professionalId);
  if (allApptError) throw allApptError;

  // Reseñas siempre all-time (el rating histórico no cambia con el rango)
  const { data: allReviews, error: reviewsError } = await supabase
    .from('reviews')
    .select('*')
    .eq('professional_id', professionalId);
  if (reviewsError) throw reviewsError;

  if (!rangeAppointments || !allReviews) throw new Error('No se pudieron cargar los datos');

  // FIX BUG #1: Usar 'completed' para métricas históricas (ingresos, cortes realizados).
  // 'confirmed' = citas pendientes de realizarse — no deben contarse como ingresos.
  const completedInRange = rangeAppointments.filter((apt) => apt.status === 'completed');

  // Estadísticas básicas del rango
  const totalAppointments = completedInRange.length;
  const uniqueClients     = new Set(completedInRange.map((apt) => apt.client_id)).size;
  const totalRevenue      = completedInRange.reduce(
    (sum, apt) => sum + ((apt.service as Service | null)?.price ?? 0),
    0,
  );

  const averageRating =
    allReviews.length > 0
      ? (allReviews as Review[]).reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 0;

  // Mes actual vs anterior (siempre calculado, independiente del rango visual)
  const currentMonthCompleted = (rangeAppointments as typeof rangeAppointments).filter((apt) => {
    return apt.status === 'completed' && new Date(apt.start_time) >= currentMonthStart;
  });
  const previousMonthCompleted = rangeAppointments.filter((apt) => {
    const d = new Date(apt.start_time);
    return apt.status === 'completed' && d >= previousMonthStart && d <= previousMonthEnd;
  });

  const currentMonthRevenue  = currentMonthCompleted.reduce(
    (sum, apt) => sum + ((apt.service as Service | null)?.price ?? 0),
    0,
  );
  const previousMonthRevenue = previousMonthCompleted.reduce(
    (sum, apt) => sum + ((apt.service as Service | null)?.price ?? 0),
    0,
  );

  // Top servicios (solo completadas)
  const serviceStats = new Map<string, { service: Service; count: number; revenue: number }>();
  completedInRange.forEach((apt) => {
    const svc = apt.service as Service | null;
    if (svc) {
      const existing = serviceStats.get(svc.id);
      if (existing) {
        existing.count++;
        existing.revenue += svc.price;
      } else {
        serviceStats.set(svc.id, { service: svc, count: 1, revenue: svc.price });
      }
    }
  });
  const topServices = Array.from(serviceStats.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Horas pico (solo completadas)
  const hourStats = new Map<number, number>();
  completedInRange.forEach((apt) => {
    const hour = new Date(apt.start_time).getHours();
    hourStats.set(hour, (hourStats.get(hour) ?? 0) + 1);
  });
  const peakHours = Array.from(hourStats.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Tendencia semanal — últimas 8 semanas (sobre completadas del rango)
  const weeklyTrend = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - i * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekAppts = completedInRange.filter((apt) => {
      const d = new Date(apt.start_time);
      return d >= weekStart && d <= weekEnd;
    });
    weeklyTrend.push({
      week:         `${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
      appointments: weekAppts.length,
      revenue:      weekAppts.reduce(
        (sum, apt) => sum + ((apt.service as Service | null)?.price ?? 0),
        0,
      ),
    });
  }

  // Distribución de calificaciones (siempre all-time)
  const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => ({
    rating,
    count: (allReviews as Review[]).filter((r) => r.rating === rating).length,
  }));

  // Citas de hoy (todas las citas, independiente del rango del filtro)
  const today     = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow  = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const todayAppointments = (allAppointments ?? []).filter((apt) => {
    const d = new Date(apt.start_time);
    return d >= today && d < tomorrow;
  }).length;

  // Próximas citas confirmadas (pendientes de realizarse)
  const upcomingAppointments = (allAppointments ?? []).filter(
    (apt) => apt.status === 'confirmed' && new Date(apt.start_time) > now,
  ).length;

  // Duración promedio de sesión
  const averageSessionDuration =
    completedInRange.length > 0
      ? completedInRange.reduce(
          (sum, apt) => sum + ((apt.service as Service | null)?.duration_minutes ?? 0),
          0,
        ) / completedInRange.length
      : 0;

  return {
    totalAppointments,
    totalClients: uniqueClients,
    totalRevenue,
    averageRating,
    totalReviews:              allReviews.length,
    currentMonthAppointments:  currentMonthCompleted.length,
    previousMonthAppointments: previousMonthCompleted.length,
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
