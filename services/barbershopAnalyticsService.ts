import { supabase } from '@/lib/supabase';
import {
  AnalyticsDateRange,
  BarbershopGlobalStats,
  BarbershopMemberStatsRow,
  BarbershopMonthlyTrendRow,
  BarbershopServiceStatRow,
  BarbershopRetentionStats,
  BarbershopTopClient,
} from '@/types';

// ─── Helpers de rango de fechas ───────────────────────────────────────────────

export interface DateRangeParams {
  start: string;
  end: string;
  label: string;
}

export function getDateRangeParams(
  range: AnalyticsDateRange,
  custom?: { start: string; end: string },
): DateRangeParams {
  const now = new Date();

  if (range === 'custom' && custom) {
    return {
      start: new Date(custom.start + 'T00:00:00').toISOString(),
      end:   new Date(custom.end   + 'T23:59:59').toISOString(),
      label: `${custom.start} – ${custom.end}`,
    };
  }

  const end = now.toISOString();

  switch (range) {
    case 'today': {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      return { start: startOfDay.toISOString(), end, label: 'Hoy' };
    }
    case '7d': {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return { start: d.toISOString(), end, label: 'Últimos 7 días' };
    }
    case '30d': {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return { start: d.toISOString(), end, label: 'Últimos 30 días' };
    }
    case '90d': {
      const d = new Date(now);
      d.setDate(d.getDate() - 90);
      return { start: d.toISOString(), end, label: 'Últimos 90 días' };
    }
    case 'year': {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return { start: startOfYear.toISOString(), end, label: 'Año actual' };
    }
    default: {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return { start: d.toISOString(), end, label: 'Últimos 30 días' };
    }
  }
}

// ─── Estadísticas globales (all-time) ────────────────────────────────────────

const ALL_TIME_START = '2000-01-01T00:00:00.000Z';

export async function getBarbershopAllTimeStats(
  barbershopId: string,
  professionalId?: string | null,
): Promise<BarbershopGlobalStats> {
  return getBarbershopGlobalStats(barbershopId, ALL_TIME_START, new Date().toISOString(), professionalId);
}

// ─── Estadísticas globales (período) ─────────────────────────────────────────

export async function getBarbershopGlobalStats(
  barbershopId: string,
  startDate: string,
  endDate: string,
  professionalId?: string | null,
): Promise<BarbershopGlobalStats> {
  const { data, error } = await supabase.rpc('get_barbershop_stats', {
    p_barbershop_id: barbershopId,
    p_start_date:    startDate,
    p_end_date:      endDate,
    ...(professionalId ? { p_professional_id: professionalId } : {}),
  });
  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  return {
    total_members:          Number(row?.total_members          ?? 0),
    completed_appointments: Number(row?.completed_appointments ?? 0),
    upcoming_appointments:  Number(row?.upcoming_appointments  ?? 0),
    cancelled_appointments: Number(row?.cancelled_appointments ?? 0),
    unique_clients:         Number(row?.unique_clients         ?? 0),
    avg_rating:             Number(row?.avg_rating             ?? 0),
    total_reviews:          Number(row?.total_reviews          ?? 0),
    total_revenue:          Number(row?.total_revenue          ?? 0),
  };
}

// ─── Estadísticas por barbero ─────────────────────────────────────────────────

export async function getBarbershopMemberStats(
  barbershopId: string,
  startDate: string,
  endDate: string,
  professionalId?: string | null,
): Promise<BarbershopMemberStatsRow[]> {
  const { data, error } = await supabase.rpc('get_barbershop_member_stats', {
    p_barbershop_id: barbershopId,
    p_start_date:    startDate,
    p_end_date:      endDate,
    ...(professionalId ? { p_professional_id: professionalId } : {}),
  });
  if (error) throw error;

  return (data ?? []).map(
    (row: Record<string, unknown>): BarbershopMemberStatsRow => ({
      professional_id:        String(row.professional_id        ?? ''),
      professional_name:      String(row.professional_name      ?? ''),
      professional_slug:      String(row.professional_slug      ?? ''),
      profile_image:          row.profile_image != null ? String(row.profile_image) : null,
      role:                   row.role as BarbershopMemberStatsRow['role'],
      completed_appointments: Number(row.completed_appointments ?? 0),
      cancelled_appointments: Number(row.cancelled_appointments ?? 0),
      avg_rating:             Number(row.avg_rating             ?? 0),
      total_revenue:          Number(row.total_revenue          ?? 0),
      unique_clients:         Number(row.unique_clients         ?? 0),
      avg_ticket:             Number(row.avg_ticket             ?? 0),
      booked_hours:           Number(row.booked_hours           ?? 0),
      available_hours:        Number(row.available_hours        ?? 0),
    }),
  );
}

// ─── Tendencia mensual ────────────────────────────────────────────────────────

export async function getBarbershopMonthlyTrend(
  barbershopId: string,
  months: number = 12,
  professionalId?: string | null,
): Promise<BarbershopMonthlyTrendRow[]> {
  const { data, error } = await supabase.rpc('get_barbershop_monthly_trend', {
    p_barbershop_id: barbershopId,
    p_months:        months,
    ...(professionalId ? { p_professional_id: professionalId } : {}),
  });
  if (error) throw error;

  return (data ?? []).map(
    (row: Record<string, unknown>): BarbershopMonthlyTrendRow => ({
      period_start:   String(row.period_start   ?? ''),
      month_label:    String(row.month_label    ?? ''),
      appointments:   Number(row.appointments   ?? 0),
      revenue:        Number(row.revenue        ?? 0),
      unique_clients: Number(row.unique_clients ?? 0),
    }),
  );
}

// ─── Estadísticas de servicios ────────────────────────────────────────────────

export async function getBarbershopServiceStats(
  barbershopId: string,
  startDate: string,
  endDate: string,
  professionalId?: string | null,
): Promise<BarbershopServiceStatRow[]> {
  const { data, error } = await supabase.rpc('get_barbershop_service_stats', {
    p_barbershop_id: barbershopId,
    p_start_date:    startDate,
    p_end_date:      endDate,
    ...(professionalId ? { p_professional_id: professionalId } : {}),
  });
  if (error) throw error;

  return (data ?? []).map(
    (row: Record<string, unknown>): BarbershopServiceStatRow => ({
      service_id:   String(row.service_id   ?? ''),
      service_name: String(row.service_name ?? ''),
      bookings:     Number(row.bookings     ?? 0),
      revenue:      Number(row.revenue      ?? 0),
    }),
  );
}

// ─── Retención de clientes ────────────────────────────────────────────────────

export async function getBarbershopRetention(
  barbershopId: string,
  startDate: string,
  endDate: string,
  professionalId?: string | null,
): Promise<BarbershopRetentionStats> {
  const { data, error } = await supabase.rpc('get_barbershop_retention', {
    p_barbershop_id: barbershopId,
    p_start_date:    startDate,
    p_end_date:      endDate,
    ...(professionalId ? { p_professional_id: professionalId } : {}),
  });
  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  return {
    unique_clients:    Number(row?.unique_clients    ?? 0),
    recurring_clients: Number(row?.recurring_clients ?? 0),
    return_rate:       Number(row?.return_rate       ?? 0),
  };
}

// ─── Top clientes ─────────────────────────────────────────────────────────────

export async function getBarbershopTopClients(
  barbershopId: string,
  startDate: string,
  endDate: string,
  limit: number = 10,
  professionalId?: string | null,
): Promise<BarbershopTopClient[]> {
  const { data, error } = await supabase.rpc('get_barbershop_top_clients', {
    p_barbershop_id: barbershopId,
    p_start_date:    startDate,
    p_end_date:      endDate,
    p_limit:         limit,
    ...(professionalId ? { p_professional_id: professionalId } : {}),
  });
  if (error) throw error;

  return (data ?? []).map(
    (row: Record<string, unknown>): BarbershopTopClient => ({
      client_name:  String(row.client_name  ?? ''),
      client_email: String(row.client_email ?? ''),
      visit_count:  Number(row.visit_count  ?? 0),
      total_spent:  Number(row.total_spent  ?? 0),
      last_visit:   String(row.last_visit   ?? ''),
    }),
  );
}

// ─── Carga paralela de todas las métricas de barbería ────────────────────────

export interface BarbershopAnalyticsData {
  allTimeStats:  BarbershopGlobalStats;
  periodStats:   BarbershopGlobalStats;
  memberStats:   BarbershopMemberStatsRow[];
  monthlyTrend:  BarbershopMonthlyTrendRow[];
  serviceStats:  BarbershopServiceStatRow[];
  retention:     BarbershopRetentionStats;
  topClients:    BarbershopTopClient[];
}

export async function loadBarbershopAnalytics(
  barbershopId: string,
  startDate: string,
  endDate: string,
  professionalId?: string | null,
): Promise<BarbershopAnalyticsData> {
  const [allTimeStats, periodStats, memberStats, monthlyTrend, serviceStats, retention, topClients] =
    await Promise.all([
      getBarbershopAllTimeStats(barbershopId, professionalId),
      getBarbershopGlobalStats(barbershopId, startDate, endDate, professionalId),
      getBarbershopMemberStats(barbershopId, startDate, endDate, professionalId),
      getBarbershopMonthlyTrend(barbershopId, 12, professionalId),
      getBarbershopServiceStats(barbershopId, startDate, endDate, professionalId),
      getBarbershopRetention(barbershopId, startDate, endDate, professionalId),
      getBarbershopTopClients(barbershopId, startDate, endDate, 10, professionalId),
    ]);

  return { allTimeStats, periodStats, memberStats, monthlyTrend, serviceStats, retention, topClients };
}
